import { WebSocket, WebSocketServer } from 'ws';
import type { RequestInit } from 'undici';
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables properly
dotenv.config();
dotenv.config({ path: '.env.local' });

// Initialize Gemini
console.log('🔑 Initializing Gemini with API key:', process.env.GEMINI_API_KEY ? 'Set' : 'Missing');
console.log('📏 API Key length:', process.env.GEMINI_API_KEY?.length || 0);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
console.log('✅ Gemini model initialized: gemini-1.5-flash');

const PORT = Number(process.env.WS_PORT || process.env.PORT || 8080);
const SYSTEM_PROMPT = "You are a helpful assistant. This conversation is being translated to voice, so answer carefully. When you respond, please spell out all numbers, for example twenty not 20. Do not include emojis in your responses. Do not include bullet points, asterisks, or special symbols.";

// Store conversation sessions and per-call analysis
type ConversationMessage = { role: 'system' | 'user' | 'assistant'; content: string };
const sessions: Map<string, ConversationMessage[]> = new Map();
const analyses: Map<string, any> = new Map();

function buildTranscript(messages: ConversationMessage[]): string {
  const lines: string[] = [];
  for (const msg of messages) {
    if (msg.role === 'system') continue;
    const label = msg.role === 'user' ? 'Human' : 'Assistant';
    lines.push(`${label}: ${msg.content}`);
  }
  return lines.join('\n');
}

async function postAnalysis(transcript: string, language?: string): Promise<any> {
  const url = process.env.ANALYSIS_API_URL || 'http://localhost:3000/api/analysis';
  try {
    const init: RequestInit = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript, language }),
    };
    const res = await fetch(url, init as any);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.error || `HTTP ${res.status}`);
    }
    return data?.analysis ?? data;
  } catch (err) {
    console.error('💥 Analysis call failed:', err);
    return null;
  }
}

// WebSocket AI response function (Gemini Flash)
async function aiResponse(messages: any[]) {
  console.log('🤖 Starting AI response generation...');
  console.log('📝 Messages to process:', messages.length);

  try {
    // Build prompt from conversation history
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

    const lastUserMessage = messages.filter((m: any) => m.role === "user").pop();
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
      const messages = sessions.get(callSid) || [];
      const transcript = buildTranscript(messages);
      (async () => {
        console.log('🧪 Sending final transcript for analysis...');
        const analysis = await postAnalysis(transcript);
        if (analysis) {
          analyses.set(callSid, analysis);
          const weaknesses = Array.isArray(analysis?.weaknesses) ? analysis.weaknesses : [];
          const counts = weaknesses.reduce((acc: Record<string, number>, w: any) => {
            const k = (w?.severity || 'unknown').toString().toLowerCase();
            acc[k] = (acc[k] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          console.log('✅ Analysis complete. Weaknesses:', weaknesses.length, counts);

      // Persist to disk for retrieval by Next.js API
      try {
        const baseDir = path.join(process.cwd(), 'data', 'analyses');
        fs.mkdirSync(baseDir, { recursive: true });
        const record = {
          callSid,
          createdAt: new Date().toISOString(),
          transcript,
          analysis,
        };
        fs.writeFileSync(path.join(baseDir, `${callSid}.json`), JSON.stringify(record, null, 2), 'utf8');
        fs.writeFileSync(path.join(baseDir, `latest.json`), JSON.stringify({ callSid, createdAt: record.createdAt }, null, 2), 'utf8');
      } catch (err) {
        console.error('💾 Failed to persist analysis to disk:', err);
      }
        } else {
          console.log('⚠️ Analysis returned no result');
        }
      })();

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