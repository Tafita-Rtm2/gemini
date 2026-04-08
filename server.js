require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const multer = require("multer");
const rateLimit = require("express-rate-limit");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Trust proxy (REQUIRED on Render/Railway/Heroku) ──────────────────────────
app.set("trust proxy", 1);

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));
app.use(express.static(path.join(__dirname, "public")));

// ─── Rate limiting ─────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please wait.", status: 429 },
});
app.use("/api", limiter);

// ─── Available Models ─────────────────────────────────────────────────────────
const MODELS = [
  { id: "gpt-5-2",       name: "GPT-5.2",              provider: "OpenAI",    vision: true  },
  { id: "claude-sonnet", name: "Claude Sonnet",         provider: "Anthropic", vision: true  },
  { id: "claude-opus",   name: "Claude Opus",           provider: "Anthropic", vision: true  },
  { id: "gemini-3-pro",  name: "Gemini 3 Pro",          provider: "Google",    vision: true  },
  { id: "deepseek-r1",   name: "DeepSeek R1",           provider: "DeepSeek",  vision: false },
  { id: "auto",          name: "Auto (Best Available)", provider: "Mixed",     vision: true  },
];

// ─── Helper: call aifreeforever ───────────────────────────────────────────────
async function callAIFreeForever(question, conversationHistory = [], imageBase64 = null) {
  const payload = {
    question,
    tone: "friendly",
    format: "paragraph",
    file: imageBase64 || null,
    conversationHistory,
  };

  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Accept-Encoding": "gzip, deflate, br",
    "Accept-Language": "en-US,en;q=0.9",
    "Content-Type": "application/json",
    "Origin": "https://aifreeforever.com",
    "Referer": "https://aifreeforever.com/tools/free-chatgpt-no-login",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
    "sec-ch-ua": '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    "Cache-Control": "no-cache",
  };

  const response = await fetch("https://aifreeforever.com/api/generate-ai-answer", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  const text = await response.text();

  if (!response.ok) {
    console.error(`[upstream] ${response.status} — ${text.slice(0, 300)}`);
    throw new Error(`Upstream error ${response.status}`);
  }

  try {
    return JSON.parse(text);
  } catch {
    return { answer: text };
  }
}

// ─── Helper: fetch image URL → base64 ────────────────────────────────────────
async function fetchImageAsBase64(imgUrl) {
  const res = await fetch(decodeURIComponent(imgUrl));
  if (!res.ok) throw new Error(`Cannot fetch image: ${res.status}`);
  const buffer = await res.buffer();
  const ct = res.headers.get("content-type") || "image/jpeg";
  return `data:${ct};base64,${buffer.toString("base64")}`;
}

function extractAnswer(data) {
  return data.answer ?? data.response ?? data.text ?? data.result ?? data.message ?? JSON.stringify(data);
}

// =============================================================================
// PUBLIC API — NO key required
// GET  /api/openai?query=...&uid=...&img_url=...&model=...
// POST /api/openai  body: { query, uid, img_url, img_base64, model, history }
// =============================================================================

async function handleApiRequest(query, opts = {}) {
  const { uid, img_url, img_base64, model, history } = opts;
  let imageBase64 = null;

  if (img_url) imageBase64 = await fetchImageAsBase64(img_url);
  else if (img_base64) imageBase64 = img_base64;

  const question = imageBase64 ? `[Image attached] ${query}` : query;
  const raw = await callAIFreeForever(question, Array.isArray(history) ? history : [], imageBase64);

  return {
    status: 200,
    uid: uid || "anonymous",
    query,
    model_used: model || "auto",
    has_image: !!imageBase64,
    response: extractAnswer(raw),
    available_models: MODELS,
    timestamp: new Date().toISOString(),
  };
}

app.get("/api/openai", async (req, res) => {
  const { query, uid, img_url, model } = req.query;
  if (!query) return res.status(400).json({ error: "Missing: query", example: "/api/openai?query=Hello" });
  try {
    res.json(await handleApiRequest(query, { uid, img_url, model }));
  } catch (err) {
    console.error("[GET /api/openai]", err.message);
    res.status(500).json({ error: err.message, status: 500 });
  }
});

app.post("/api/openai", async (req, res) => {
  const { query, uid, img_url, img_base64, model, history } = req.body;
  if (!query) return res.status(400).json({ error: "Missing: query" });
  try {
    res.json(await handleApiRequest(query, { uid, img_url, img_base64, model, history }));
  } catch (err) {
    console.error("[POST /api/openai]", err.message);
    res.status(500).json({ error: err.message, status: 500 });
  }
});

// =============================================================================
// CHAT — frontend use (multipart)
// =============================================================================
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

app.post("/api/chat", upload.single("file"), async (req, res) => {
  const { message, history, model, img_url } = req.body;
  if (!message) return res.status(400).json({ error: "Missing message" });

  try {
    let imageBase64 = null;
    if (req.file) {
      imageBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
    } else if (img_url) {
      imageBase64 = await fetchImageAsBase64(img_url);
    }

    let hist = [];
    try { hist = JSON.parse(history || "[]"); } catch (_) {}

    const question = imageBase64 ? `[Image attached] ${message}` : message;
    const raw = await callAIFreeForever(question, hist.slice(-10), imageBase64);

    res.json({ response: extractAnswer(raw), model_used: model || "auto" });
  } catch (err) {
    console.error("[POST /api/chat]", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/models", (_req, res) => res.json({ models: MODELS, count: MODELS.length }));

app.get("/health", (_req, res) =>
  res.json({ status: "ok", uptime: process.uptime(), timestamp: new Date().toISOString() })
);

app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

app.listen(PORT, () => {
  console.log(`✅  Server on http://localhost:${PORT}`);
  console.log(`📡  API: http://localhost:${PORT}/api/openai?query=Hello`);
});
