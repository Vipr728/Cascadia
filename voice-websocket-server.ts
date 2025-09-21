import { WebSocket, WebSocketServer } from 'ws';
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

// Load environment variables properly
dotenv.config();
dotenv.config({ path: '.env.local' });

// Initialize Gemini
console.log('🔑 Initializing Gemini with API key:', process.env.GEMINI_API_KEY ? 'Set' : 'Missing');
console.log('📏 API Key length:', process.env.GEMINI_API_KEY?.length || 0);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
console.log('✅ Gemini model initialized: gemini-1.5-flash');

const PORT = Number(process.env.WS_PORT) || 8080;
const SYSTEM_PROMPT = "You are a helpful assistant. This conversation is being translated to voice, so answer carefully. When you respond, please spell out all numbers, for example twenty not 20. Do not include emojis in your responses. Do not include bullet points, asterisks, or special symbols.";

// Store conversation sessions
const sessions = new Map();

// WebSocket AI response function
async function aiResponse(messages: any[]) {
  console.log('🤖 Starting AI response generation...');
  console.log('📝 Messages to process:', messages.length);
  
  try {
    // Convert messages to Gemini format
    let conversationText = "";
    let systemPrompt = "";
    
    for (const message of messages) {
      if (message.role === "system") {
        systemPrompt = message.content;
      } else if (message.role === "user") {
        conversationText += `Human: ${message.content}\n`;
      } else if (message.role === "assistant") {
        conversationText += `Assistant: ${message.content}\n`;
      }
    }
    
    // Get the last user message
    const lastUserMessage = messages.filter(m => m.role === "user").pop();
    const prompt = `${systemPrompt}\n\nConversation history:\n${conversationText}\n\nPlease respond to: ${lastUserMessage?.content || ""}`;
    
    console.log('📤 Sending prompt to Gemini...');
    console.log('🔤 Prompt length:', prompt.length, 'characters');
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    
    console.log('✅ Gemini response received:', responseText);
    return responseText;
  } catch (error) {
    console.error("💥 Error calling Gemini API:", error);
    console.error("🔍 Error details:");
    console.error("  - Type:", typeof error);
    console.error("  - Message:", error instanceof Error ? error.message : 'Unknown');
    console.error("  - API Key exists:", !!process.env.GEMINI_API_KEY);
    console.error("  - API Key length:", process.env.GEMINI_API_KEY?.length || 0);
    return "I'm sorry, I'm having trouble processing your request right now. Please try again.";
  }
}

// Create WebSocket server
const wss = new WebSocketServer({ port: PORT });

console.log(`🎙️ Voice WebSocket server starting on port ${PORT}...`);

wss.on('connection', (ws: WebSocket) => {
  console.log('📞 New WebSocket connection established');
  
  ws.on('message', async (data: Buffer) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('📨 Received message:', message.type);

      switch (message.type) {
        case 'setup':
          const callSid = message.callSid;
          console.log('🔧 Setup for call:', callSid);
          
          // Store callSid on WebSocket connection
          (ws as any).callSid = callSid;
          
          // Initialize conversation session
          sessions.set(callSid, [{ role: "system", content: SYSTEM_PROMPT }]);
          console.log('✅ Session initialized for call:', callSid);
          break;

        case 'prompt':
          const voicePrompt = message.voicePrompt;
          console.log('🎤 Processing voice prompt:', voicePrompt);
          
          const wsCallSid = (ws as any).callSid;
          const conversation = sessions.get(wsCallSid);
          
          if (!conversation) {
            console.error('❌ No conversation session found for call:', wsCallSid);
            return;
          }
          
          // Add user message to conversation
          conversation.push({ role: "user", content: voicePrompt });
          
          // Get AI response
          console.log('🤖 Generating AI response...');
          const response = await aiResponse(conversation);
          
          // Add AI response to conversation
          conversation.push({ role: "assistant", content: response });
          
          // Send response back to Twilio
          const responseMessage = {
            type: "text",
            token: response,
            last: true,
          };
          
          ws.send(JSON.stringify(responseMessage));
          console.log('✅ Sent AI response:', response);
          break;

        case 'interrupt':
          console.log('⚠️ Handling interruption');
          // Handle conversation interruption
          break;

        default:
          console.warn('⚠️ Unknown message type received:', message.type);
          break;
      }
    } catch (error) {
      console.error('💥 Error processing WebSocket message:', error);
    }
  });

  ws.on('close', () => {
    console.log('📞 WebSocket connection closed');
    const callSid = (ws as any).callSid;
    if (callSid) {
      sessions.delete(callSid);
      console.log('🗑️ Cleaned up session for call:', callSid);
    }
  });

  ws.on('error', (error) => {
    console.error('💥 WebSocket error:', error);
  });
});

wss.on('listening', () => {
  console.log(`✅ Voice WebSocket server running on ws://localhost:${PORT}`);
  console.log('🎯 Ready to handle Twilio ConversationRelay connections');
});

wss.on('error', (error) => {
  console.error('💥 WebSocket server error:', error);
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down WebSocket server...');
  wss.close(() => {
    console.log('✅ WebSocket server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down WebSocket server...');
  wss.close(() => {
    console.log('✅ WebSocket server closed');
    process.exit(0);
  });
});