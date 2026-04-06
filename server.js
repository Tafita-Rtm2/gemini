// ╔══════════════════════════════════════════════════════════════╗
// ║          FREE AI API SERVER v2.0 — FULLY FIXED             ║
// ║   Chat · Image Generate/Edit · Web Search · Vision         ║
// ║   Powered by Pollinations.ai (No API Key Required)         ║
// ╚══════════════════════════════════════════════════════════════╝

import express from "express";
import cors from "cors";
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
// CONSTANTS — Verified April 2026 from Pollinations docs
// ═══════════════════════════════════════════════════════════════
const TEXT_API  = "https://text.pollinations.ai";
const IMAGE_API = "https://image.pollinations.ai";

// FREE text/chat models (verified working, no key)
const CHAT_MODELS = [
  "openai",              // GPT-5 Mini — Fast & Balanced ⭐
  "openai-fast",         // GPT-5 Nano — Ultra Fast
  "openai-large",        // GPT-5.2 — Most Powerful
  "claude",              // Claude Sonnet — Anthropic ✅ Vision
  "claude-fast",         // Claude Haiku — Fast ✅ Vision
  "gemini",              // Gemini 3 Flash ✅ Vision
  "gemini-fast",         // Gemini 2.5 Flash Lite — FREE ✅ Vision
  "gemini-search",       // Gemini + Google Search 🔍
  "deepseek",            // DeepSeek V3.2
  "deepseek-reasoning",  // DeepSeek R1 — Chain of thought
  "mistral",             // Mistral Small 3.2
  "qwen-coder",          // Qwen3 Coder — Code specialist
  "searchgpt",           // SearchGPT — Web search 🔍
  "llama",               // Llama 3 — Meta
  "unity",               // Unity — Uncensored
];

// FREE image generation models (no API key needed)
// NOTE: kontext + gptimage now require paid Pollen credits → removed
const IMAGE_MODELS = [
  "flux",           // Flux Schnell — Fastest FREE ✅
  "flux-realism",   // Flux Realism — Photorealistic ✅
  "flux-pro",       // Flux Pro — Higher quality ✅
  "turbo",          // SDXL Turbo — Very fast ✅
  "nanobanana",     // Nano Banana (Gemini 2.5 Flash Image) 🍌 ✅
  "nanobanana-pro", // Nano Banana Pro (Gemini 3 Pro Image) 🍌⭐ ✅
  "seedream",       // Seedream — Artistic ✅
];

// Models that support image-to-image editing via ?image= param
const EDIT_MODELS = ["nanobanana-pro", "nanobanana", "seedream", "flux-realism", "flux"];

// Models that support vision (image analysis)
const VISION_MODELS = ["gemini-fast", "gemini", "claude", "claude-fast", "openai", "openai-large"];

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

