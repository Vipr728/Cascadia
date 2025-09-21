# Cascadia Voice AI Assistant

A real-time voice AI assistant using Twilio ConversationRelay and Google Gemini Flash.

## 🚀 Quick Start

### 1. Start both servers
```bash
npm run voice-dev
```
This starts both:
- Next.js app on `http://localhost:3000`
- WebSocket server on `ws://localhost:8080`

### 2. Test the voice assistant
```powershell
# Make a call to your phone
Invoke-RestMethod -Uri "http://localhost:3000/api/voice?action=call" -Method POST -ContentType "application/json" -Body '{"to": "+14253128646"}'
```

## 🏗️ Architecture

- **Next.js API Route** (`/api/voice`) - Handles call initiation and TwiML generation
- **WebSocket Server** (`voice-websocket-server.ts`) - Real-time conversation handling
- **Twilio ConversationRelay** - Streams audio between caller and AI
- **Google Gemini Flash** - Generates AI responses

## 📋 Environment Variables

Required in `.env.local`:
```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token  
TWILIO_PHONE_NUMBER=+1234567890
GEMINI_API_KEY=your_gemini_key
WS_PORT=8080
```

## 🎯 How It Works

1. **Call Initiated**: API creates Twilio call with ConversationRelay TwiML
2. **WebSocket Connection**: Twilio connects to your WebSocket server
3. **Real-time Audio**: User speech is converted to text and sent via WebSocket
4. **AI Processing**: Gemini generates response based on conversation history
5. **Voice Response**: AI text is converted back to speech and played to caller

## 📞 Message Types

The WebSocket server handles these Twilio message types:
- `setup` - Initialize conversation session
- `prompt` - Process user speech input  
- `interrupt` - Handle conversation interruptions

## 🛠️ Development Commands

```bash
# Run both servers
npm run voice-dev

# Run WebSocket server only
npm run voice-server

# Run Next.js only
npm run dev
```

## 🧪 Transcript Analysis (AG2 Agent)

This project includes a simple AG2/AgentOS-based agent that analyzes a conversation transcript for grammar/wording issues in any language.

Setup:

1) Install Python deps:

```bash
python -m venv .venv && .venv/bin/pip install -r agents/requirements.txt
```

On Windows PowerShell:

```powershell
python -m venv .venv; .\.venv\Scripts\pip install -r agents/requirements.txt
```

2) Set your model key (example uses OpenAI; see AG2 docs):

```powershell
$env:OPENAI_API_KEY = "sk-..."
```

3) Call the API:

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/analysis" -Method POST -ContentType "application/json" -Body '{
  "transcript": "I has a apple yesterday. It are very good.",
  "language": "english"
}' | ConvertTo-Json -Depth 6
```

The response includes `analysis.issues`, `analysis.summary`, `analysis.score`, and `analysis.rewritten`.

References: [AG2 (AgentOS)](https://ag2.ai/)



