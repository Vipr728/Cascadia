import { NextRequest, NextResponse } from 'next/server';
const twilio = require('twilio');

const SYSTEM_PROMPT = "You are a helpful assistant. This conversation is being translated to voice, so answer carefully. When you respond, please spell out all numbers, for example twenty not 20. Do not include emojis in your responses. Do not include bullet points, asterisks, or special symbols.";

export async function GET() {
  const ngrokUrl = process.env.NGROK_WS_URL || 'ws://localhost:8080';
  return NextResponse.json({ 
    status: 'AI Voice Assistant Ready',
    websocketUrl: ngrokUrl,
    note: ngrokUrl.includes('localhost') ? 'Warning: Using localhost - Twilio cannot connect. Please use ngrok.' : 'Using public URL'
  });
}

export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const action = url.searchParams.get('action') || 'call';
  
  try {
    // Gather env/config upfront for diagnostics
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;
    const wsUrl = process.env.NGROK_WS_URL || 'wss://your-ngrok-url.ngrok.io';

    console.log('[VOICE API] Incoming action:', action);
    console.log('[VOICE API] Env summary:', {
      hasAccountSid: !!accountSid,
      hasAuthToken: !!authToken,
      hasFromNumber: !!fromNumber,
      wsUrl,
    });

    // Optional diagnostics mode (no call made)
    if (action === 'diagnose') {
      const isLocalhost = wsUrl.includes('localhost');
      const isWss = wsUrl.startsWith('wss://');
      return NextResponse.json({
        diagnostics: {
          twilio: {
            TWILIO_ACCOUNT_SID: !!accountSid,
            TWILIO_AUTH_TOKEN: !!authToken,
            TWILIO_PHONE_NUMBER: !!fromNumber,
          },
          websocket: {
            NGROK_WS_URL: wsUrl,
            isLocalhost,
            isWss,
            hint: 'Run: ngrok http <WS_PORT>, set NGROK_WS_URL to the wss:// URL, then retry',
          },
        },
      });
    }

    if (action === 'call') {
      // Make outgoing call using ConversationRelay
      const body = await request.json().catch(() => ({}));
      const targetNumber = body.to || '+14253128646';
      const requestedLang: string = body.language || 'en-US';

      const langMap: Record<string, { ttsVoice: string; welcome: string; transcriptionLanguage: string; ttsLanguage: string }>= {
        'en-US': { ttsVoice: 'Polly.Joanna', welcome: "Hi! I'm your AI assistant. What can I help you with today?", transcriptionLanguage: 'en-US', ttsLanguage: 'en-US' },
        'es-MX': { ttsVoice: 'Mia-Neural', welcome: '¡Hola! Soy tu asistente de IA. ¿En qué puedo ayudarte?', transcriptionLanguage: 'es-MX', ttsLanguage: 'es-MX' },
        'ru-RU': { ttsVoice: 'Tatyana-Neural', welcome: 'Привет! Я ваш голосовой ассистент. Чем могу помочь?', transcriptionLanguage: 'ru-RU', ttsLanguage: 'ru-RU' },
        'fr-FR': { ttsVoice: 'Lea', welcome: "Bonjour ! Je suis votre assistant IA. Comment puis-je vous aider ?", transcriptionLanguage: 'fr-FR', ttsLanguage: 'fr-FR' },
      };
      const langCfg = langMap[requestedLang] || langMap['en-US'];
      
      console.log('📞 Making call to:', targetNumber);

      if (!accountSid || !authToken || !fromNumber) {
        console.error('❌ Missing Twilio credentials');
        return NextResponse.json({
          error: 'Missing Twilio credentials',
          missing: {
            TWILIO_ACCOUNT_SID: !!accountSid,
            TWILIO_AUTH_TOKEN: !!authToken,
            TWILIO_PHONE_NUMBER: !!fromNumber,
          }
        }, { status: 500 });
      }

      const client = twilio(accountSid, authToken);
      console.log('🔗 Using WebSocket URL:', wsUrl);
      
      if (wsUrl.includes('localhost')) {
        console.error('❌ ERROR: Cannot use localhost URL for Twilio ConversationRelay!');
        console.error('� Solution: Start ngrok tunnel and set NGROK_WS_URL environment variable');
        return NextResponse.json({ 
          error: 'WebSocket URL must be publicly accessible. Please use ngrok.',
          solution: 'Run: ngrok http 8080, then set NGROK_WS_URL=wss://your-url.ngrok.io',
          received: wsUrl
        }, { status: 400 });
      }
      if (!wsUrl.startsWith('wss://')) {
        return NextResponse.json({
          error: 'NGROK_WS_URL must be a wss:// URL',
          example: 'wss://<subdomain>.ngrok.io',
          received: wsUrl
        }, { status: 400 });
      }
      
      const call = await client.calls.create({
        to: targetNumber,
        from: fromNumber,
        twiml: `<?xml version="1.0" encoding="UTF-8"?>
          <Response>
            <Connect>
              <ConversationRelay url="${wsUrl}" welcomeGreeting="${langCfg.welcome}" transcriptionLanguage="${langCfg.transcriptionLanguage}" transcriptionProvider="google" ttsLanguage="${langCfg.ttsLanguage}" ttsProvider="amazon" voice="${langCfg.ttsVoice}" />
            </Connect>
          </Response>`
      });
      
      console.log('✅ Call created with SID:', call.sid);
      return NextResponse.json({ success: true, callSid: call.sid, websocketUrl: wsUrl });
    }
    
    // Default TwiML for incoming calls
    const defaultWsUrl = process.env.NGROK_WS_URL || 'wss://your-ngrok-url.ngrok.io';
      
    return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Connect>
          <ConversationRelay url="${defaultWsUrl}" welcomeGreeting="Hello! You've reached your AI assistant. What can I help you with?" />
        </Connect>
      </Response>`, { headers: { 'Content-Type': 'text/xml' } });
    
  } catch (error) {
    console.error('Voice API Error:', error);

    if (action === 'call') {
      const errObj: any = error || {};
      const payload = {
        error: 'Call failed',
        message: errObj?.message || String(error),
        name: errObj?.name,
        code: errObj?.code,
        status: errObj?.status,
        moreInfo: errObj?.moreInfo,
        details: errObj?.details || errObj?.response?.data || null,
      };
      return NextResponse.json(payload, { status: 500 });
    }

    return new NextResponse(`<Response><Say voice="Polly.Joanna">Sorry, there was an error. Please try again.</Say></Response>`, { headers: { 'Content-Type': 'text/xml' } });
  }
}