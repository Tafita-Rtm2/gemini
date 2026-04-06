// ╔══════════════════════════════════════════════════════════════╗
// ║          FREE AI API SERVER — No API Key Required           ║
// ║   Chat · Image Generation/Edit · Web Search                 ║
// ║   Powered by Pollinations.ai (100% Free & Open Source)      ║
// ╚══════════════════════════════════════════════════════════════╝

import express from "express";
import cors from "cors";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const POLLINATIONS_TEXT = "https://text.pollinations.ai";
const POLLINATIONS_IMAGE = "https://image.pollinations.ai";

// Available chat models via Pollinations (free, no key)
const CHAT_MODELS = [
  "openai",           // GPT-4.1
  "openai-fast",      // GPT-4.1-mini
  "openai-reasoning", // o4-mini
  "claude",           // Claude Sonnet
  "gemini",           // Gemini 2.0 Flash
  "gemini-thinking",  // Gemini with thinking
  "deepseek",         // DeepSeek V3
  "deepseek-reasoning",// DeepSeek R1
  "mistral",          // Mistral
  "llama",            // Llama
  "qwen-coder",       // Qwen Coder
  "phi",              // Phi-4
  "unity",            // Unity (uncensored)
  "searchgpt",        // SearchGPT with web search
];

// Available image models via Pollinations (free, no key)
const IMAGE_MODELS = [
  "flux",             // Flux Schnell (default, fast)
  "flux-realism",     // Flux Realism
  "flux-pro",         // Flux Pro
  "gptimage",         // GPT Image (OpenAI)
  "nanobanana",       // Nano Banana (Gemini 2.5 Flash Image)
  "nanobanana-pro",   // Nano Banana Pro (Gemini 3 Pro Image)
  "seedream",         // Seedream
  "kontext",          // Flux Kontext (image-to-image)
  "turbo",            // SDXL Turbo
];

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function buildApiInfo() {
  return {
    status: true,
    maintainer: "Free AI API Server",
    powered_by: "Pollinations.ai",
    note: "100% Free — No API key required",
    available_models: {
      chat: CHAT_MODELS,
      image: IMAGE_MODELS,
      websearch: ["searchgpt", "gemini", "openai"],
    },
    endpoints: {
      chat: "GET /api/chat?query=Hello&model=openai",
      image: "GET /api/image?prompt=A+cat&model=flux",
      image_edit: "GET /api/image?prompt=Add+a+hat&model=kontext&imgurl=https://...",
      websearch: "GET /api/search?query=Latest+news",
      openai_compat: "GET /api/openai?query=Hello&model=openai&imgurl=(optional)",
    },
  };
}

// Fetch with timeout helper
async function fetchWithTimeout(url, options = {}, timeoutMs = 60000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const { default: fetch } = await import("node-fetch");
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

// ═══════════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════════

// Root — API info
app.get("/", (req, res) => {
  res.json(buildApiInfo());
});

// ──────────────────────────────────────────────────────────────
// 1. CHAT ENDPOINT
//    GET /api/chat?query=Hello&model=openai&system=You+are+helpful
// ──────────────────────────────────────────────────────────────
app.get("/api/chat", async (req, res) => {
  const { query, model = "openai", system = "You are a helpful AI assistant.", seed } = req.query;

  if (!query) {
    return res.status(400).json({ status: false, error: "Missing 'query' parameter" });
  }

  try {
    const body = {
      messages: [{ role: "user", content: query }],
      model,
      system,
      ...(seed && { seed: parseInt(seed) }),
    };

    const response = await fetchWithTimeout(`${POLLINATIONS_TEXT}/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Upstream error: ${response.status} ${response.statusText}`);
    }

    const text = await response.text();

    return res.json({
      status: true,
      model,
      response: text,
      model_type: "chat",
      available_models: { chat: CHAT_MODELS },
    });
  } catch (err) {
    return res.status(500).json({ status: false, error: err.message });
  }
});

