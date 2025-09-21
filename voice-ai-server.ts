import { WebSocket, WebSocketServer } from 'ws';
import OpenAI from 'openai';
import express from 'express';
import dotenv from 'dotenv';
const twilio = require('twilio');

// Load environment variables
dotenv.config();
dotenv.config({ path: '.env.local' });

// Initialize services (OpenAI)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const openaiModel = process.env.OPENAI_MODEL || process.env.AG2_MODEL || process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o-mini';
const app = express();
app.use(express.json());

const HTTP_PORT = 3000;
const WS_PORT = Number(process.env.WS_PORT || process.env.PORT || 8080);
const sessions = new Map();
const SYSTEM_PROMPT = "You are a helpful assistant. This conversation is being translated to voice, so answer carefully. When you respond, please spell out all numbers, for example twenty not 20. Do not include emojis in your responses. Do not include bullet points, asterisks, or special symbols.";

// AI Response function
async function aiResponse(messages: any[]) {
  try {
    let conversationText = "";
    for (const message of messages) {
      if (message.role === "user") conversationText += `Human: ${message.content}\n`;
      else if (message.role === "assistant") conversationText += `Assistant: ${message.content}\n`;
    }
    
    const lastUserMessage = messages.filter(m => m.role === "user").pop();
    const prompt = `${SYSTEM_PROMPT}\n\nConversation:\n${conversationText}\n\nRespond to: ${lastUserMessage?.content || ""}`;
    
    const completion = await openai.chat.completions.create({
      model: openaiModel,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.filter((m) => m.role !== 'system').map((m) => ({ role: m.role, content: m.content })),
      ],
      temperature: 0.7,
    });
    return completion.choices?.[0]?.message?.content || '';
  } catch (error) {
    console.error("AI Error:", error);
    return "I'm sorry, I'm having trouble right now. Please try again.";
  }
}

// HTTP Routes
app.get('/health', (req, res) => {
  res.json({ status: 'Ready', websocket: `ws://localhost:${WS_PORT}` });
});

app.post('/call', async (req, res) => {
  try {
    const targetNumber = req.body.to || '+14253128646';
    const wsUrl = process.env.NGROK_WS_URL || `ws://localhost:${WS_PORT}`;
    
    console.log('📞 Calling:', targetNumber, 'via WebSocket:', wsUrl);
    
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    const call = await client.calls.create({
      to: targetNumber,
      from: process.env.TWILIO_PHONE_NUMBER,
      twiml: `<Response><Connect><ConversationRelay url="${wsUrl}" welcomeGreeting="Hi! I'm your AI assistant. What can I help you with?" /></Connect></Response>`
    });
    
    console.log('✅ Call created:', call.sid);
    res.json({ success: true, callSid: call.sid });
  } catch (error) {
    console.error('Call error:', error);
    res.status(500).json({ error: 'Call failed' });
  }
});

// WebSocket Server
const wss = new WebSocketServer({ port: WS_PORT });

wss.on('connection', (ws: WebSocket) => {
  console.log('📞 WebSocket connected');
  
  ws.on('message', async (data: Buffer) => {
    try {
      const message = JSON.parse(data.toString());
      
      switch (message.type) {
        case 'setup':
          const callSid = message.callSid;
          (ws as any).callSid = callSid;
          sessions.set(callSid, [{ role: "system", content: SYSTEM_PROMPT }]);
          console.log('🔧 Setup call:', callSid);
          break;

        case 'prompt':
          const wsCallSid = (ws as any).callSid;
          const conversation = sessions.get(wsCallSid);
          
          if (conversation) {
            conversation.push({ role: "user", content: message.voicePrompt });
            console.log('🎤 User said:', message.voicePrompt);
            
            const response = await aiResponse(conversation);
            conversation.push({ role: "assistant", content: response });
            
            ws.send(JSON.stringify({ type: "text", token: response, last: true }));
            console.log('🤖 AI replied:', response);
          }
          break;

        case 'interrupt':
          console.log('⚠️ Conversation interrupted');
          break;
      }
    } catch (error) {
      console.error('WebSocket error:', error);
    }
  });

  ws.on('close', () => {
    console.log('📞 WebSocket disconnected');
    const callSid = (ws as any).callSid;
    if (callSid) sessions.delete(callSid);
  });
});

// Start servers
app.listen(HTTP_PORT, () => {
  console.log(`🌐 HTTP server: http://localhost:${HTTP_PORT}`);
  console.log(`📞 Call endpoint: POST http://localhost:${HTTP_PORT}/call`);
});

wss.on('listening', () => {
  console.log(`🎙️ WebSocket server: ws://localhost:${WS_PORT}`);
  console.log('✅ AI Voice Assistant ready!');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  wss.close();
  process.exit(0);
});