import { WebSocket, WebSocketServer } from 'ws';
import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
const twilio = require('twilio');

// Load environment variables from .env.local first, then .env
dotenv.config({ path: '.env.local' });
dotenv.config();

// --- Service Initialization ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model: GenerativeModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
const app = express();
app.use(express.json());

// --- Constants and Configuration ---
const HTTP_PORT = process.env.HTTP_PORT || 3000;
const WS_PORT = parseInt(process.env.WS_PORT || '8080', 10);
const sessions = new Map<string, { role: string; content: string; }[]>();
// Per-call language and voice settings (defaults align with initial TwiML)
const sessionSettings = new Map<string, { languageCode: string; languageName: string; ttsVoice: string }>();
const SYSTEM_PROMPT = "Eres un asistente útil. Esta conversación se está traduciendo a voz, así que responde con cuidado. Cuando respondas, por favor deletrea todos los números, por ejemplo, 'veinte' no '20'. No incluyas emojis en tus respuestas. No incluyas viñetas, asteriscos o símbolos especiales.";

// --- Core Functions ---
/**
 * Generates a response from the AI model based on the conversation history.
 * @param conversation - The array of messages in the conversation.
 * @returns The AI's response text.
 */
async function getAIResponse(conversation: { role: string; content: string; }[], languageName?: string): Promise<string> {
    try {
        const conversationText = conversation
            .map(m => `${m.role === 'user' ? 'Human' : 'Assistant'}: ${m.content}`)
            .join('\n');
        
        const lastUserMessage = conversation[conversation.length - 1]?.content || "";
        const langDirective = languageName ? `\n\nLanguage: Please respond in ${languageName}.` : '';
        const prompt = `${SYSTEM_PROMPT}${langDirective}\n\nConversation:\n${conversationText}\n\nRespond to: ${lastUserMessage}`;
        
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error("AI Error:", error);
        return "Lo siento, estoy teniendo problemas en este momento. Por favor, inténtalo de nuevo.";
    }
}
// --- Language utilities ---
function detectLanguageRequest(text: string): { languageCode: string; languageName: string; ttsVoice: string } | null {
    const lower = text.toLowerCase();
    // Explicit requests
    if (/(speak|talk|answer|respond) in russian|по-русски|говори по русски|на русском/.test(lower)) {
        return { languageCode: 'ru-RU', languageName: 'Russian', ttsVoice: 'Tatyana-Neural' };
    }
    if (/(speak|talk|answer|respond) in spanish|en español|en espanol|habla español/.test(lower)) {
        return { languageCode: 'es-MX', languageName: 'Spanish', ttsVoice: 'Mia-Neural' };
    }
    if (/(speak|talk|answer|respond) in english|in american|in us english/.test(lower)) {
        return { languageCode: 'en-US', languageName: 'English', ttsVoice: 'Joanna' };
    }
    if (/(parle|parla|speak).*français|en français/.test(lower)) {
        return { languageCode: 'fr-FR', languageName: 'French', ttsVoice: 'Lea' };
    }
    // Heuristic: Cyrillic → Russian
    if (/[\u0400-\u04FF]/.test(text)) {
        return { languageCode: 'ru-RU', languageName: 'Russian', ttsVoice: 'Tatyana-Neural' };
    }
    return null;
}


// --- HTTP Routes ---
app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'Ready', websocket: `ws://localhost:${WS_PORT}` });
});

app.post('/call', async (req: Request, res: Response) => {
    const { to: targetNumber } = req.body;
    const wsUrl = process.env.NGROK_WS_URL;

    if (!targetNumber) {
        return res.status(400).json({ error: 'Target phone number "to" is required.' });
    }
    if (!wsUrl) {
        console.error("NGROK_WS_URL is not set. Cannot make calls.");
        return res.status(500).json({ error: 'Server configuration error: NGROK_WS_URL is not set.' });
    }

    try {
        console.log('📞 Calling:', targetNumber, 'via WebSocket:', wsUrl);
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        const call = await client.calls.create({
            to: targetNumber,
            from: process.env.TWILIO_PHONE_NUMBER!,
            twiml: `<Response><Connect><ConversationRelay url="${wsUrl}" welcomeGreeting="¡Hola! Soy tu asistente de IA. ¿En qué puedo ayudarte?" transcriptionLanguage="es-MX" ttsLanguage="es-MX" voice="Mia-Neural" ttsProvider="amazon" transcriptionProvider="google" /></Connect></Response>`
        });
        
        console.log('✅ Call created:', call.sid);
        res.json({ success: true, callSid: call.sid });
    } catch (error) {
        console.error('Twilio call error:', error);
        res.status(500).json({ error: 'Call failed to initiate.' });
    }
});

// --- WebSocket Server ---
const wss = new WebSocketServer({ port: WS_PORT });

wss.on('connection', (ws: WebSocket) => {
    console.log('🔌 WebSocket connected');
    let callSid: string | null = null;

    ws.on('message', async (data: Buffer) => {
        try {
            const message = JSON.parse(data.toString());
            
            switch (message.type) {
                case 'setup':
                    callSid = message.callSid;
                    if (callSid) {
                        sessions.set(callSid, []);
                        // initialize default language settings for the session (Spanish default from TwiML)
                        sessionSettings.set(callSid, { languageCode: 'es-MX', languageName: 'Spanish', ttsVoice: 'Mia-Neural' });
                        console.log('🔧 Setup call:', callSid);
                    }
                    break;

                case 'prompt':
                    if (!callSid) break;
                    const conversation = sessions.get(callSid);
                    if (!conversation) break;

                    const userMessage = message.voicePrompt;
                    console.log('🎤 User said:', userMessage);
                    conversation.push({ role: "user", content: userMessage });
                    
                    // Detect language switch intent
                    const detected = detectLanguageRequest(userMessage);
                    if (detected && callSid) {
                        sessionSettings.set(callSid, detected);
                        ws.send(JSON.stringify({ type: 'control', control: 'set-language', language: detected.languageCode, voice: detected.ttsVoice }));
                        console.log('🌐 Language switched to', detected.languageName, detected.languageCode, detected.ttsVoice);
                    }

                    const langPref = callSid ? sessionSettings.get(callSid)?.languageName : undefined;
                    const responseText = await getAIResponse(conversation, langPref);
                    conversation.push({ role: "assistant", content: responseText });
                    
                    ws.send(JSON.stringify({ type: "text", token: responseText, last: true }));
                    console.log('🤖 AI replied:', responseText);
                    break;

                case 'interrupt':
                    console.log('⚠️ Conversation interrupted for call:', callSid);
                    break;
            }
        } catch (error) {
            console.error('WebSocket message error:', error);
        }
    });

    ws.on('close', () => {
        console.log('🔌 WebSocket disconnected for call:', callSid);
        if (callSid) {
            sessions.delete(callSid);
        }
    });
});

// --- Server Startup ---
app.listen(HTTP_PORT, () => {
    console.log(`🌐 HTTP server listening on http://localhost:${HTTP_PORT}`);
});

wss.on('listening', () => {
    console.log(`🎙️ WebSocket server listening on ws://localhost:${WS_PORT}`);
    console.log('✅ AI Voice Assistant is ready!');
});

// --- Graceful Shutdown ---
const shutdown = () => {
    console.log('\n🛑 Shutting down gracefully...');
    wss.close(() => {
        console.log('WebSocket server closed.');
        process.exit(0);
    });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);