// ──────────────────────────────────────────────────────────────
// 2. IMAGE GENERATION / EDIT ENDPOINT
//    GET /api/image?prompt=A+cat&model=flux&width=1024&height=1024
//    GET /api/image?prompt=Add+hat&model=kontext&imgurl=https://...
//
//    ✅ Returns image DIRECTLY as binary (image/jpeg or image/png)
// ──────────────────────────────────────────────────────────────
app.get("/api/image", async (req, res) => {
  const {
    prompt,
    model = "flux",
    width = 1024,
    height = 1024,
    seed,
    enhance = false,
    safe = false,
    imgurl,        // optional: source image URL for editing
  } = req.query;

  if (!prompt) {
    return res.status(400).json({ status: false, error: "Missing 'prompt' parameter" });
  }

  try {
    const encodedPrompt = encodeURIComponent(prompt);
    let imageUrl = `${POLLINATIONS_IMAGE}/prompt/${encodedPrompt}`;

    const params = new URLSearchParams();
    params.set("model", model);
    params.set("width", width);
    params.set("height", height);
    params.set("nologo", "true");
    if (seed) params.set("seed", seed);
    if (enhance === "true") params.set("enhance", "true");
    if (safe === "true") params.set("safe", "true");
    // For image-to-image editing (kontext, nanobanana, seedream support this)
    if (imgurl) params.set("image", imgurl);

    imageUrl += `?${params.toString()}`;

    const response = await fetchWithTimeout(imageUrl, {}, 90000);

    if (!response.ok) {
      throw new Error(`Image generation failed: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const buffer = await response.buffer();

    // Return image DIRECTLY as binary
    res.set("Content-Type", contentType);
    res.set("Cache-Control", "public, max-age=3600");
    res.set("X-Model-Used", model);
    res.set("X-Prompt", prompt.substring(0, 100));
    return res.send(buffer);
  } catch (err) {
    return res.status(500).json({ status: false, error: err.message });
  }
});

// ──────────────────────────────────────────────────────────────
// 3. WEB SEARCH ENDPOINT
//    GET /api/search?query=Latest+AI+news&model=searchgpt
// ──────────────────────────────────────────────────────────────
app.get("/api/search", async (req, res) => {
  const { query, model = "searchgpt" } = req.query;

  if (!query) {
    return res.status(400).json({ status: false, error: "Missing 'query' parameter" });
  }

  try {
    const body = {
      messages: [
        {
          role: "user",
          content: `Search the web and answer this query: ${query}. Include sources and links where possible.`,
        },
      ],
      model,
      system: "You are a helpful web search assistant. Search the web and provide comprehensive, up-to-date answers with sources.",
    };

    const response = await fetchWithTimeout(`${POLLINATIONS_TEXT}/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Upstream error: ${response.status} ${response.statusText}`);
    }

    const text = await response.text();

    return res.json({
      status: true,
      model,
      query,
      response: text,
      model_type: "websearch",
      available_models: { websearch: ["searchgpt", "gemini", "openai"] },
    });
  } catch (err) {
    return res.status(500).json({ status: false, error: err.message });
  }
});

// ──────────────────────────────────────────────────────────────
// 4. OPENAI-COMPATIBLE UNIFIED ENDPOINT (like reixz format)
//    GET /api/openai?query=Hello&uid=3&model=openai&imgurl=(optional)
//
//    If imgurl is provided → analyze image (vision)
//    Otherwise → standard chat
// ──────────────────────────────────────────────────────────────
app.get("/api/openai", async (req, res) => {
  const {
    query,
    uid = "anonymous",
    model = "openai",
    imgurl,
    system = "You are a helpful AI assistant.",
  } = req.query;

  if (!query) {
    return res.status(400).json({ status: false, error: "Missing 'query' parameter" });
  }

  try {
    let messages;

    if (imgurl) {
      // Vision mode: analyze image
      messages = [
        {
          role: "user",
          content: [
            { type: "text", text: query },
            { type: "image_url", image_url: { url: imgurl } },
          ],
        },
      ];
    } else {
      messages = [{ role: "user", content: query }];
    }

    // Use vision-capable model if image provided
    const useModel = imgurl ? (["openai", "openai-fast", "gemini", "claude"].includes(model) ? model : "openai") : model;

    const body = {
      messages,
      model: useModel,
      system,
    };

    const response = await fetchWithTimeout(`${POLLINATIONS_TEXT}/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Upstream error: ${response.status} ${response.statusText}`);
    }

    const text = await response.text();

    return res.json({
      status: true,
      maintainer: "Free AI API Server",
      uid,
      response: text,
      model_used: useModel,
      vision_mode: !!imgurl,
      model_type: imgurl ? "vision" : "chat",
      available_models: {
        chat: CHAT_MODELS,
        image: IMAGE_MODELS,
        websearch: ["searchgpt", "gemini", "openai"],
      },
    });
  } catch (err) {
    return res.status(500).json({ status: false, error: err.message });
  }
});

// ──────────────────────────────────────────────────────────────
// 5. MODELS LIST ENDPOINT
//    GET /api/models
// ──────────────────────────────────────────────────────────────
app.get("/api/models", (req, res) => {
  res.json({
    status: true,
    available_models: {
      chat: CHAT_MODELS,
      image: IMAGE_MODELS,
      websearch: ["searchgpt", "gemini", "openai"],
    },
    powered_by: "Pollinations.ai",
    note: "All models are free — No API key required",
  });
});

// ──────────────────────────────────────────────────────────────
// 6. TEST UI — Interactive browser interface
//    GET /test
// ──────────────────────────────────────────────────────────────
app.get("/test", (req, res) => {
  res.sendFile(join(__dirname, "public", "index.html"));
});

// Serve static files
app.use(express.static(join(__dirname, "public")));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: false,
    error: "Endpoint not found",
    available_endpoints: ["/api/chat", "/api/image", "/api/search", "/api/openai", "/api/models", "/test"],
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ status: false, error: "Internal server error" });
});

// ═══════════════════════════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════════════════════════
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════╗
║        🚀 FREE AI API SERVER RUNNING                 ║
║  Port     : ${PORT}                                    ║
║  Test UI  : http://localhost:${PORT}/test               ║
║  Powered  : Pollinations.ai (No API Key!)            ║
╠══════════════════════════════════════════════════════╣
║  ENDPOINTS:                                          ║
║  GET /api/chat?query=Hello&model=openai              ║
║  GET /api/image?prompt=A+cat&model=flux              ║
║  GET /api/search?query=Latest+news                   ║
║  GET /api/openai?query=Hi&model=openai&uid=1         ║
║  GET /api/models                                     ║
║  GET /test  ← Interactive UI                         ║
╚══════════════════════════════════════════════════════╝
  `);
});