async function fetchWithTimeout(url, options = {}, timeoutMs = 90000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const { default: fetch } = await import("node-fetch");
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

function buildInfo() {
  return {
    status: true,
    maintainer: "Free AI API Server v2.0",
    powered_by: "Pollinations.ai",
    note: "100% Free — No API key required",
    version: "2.0.0",
    updated: "April 2026",
    available_models: {
      chat: CHAT_MODELS,
      image_generate: IMAGE_MODELS,
      image_edit: EDIT_MODELS,
      websearch: ["searchgpt", "gemini-search"],
      vision: VISION_MODELS,
    },
    endpoints: {
      chat:        "GET /api/chat?query=Hello&model=openai",
      image:       "GET /api/image?prompt=A+cat&model=flux",
      image_edit:  "GET /api/image?prompt=Add+hat&model=nanobanana-pro&imgurl=https://...",
      websearch:   "GET /api/search?query=Latest+news",
      openai_compat:"GET /api/openai?query=Hello&uid=1&model=openai&imgurl=(optional)",
      models:      "GET /api/models",
      test_ui:     "GET /test",
    },
  };
}

// ═══════════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════════

app.get("/", (req, res) => res.json(buildInfo()));

// ─────────────────────────────────────────────────────────────
// 1. CHAT   GET /api/chat?query=...&model=openai&system=...
// ─────────────────────────────────────────────────────────────
app.get("/api/chat", async (req, res) => {
  const { query, model = "openai", system = "You are a helpful AI assistant." } = req.query;
  if (!query) return res.status(400).json({ status: false, error: "Missing 'query' parameter" });

  try {
    const response = await fetchWithTimeout(`${TEXT_API}/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: query }],
        model,
        system,
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      throw new Error(`Upstream ${response.status}: ${t.substring(0, 300)}`);
    }

    const text = await response.text();
    return res.json({ status: true, model, response: text, model_type: "chat", available_models: { chat: CHAT_MODELS } });
  } catch (err) {
    console.error("[CHAT]", err.message);
    return res.status(500).json({ status: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 2. IMAGE GENERATE / EDIT
//    GET /api/image?prompt=...&model=flux[&imgurl=...&width=&height=]
//    Returns image DIRECTLY as binary — usable in <img src="...">
// ─────────────────────────────────────────────────────────────
app.get("/api/image", async (req, res) => {
  const {
    prompt,
    model   = "flux",
    width   = 1024,
    height  = 1024,
    seed,
    enhance = "false",
    safe    = "false",
    imgurl,
  } = req.query;

  if (!prompt) return res.status(400).json({ status: false, error: "Missing 'prompt' parameter" });

  try {
    let useModel = model;
    // Auto-switch to edit-capable model if imgurl given but chosen model can't edit
    if (imgurl && !EDIT_MODELS.includes(model)) useModel = "nanobanana-pro";

    const params = new URLSearchParams({
      model:  useModel,
      width:  String(width),
      height: String(height),
      nologo: "true",
    });
    if (seed)               params.set("seed",    String(seed));
    if (enhance === "true") params.set("enhance", "true");
    if (safe === "true")    params.set("safe",    "true");
    if (imgurl)             params.set("image",   imgurl); // ← official param for img2img

    const url = `${IMAGE_API}/prompt/${encodeURIComponent(prompt)}?${params}`;
    console.log(`[IMAGE ${imgurl ? "EDIT" : "GEN"}] model=${useModel}`);

    const response = await fetchWithTimeout(url, {}, 120000);
    if (!response.ok) {
      const t = await response.text();
      throw new Error(`Image API ${response.status}: ${t.substring(0, 300)}`);
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const buffer = await response.buffer();
    res.set("Content-Type",   contentType);
    res.set("Cache-Control",  "public, max-age=3600");
    res.set("X-Model-Used",   useModel);
    res.set("X-Mode",         imgurl ? "edit" : "generate");
    return res.send(buffer);
  } catch (err) {
    console.error("[IMAGE]", err.message);
    return res.status(500).json({ status: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 3. WEB SEARCH   GET /api/search?query=...&model=searchgpt
// ─────────────────────────────────────────────────────────────
app.get("/api/search", async (req, res) => {
  const { query, model = "searchgpt" } = req.query;
  if (!query) return res.status(400).json({ status: false, error: "Missing 'query' parameter" });

  // Only use models that have real web search capabilities
  const useModel = ["searchgpt", "gemini-search", "gemini-fast"].includes(model) ? model : "searchgpt";

  try {
    const response = await fetchWithTimeout(`${TEXT_API}/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: `Search the web and answer: ${query}\nInclude sources and links where possible.` }],
        model: useModel,
        system: "You are a web search assistant. Always search the web for the latest information and include sources.",
      }),
    }, 60000);

    if (!response.ok) {
      const t = await response.text();
      throw new Error(`Upstream ${response.status}: ${t.substring(0, 300)}`);
    }

    const text = await response.text();
    return res.json({
      status: true, model: useModel, query, response: text,
      model_type: "websearch",
      available_models: { websearch: ["searchgpt", "gemini-search"] },
    });
  } catch (err) {
    console.error("[SEARCH]", err.message);
    return res.status(500).json({ status: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 4. OPENAI-COMPATIBLE UNIFIED  /api/openai (reixz format)
//    GET /api/openai?query=Hello&uid=3&model=openai&imgurl=(opt)
//
//    ✅ VISION fully working:
//       Server fetches the image → converts to base64 → sends inline
//       Works with: gemini-fast, claude, claude-fast, openai
// ─────────────────────────────────────────────────────────────
app.get("/api/openai", async (req, res) => {
  const {
    query,
    uid    = "anonymous",
    model  = "openai",
    imgurl,
    system = "You are a helpful AI assistant.",
  } = req.query;

  if (!query) return res.status(400).json({ status: false, error: "Missing 'query' parameter" });

  try {
    let messages;
    let useModel = model;
    let visionMode = false;

    if (imgurl) {
      visionMode = true;
      // Force vision-capable model
      if (!VISION_MODELS.includes(model)) useModel = "gemini-fast";

      // Fetch image server-side → base64 (most reliable way for vision)
      let imageContentPart;
      try {
        const { default: fetch } = await import("node-fetch");
        const imgRes = await fetch(imgurl, { timeout: 30000 });
        if (imgRes.ok) {
          const buf      = await imgRes.buffer();
          const mime     = imgRes.headers.get("content-type") || "image/jpeg";
          const b64      = buf.toString("base64");
          imageContentPart = {
            type: "image_url",
            image_url: { url: `data:${mime};base64,${b64}` },
          };
        } else {
          throw new Error("Could not fetch image");
        }
      } catch (_) {
        // Fallback: send URL directly
        imageContentPart = { type: "image_url", image_url: { url: imgurl } };
      }

      messages = [{
        role: "user",
        content: [
          { type: "text", text: query },
          imageContentPart,
        ],
      }];
    } else {
      messages = [{ role: "user", content: query }];
    }

    const response = await fetchWithTimeout(`${TEXT_API}/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, model: useModel, system }),
    });

    if (!response.ok) {
      const t = await response.text();
      throw new Error(`Upstream ${response.status}: ${t.substring(0, 300)}`);
    }

    const text = await response.text();
    return res.json({
      status: true,
      maintainer: "Free AI API Server",
      uid,
      response: text,
      model_used: useModel,
      vision_mode: visionMode,
      model_type: visionMode ? "vision" : "chat",
      available_models: {
        chat:           CHAT_MODELS,
        image_generate: IMAGE_MODELS,
        image_edit:     EDIT_MODELS,
        websearch:      ["searchgpt", "gemini-search"],
        vision:         VISION_MODELS,
      },
    });
  } catch (err) {
    console.error("[OPENAI]", err.message);
    return res.status(500).json({ status: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 5. MODELS LIST  GET /api/models
// ─────────────────────────────────────────────────────────────
app.get("/api/models", (req, res) => {
  res.json({
    status: true,
    updated: "April 2026",
    available_models: {
      chat:           CHAT_MODELS,
      image_generate: IMAGE_MODELS,
      image_edit:     EDIT_MODELS,
      websearch:      ["searchgpt", "gemini-search", "gemini-fast"],
      vision:         VISION_MODELS,
    },
    powered_by: "Pollinations.ai",
    note: "All models free — No API key required",
    tips: {
      best_image_edit:  "nanobanana-pro (fastest + best quality for editing)",
      best_vision:      "gemini-fast (free) or claude",
      best_search:      "searchgpt (web) or gemini-search (Google)",
      removed_models:   "kontext + gptimage now require paid Pollen credits",
    },
  });
});

// ─────────────────────────────────────────────────────────────
// STATIC & ERRORS
// ─────────────────────────────────────────────────────────────
app.get("/test", (req, res) => res.sendFile(join(__dirname, "public", "index.html")));
app.use(express.static(join(__dirname, "public")));

app.use((req, res) => {
  res.status(404).json({
    status: false,
    error: "Endpoint not found",
    available: ["/api/chat", "/api/image", "/api/search", "/api/openai", "/api/models", "/test"],
  });
});

app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ status: false, error: "Internal server error" });
});

// ═══════════════════════════════════════════════════════════════
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║      🚀 FREE AI API SERVER v2.0 — FULLY FIXED           ║
║  Port    : ${PORT}                                         ║
║  Test UI : http://localhost:${PORT}/test                    ║
╠══════════════════════════════════════════════════════════╣
║  ✅ Chat   : openai, gemini-fast, claude, deepseek...    ║
║  ✅ Image  : flux, nanobanana, nanobanana-pro, seedream  ║
║  ✅ Edit   : nanobanana-pro (best) / nanobanana          ║
║  ✅ Search : searchgpt / gemini-search                   ║
║  ✅ Vision : server fetches image → base64 inline        ║
║  ❌ Removed: kontext, gptimage (paid key required now)   ║
╚══════════════════════════════════════════════════════════╝
  `);
});
