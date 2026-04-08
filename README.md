# NexusAI — Free AI Chatbot & Public API

Free AI chatbot powered by [aifreeforever.com](https://aifreeforever.com) with a public REST API endpoint.

## Features

- 🤖 Multi-model: GPT-5.2, Claude Sonnet/Opus, Gemini 3 Pro, DeepSeek R1
- 🖼️ Vision: upload images or pass image URLs
- 📎 File support: PDF, Word, Excel
- 🌐 Public REST API with API key auth
- 🚀 Deploy-ready for Render.com

---

## Quickstart local

```bash
npm install
cp .env.example .env
node server.js
```

Open `http://localhost:3000`

---

## API Endpoint

### GET /api/openai

```
GET /api/openai?query=Hello&uid=1&apikey=YOUR_KEY
GET /api/openai?query=What+game+is+this&uid=1&img_url=https://example.com/game.jpg&apikey=YOUR_KEY
```

**Parameters:**

| Param | Required | Description |
|-------|----------|-------------|
| `query` | ✅ | The message/question |
| `apikey` | ✅ | Your API key |
| `uid` | ❌ | User identifier |
| `img_url` | ❌ | Public image URL |
| `model` | ❌ | Model ID (default: auto) |

**Response:**
```json
{
  "status": 200,
  "uid": "1",
  "query": "Quelle jeux il s'agit ?",
  "model_used": "auto",
  "has_image": true,
  "response": "Il s'agit de Minecraft...",
  "available_models": [...],
  "timestamp": "2026-04-08T10:54:35.000Z"
}
```

---

## Deploy on Render

1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your GitHub repo
4. Set:
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Environment Variable**: `MASTER_API_KEY=your-secret-key`
5. Deploy!

Your API will be live at:
```
https://your-app.onrender.com/api/openai?query=Hello&apikey=YOUR_KEY
```

---

## File structure

```
├── server.js          # Express backend
├── package.json
├── .env.example
└── public/
    ├── index.html     # Chatbot UI
    └── api-test.html  # API documentation & tester
```
