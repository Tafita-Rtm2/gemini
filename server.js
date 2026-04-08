require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const multer = require("multer");
const rateLimit = require("express-rate-limit");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));
app.use(express.static(path.join(__dirname, "public")));

// ─── Rate limiting ─────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: { error: "Too many requests. Please wait a moment.", status: 429 },
});
app.use("/api", limiter);

// ─── API Keys (simple hardcoded + env) ────────────────────────────────────────
const VALID_API_KEYS = new Set([
  process.env.MASTER_API_KEY || "zk-7c7fa3ac023a0bfa135afd96839344c43a52ccc28f0c530cdc051d7a8c0bef79",
  // Add more keys here or load from DB
]);

function validateApiKey(req, res, next) {
  const apikey = req.query.apikey || req.headers["x-api-key"];
  if (!apikey || !VALID_API_KEYS.has(apikey)) {
    return res.status(401).json({
      error: "Invalid or missing API key",
      hint: "Pass ?apikey=YOUR_KEY or header X-Api-Key",
      status: 401,
    });
  }
  next();
}

// ─── Available Models ─────────────────────────────────────────────────────────
const MODELS = [
  { id: "gpt-5-2", name: "GPT-5.2", provider: "OpenAI", vision: true },
  { id: "claude-sonnet", name: "Claude Sonnet", provider: "Anthropic", vision: true },
  { id: "claude-opus", name: "Claude Opus", provider: "Anthropic", vision: true },
  { id: "gemini-3-pro", name: "Gemini 3 Pro", provider: "Google", vision: true },
  { id: "deepseek-r1", name: "DeepSeek R1", provider: "DeepSeek", vision: false },
  { id: "auto", name: "Auto (Best Available)", provider: "Mixed", vision: true },
];

// ─── Helper: call aifreeforever API ───────────────────────────────────────────
async function callAIFreeForever(question, conversationHistory = [], imageBase64 = null) {
  const payload = {
    question,
    tone: "friendly",
    format: "paragraph",
    file: imageBase64 || null,
    conversationHistory,
  };

  const headers = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36",
    "Accept-Encoding": "gzip, deflate, br, zstd",
    "Content-Type": "application/json",
    "sec-ch-ua-platform": '"Android"',
    "sec-ch-ua": '"Not(A:Brand";v="8", "Chromium";v="144", "Google Chrome";v="144"',
    "sec-ch-ua-mobile": "?1",
    origin: "https://aifreeforever.com",
    "sec-fetch-site": "same-origin",
    "sec-fetch-mode": "cors",
    "sec-fetch-dest": "empty",
    referer: "https://aifreeforever.com/tools/free-chatgpt-no-login",
    "accept-language": "en-US,en;q=0.9",
    priority: "u=1, i",
  };

  const response = await fetch("https://aifreeforever.com/api/generate-ai-answer", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Upstream API error: ${response.status}`);
  }

  const data = await response.json();
  return data;
}

// ─── Helper: fetch image URL and convert to base64 ───────────────────────────
async function fetchImageAsBase64(imgUrl) {
  try {
    const res = await fetch(imgUrl);
    if (!res.ok) throw new Error("Could not fetch image");
    const buffer = await res.buffer();
    const contentType = res.headers.get("content-type") || "image/jpeg";
    return `data:${contentType};base64,${buffer.toString("base64")}`;
  } catch (e) {
    throw new Error(`Image fetch failed: ${e.message}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API ENDPOINT
// GET /api/openai?query=...&uid=1&img_url=...&apikey=...
// ─────────────────────────────────────────────────────────────────────────────
app.get("/api/openai", validateApiKey, async (req, res) => {
  const { query, uid, img_url, model } = req.query;

  if (!query) {
    return res.status(400).json({
      error: "Missing required parameter: query",
      usage: "/api/openai?query=Hello&uid=1&apikey=YOUR_KEY",
      status: 400,
    });
  }

  try {
    let imageBase64 = null;
    if (img_url) {
      imageBase64 = await fetchImageAsBase64(decodeURIComponent(img_url));
    }

    const question = imageBase64
      ? `[Image attached] ${query}`
      : query;

    const aiResponse = await callAIFreeForever(question, [], imageBase64);

    const answer = aiResponse.answer || aiResponse.response || aiResponse.text || JSON.stringify(aiResponse);

    return res.json({
      status: 200,
      uid: uid || "anonymous",
      query: query,
      model_used: model || "auto",
      has_image: !!img_url,
      response: answer,
      available_models: MODELS,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[API Error]", err.message);
    return res.status(500).json({
      error: err.message,
      status: 500,
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/openai - same but POST with body
// ─────────────────────────────────────────────────────────────────────────────
app.post("/api/openai", validateApiKey, async (req, res) => {
  const { query, uid, img_url, model, history } = req.body;

  if (!query) {
    return res.status(400).json({ error: "Missing required field: query", status: 400 });
  }

  try {
    let imageBase64 = null;
    if (img_url) {
      imageBase64 = await fetchImageAsBase64(img_url);
    }
    if (req.body.img_base64) {
      imageBase64 = req.body.img_base64;
    }

    const question = imageBase64 ? `[Image attached] ${query}` : query;
    const conversationHistory = history || [];

    const aiResponse = await callAIFreeForever(question, conversationHistory, imageBase64);
    const answer = aiResponse.answer || aiResponse.response || aiResponse.text || JSON.stringify(aiResponse);

    return res.json({
      status: 200,
      uid: uid || "anonymous",
      query,
      model_used: model || "auto",
      has_image: !!imageBase64,
      response: answer,
      available_models: MODELS,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[API Error]", err.message);
    return res.status(500).json({ error: err.message, status: 500 });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// CHAT ENDPOINT (used by the frontend chatbot, no API key required for UI)
// POST /api/chat
// ─────────────────────────────────────────────────────────────────────────────
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

app.post("/api/chat", upload.single("file"), async (req, res) => {
  const { message, history, model } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Missing message" });
  }

  try {
    let imageBase64 = null;

    // File uploaded from UI
    if (req.file) {
      const mime = req.file.mimetype;
      imageBase64 = `data:${mime};base64,${req.file.buffer.toString("base64")}`;
    }

    // Image URL from request body
    if (req.body.img_url) {
      imageBase64 = await fetchImageAsBase64(req.body.img_url);
    }

    let conversationHistory = [];
    try {
      conversationHistory = JSON.parse(history || "[]");
    } catch (_) {}

    const question = imageBase64 ? `[Image attached] ${message}` : message;
    const aiResponse = await callAIFreeForever(question, conversationHistory, imageBase64);
    const answer = aiResponse.answer || aiResponse.response || aiResponse.text || JSON.stringify(aiResponse);

    return res.json({ response: answer, model_used: model || "auto" });
  } catch (err) {
    console.error("[Chat Error]", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ─── Models list ──────────────────────────────────────────────────────────────
app.get("/api/models", (req, res) => {
  res.json({ models: MODELS, count: MODELS.length });
});

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// ─── Catch-all → index.html ───────────────────────────────────────────────────
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📡 API endpoint: http://localhost:${PORT}/api/openai?query=Hello&apikey=...`);
});
