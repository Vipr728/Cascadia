import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";
const twilio = require('twilio');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
    if (action === 'call') {
      // Make outgoing call using ConversationRelay
      const body = await request.json().catch(() => ({}));
      const targetNumber = body.to || '+14253128646';
      
      console.log('📞 Making call to:', targetNumber);
      
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      
      // Use ngrok URL for WebSocket connection (Twilio needs public access)
      const wsUrl = process.env.NGROK_WS_URL || 'wss://your-ngrok-url.ngrok.io';
      
      console.log('🔗 Using WebSocket URL:', wsUrl);
      
      if (wsUrl.includes('localhost')) {
        console.error('❌ ERROR: Cannot use localhost URL for Twilio ConversationRelay!');
        console.error('� Solution: Start ngrok tunnel and set NGROK_WS_URL environment variable');
        return NextResponse.json({ 
          error: 'WebSocket URL must be publicly accessible. Please use ngrok.',
          solution: 'Run: ngrok http 8080, then set NGROK_WS_URL=wss://your-url.ngrok.io'
        }, { status: 400 });
      }
      
      const call = await client.calls.create({
        to: targetNumber,
        from: process.env.TWILIO_PHONE_NUMBER,
        twiml: `<?xml version="1.0" encoding="UTF-8"?>
          <Response>
            <Connect>
              <ConversationRelay url="${wsUrl}" welcomeGreeting="Hi! I'm your AI assistant powered by Gemini Flash. What can I help you with today?" />
            </Connect>
          </Response>`
      });
      
      console.log('✅ Call created with SID:', call.sid);
      return NextResponse.json({ success: true, callSid: call.sid, websocketUrl: wsUrl });
    }
    
    // Default TwiML for incoming calls
    const wsUrl = process.env.NGROK_WS_URL || 'wss://your-ngrok-url.ngrok.io';
      
    return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Connect>
          <ConversationRelay url="${wsUrl}" welcomeGreeting="Hello! You've reached your AI assistant. What can I help you with?" />
        </Connect>
      </Response>`, { headers: { 'Content-Type': 'text/xml' } });
    
  } catch (error) {
    console.error('Voice API Error:', error);
    
    if (action === 'call') {
      return NextResponse.json({ error: 'Call failed', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
    
    return new NextResponse(`<Response><Say voice="Polly.Joanna">Sorry, there was an error. Please try again.</Say></Response>`, { headers: { 'Content-Type': 'text/xml' } });
  }
}