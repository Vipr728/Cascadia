import { NextRequest, NextResponse } from 'next/server';
const twilio = require('twilio');

// Supported languages and voices configuration
const LANGUAGE_CONFIG = {
  english: {
    language: 'en-US',
    voice: 'polly.Joanna',
    message: 'HI MY NAME IS TWILIO'
  },
  telugu: {
    language: 'en-IN',
    voice: 'polly.Raveena',
    message: 'Namaskaram naa peru Twilio'
  },
  hindi: {
    language: 'hi-IN',
    voice: 'polly.Aditi',
    message: 'Namaste mera naam Twilio hai'
  },
  russian: {
    language: 'ru-RU',
    voice: 'polly.Tatyana',
    message: 'Privet, menya zovut Twilio'
  },
  spanish: {
    language: 'es-US',
    voice: 'polly.Penelope',
    message: 'HOLA MI NOMBRE ES TWILLIO'
  },
  french: {
    language: 'fr-FR',
    voice: 'polly.Celine',
    message: 'Bonjour, je suis Twilio'
  }
};

export async function POST(request: NextRequest) {
  console.log('🚀 Starting POST request to /api/twilio/call');
  
  try {
    // Initialize Twilio client
    console.log('🔑 Checking Twilio credentials...');
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    console.log('📝 Environment variables check:');
    console.log('  - TWILIO_ACCOUNT_SID:', accountSid ? '✅ Set' : '❌ Missing');
    console.log('  - TWILIO_AUTH_TOKEN:', authToken ? '✅ Set' : '❌ Missing');
    console.log('  - TWILIO_PHONE_NUMBER:', fromNumber ? '✅ Set' : '❌ Missing');

    if (!accountSid || !authToken || !fromNumber) {
      console.error('❌ Missing Twilio credentials in environment variables');
      return NextResponse.json(
        { error: 'Missing Twilio credentials in environment variables' },
        { status: 500 }
      );
    }

    // Parse request body to get target phone number and language
    console.log('📨 Parsing request body...');
    const body = await request.json().catch((err) => {
      console.error('❌ Error parsing JSON body:', err);
      return {};
    });
    
    const targetNumber = body.to || '+14253128646';
    const requestedLanguage = body.language || 'english';
    
    console.log('📞 Call parameters:');
    console.log('  - Target number:', targetNumber);
    console.log('  - Language:', requestedLanguage);
    console.log('  - From number:', fromNumber);
    
    // Get language configuration
    const config = LANGUAGE_CONFIG[requestedLanguage as keyof typeof LANGUAGE_CONFIG] || LANGUAGE_CONFIG.english;
    console.log('🎯 Using language config:', config);

    console.log('🔧 Initializing Twilio client...');
    const client = twilio(accountSid, authToken);

    // Simple TwiML response - start voice conversation with Gemini
    const twimlResponse = `
      <Response>
        <Say voice="Polly.Joanna">
          Hi! I'm your AI voice assistant powered by Gemini Flash. What can I help you with today?
        </Say>
        <Gather input="speech" timeout="5" speechTimeout="auto" action="/api/twilio/voice-response">
          <Say voice="Polly.Joanna">Go ahead, I'm listening.</Say>
        </Gather>
        <Say voice="Polly.Joanna">I didn't hear anything. Goodbye!</Say>
      </Response>
    `.trim();
    
    console.log('📋 Generated TwiML:', twimlResponse);
    
    // Make the call
    console.log('📞 Attempting to make call...');
    const call = await client.calls.create({
      to: targetNumber,
      from: fromNumber,
      twiml: twimlResponse
    });

    console.log('✅ Call created successfully!');
    console.log('📊 Call details:', {
      callSid: call.sid,
      to: targetNumber,
      from: fromNumber,
      status: call.status
    });    return NextResponse.json({
      success: true,
      callSid: call.sid,
      to: targetNumber,
      language: requestedLanguage,
      voice: config.voice,
      message: config.message,
      response: 'Call initiated successfully'
    });

  } catch (error) {
    console.error('💥 ERROR in /api/twilio/call:');
    console.error('Error type:', typeof error);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Full error object:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to make call', 
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}