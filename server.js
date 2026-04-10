// ╔══════════════════════════════════════════════════════════════════╗
// ║        FREE AI API SERVER v3.0 — Pollinations.ai               ║
// ║  Chat · Image · Image Edit · Web Search · Vision · Audio TTS   ║
// ║  Fournisseur : Pollinations.ai — 100% Gratuit, sans clé API    ║
// ╚══════════════════════════════════════════════════════════════════╝

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

// ═══════════════════════════════════════════════════════════════════
// POLLINATIONS.AI — Fournisseur d'IA gratuit
// Base URL : https://text.pollinations.ai  /  https://image.pollinations.ai
// Docs     : https://enter.pollinations.ai/api/docs
// ═══════════════════════════════════════════════════════════════════

const TEXT_API  = "https://text.pollinations.ai";
const IMAGE_API = "https://image.pollinations.ai";

// ── MODÈLES TEXTE ────────────────────────────────────────────────
// ✅ = 100% gratuit, sans clé API
// 💰 = nécessite clé Pollen (payant)
const ALL_TEXT_MODELS = [
  // ── Gratuits ──
  { id:"openai",               name:"OpenAI GPT-5.4 Nano",                free:true,  vision:false, search:false, tags:["tools"] },
  { id:"openai-fast",          name:"OpenAI GPT-5 Nano — Ultra Fast",      free:true,  vision:false, search:false, tags:["tools"] },
  { id:"openai-large",         name:"OpenAI GPT-5.4 — Most Powerful",      free:true,  vision:false, search:false, tags:["tools","reasoning"] },
  { id:"gemini-fast",          name:"Google Gemini 2.5 Flash Lite",        free:true,  vision:true,  search:true,  tags:["tools","search","code-exec"] },
  { id:"gemini-search",        name:"Google Gemini 2.5 Flash Lite + Search",free:true, vision:true,  search:true,  tags:["search","code-exec"] },
  { id:"deepseek",             name:"DeepSeek V3.2",                       free:true,  vision:false, search:false, tags:["tools","reasoning"] },
  { id:"deepseek-reasoning",   name:"DeepSeek R1 — Chain of Thought",      free:true,  vision:false, search:false, tags:["reasoning"] },
  { id:"mistral",              name:"Mistral Small 3.2",                   free:true,  vision:false, search:false, tags:["tools"] },
  { id:"qwen-coder",           name:"Qwen3 Coder 30B — Code Specialist",   free:true,  vision:false, search:false, tags:["tools"] },
  { id:"claude-fast",          name:"Anthropic Claude Haiku 4.5",          free:true,  vision:true,  search:false, tags:["tools"] },
  { id:"perplexity-fast",      name:"Perplexity Sonar — Web Search",       free:true,  vision:false, search:true,  tags:["search"] },
  { id:"perplexity-reasoning", name:"Perplexity Sonar Reasoning",          free:true,  vision:false, search:true,  tags:["reasoning","search"] },
  { id:"kimi",                 name:"Moonshot Kimi K2.5 — Vision+Agents",  free:true,  vision:true,  search:false, tags:["tools","reasoning"] },
  { id:"nova-fast",            name:"Amazon Nova Micro — Ultra Fast",       free:true,  vision:false, search:false, tags:["tools"] },
  { id:"nova",                 name:"Amazon Nova 2 Lite — 1M Context",     free:true,  vision:false, search:false, tags:["tools","reasoning"] },
  { id:"glm",                  name:"Z.ai GLM-5 — 744B MoE Long Context",  free:true,  vision:false, search:false, tags:["tools","reasoning"] },
  { id:"minimax",              name:"MiniMax M2.5 — Multi-Language",       free:true,  vision:false, search:false, tags:["tools","reasoning"] },
  { id:"mistral-large",        name:"Mistral Large 3 — Premium Reasoning", free:true,  vision:false, search:false, tags:["tools","reasoning"] },
  { id:"qwen-coder-large",     name:"Qwen3 Coder Next — Advanced Code",    free:true,  vision:false, search:false, tags:["tools"] },
  { id:"qwen-large",           name:"Qwen3.5 Plus — Alibaba Frontier MoE", free:true,  vision:false, search:false, tags:["tools","reasoning"] },
  { id:"qwen-vision",          name:"Qwen3 VL Plus — Vision+Language",     free:true,  vision:true,  search:false, tags:["tools","reasoning"] },
  { id:"qwen-safety",          name:"Qwen3Guard 8B — Content Safety",      free:true,  vision:false, search:false, tags:[] },
  { id:"midijourney",          name:"MIDIjourney — AI Music Composition",  free:true,  vision:false, search:false, tags:["tools"] },
  { id:"polly",                name:"Polly — Pollinations AI Assistant",   free:true,  vision:false, search:true,  tags:["tools","reasoning","search"] },
  // ── Payants (💰) ──
  { id:"gemini",               name:"Google Gemini 3 Flash",               free:false, vision:true,  search:true,  tags:["tools","search"] },
  { id:"gemini-flash-lite-3.1",name:"Google Gemini 3.1 Flash Lite",        free:false, vision:true,  search:true,  tags:["tools","search"] },
  { id:"gemini-large",         name:"Google Gemini 3.1 Pro — 1M Context",  free:false, vision:true,  search:true,  tags:["tools","reasoning","search"] },
  { id:"claude",               name:"Anthropic Claude Sonnet 4.6",         free:false, vision:true,  search:false, tags:["tools"] },
  { id:"claude-large",         name:"Anthropic Claude Opus 4.6",           free:false, vision:true,  search:false, tags:["tools"] },
  { id:"grok",                 name:"xAI Grok 4.1 Fast",                   free:false, vision:false, search:false, tags:["tools"] },
  { id:"grok-large",           name:"xAI Grok 4.20 Reasoning",             free:false, vision:false, search:false, tags:["tools","reasoning"] },
  { id:"midijourney-large",    name:"MIDIjourney Large — Premium Music",   free:false, vision:false, search:false, tags:["tools"] },
];

// ── MODÈLES IMAGE ────────────────────────────────────────────────
const ALL_IMAGE_MODELS = [
  // ✅ Gratuits — génération texte→image
  { id:"flux",          name:"Flux Schnell — Fast High-Quality",           free:true,  edit:false },
  { id:"zimage",        name:"Z-Image Turbo — Fast 6B Flux + 2x Upscale", free:true,  edit:false },
  // 💰 Payants ou nécessitent clé
  { id:"kontext",       name:"FLUX.1 Kontext — In-context Editing",        free:false, edit:true  },
  { id:"nanobanana",    name:"NanoBanana — Gemini 2.5 Flash Image",        free:false, edit:true  },
  { id:"nanobanana-2",  name:"NanoBanana 2 — Gemini 3.1 Flash Image",      free:false, edit:true  },
  { id:"nanobanana-pro",name:"NanoBanana Pro — Gemini 3 Pro Image (4K)",   free:false, edit:true  },
  { id:"seedream5",     name:"Seedream 5.0 Lite — ByteDance",              free:false, edit:true  },
  { id:"gptimage",      name:"GPT Image 1 Mini — OpenAI",                  free:false, edit:true  },
  { id:"gptimage-large",name:"GPT Image 1.5 — OpenAI Advanced",            free:false, edit:true  },
  { id:"wan-image",     name:"Wan 2.7 Image — Alibaba (up to 2K)",         free:false, edit:true  },
  { id:"wan-image-pro", name:"Wan 2.7 Image Pro — Alibaba (4K)",           free:false, edit:true  },
  { id:"qwen-image",    name:"Qwen Image Plus — Alibaba",                  free:false, edit:true  },
  { id:"grok-imagine",  name:"Grok Imagine — xAI Official",                free:false, edit:false },
  { id:"klein",         name:"FLUX.2 Klein 4B — Fast Gen+Edit",            free:false, edit:true  },
  { id:"nova-canvas",   name:"Amazon Nova Canvas — Bedrock",               free:false, edit:true  },
];

// Modèles vision (analyse image) gratuits
const FREE_VISION_MODELS = ALL_TEXT_MODELS.filter(m => m.free && m.vision).map(m => m.id);
// Modèles search gratuits
const FREE_SEARCH_MODELS = ALL_TEXT_MODELS.filter(m => m.free && m.search).map(m => m.id);
// Modèles texte gratuits
const FREE_TEXT_IDS = ALL_TEXT_MODELS.filter(m => m.free).map(m => m.id);
// Modèles image gratuits
const FREE_IMAGE_IDS = ALL_IMAGE_MODELS.filter(m => m.free).map(m => m.id);

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════

async function doFetch(url, options = {}, timeoutMs = 120000) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const { default: fetch } = await import("node-fetch");
    return await fetch(url, { ...options, signal: ctrl.signal });
  } finally {
    clearTimeout(id);
  }
}

function buildInfo() {
  return {
    status: true,
    server: "Free AI API Server v3.0",
    provider: "Pollinations.ai",
    provider_url: "https://pollinations.ai",
    provider_docs: "https://enter.pollinations.ai/api/docs",
    note: "Fournisseur : Pollinations.ai — Plateforme open-source 100% gratuite, sans inscription, sans clé API pour les modèles gratuits.",
    free_models: {
      text: FREE_TEXT_IDS,
      image: FREE_IMAGE_IDS,
      vision: FREE_VISION_MODELS,
      search: FREE_SEARCH_MODELS,
    },
    all_models: {
      text: ALL_TEXT_MODELS,
      image: ALL_IMAGE_MODELS,
    },
    endpoints: {
      chat:       "GET /api/chat?query=Hello&model=openai",
      image:      "GET /api/image?prompt=A+cat&model=flux",
      image_edit: "GET /api/image?prompt=Edit+this&model=nanobanana-pro&imgurl=https://...",
      search:     "GET /api/search?query=Latest+news&model=searchgpt",
      vision:     "GET /api/openai?query=What+is+this?&imgurl=https://...&model=gemini-fast",
      openai:     "GET /api/openai?query=Hello&uid=1&model=openai&imgurl=(optional)",
      models:     "GET /api/models",
      test_ui:    "GET /test",
    },
  };
}

// ═══════════════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════════════

app.get("/", (req, res) => res.json(buildInfo()));

// ─────────────────────────────────────────────────────────────────
// 1. CHAT  GET /api/chat?query=...&model=openai&system=...
// ─────────────────────────────────────────────────────────────────
app.get("/api/chat", async (req, res) => {
  const { query, model = "openai", system = "You are a helpful AI assistant.", seed } = req.query;
  if (!query) return res.status(400).json({ status: false, error: "Missing 'query'" });

  const modelInfo = ALL_TEXT_MODELS.find(m => m.id === model);

  try {
    const body = {
      messages: [{ role: "user", content: query }],
      model,
      system,
      ...(seed && { seed: parseInt(seed) }),
    };

    const r = await doFetch(`${TEXT_API}/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!r.ok) {
      const t = await r.text();
      throw new Error(`Upstream ${r.status}: ${t.substring(0, 300)}`);
    }

    const text = await r.text();
    return res.json({
      status: true,
      provider: "Pollinations.ai",
      model,
      model_info: modelInfo || null,
      free: modelInfo ? modelInfo.free : null,
      response: text,
      model_type: "chat",
      free_models: FREE_TEXT_IDS,
    });
  } catch (err) {
    console.error("[CHAT]", err.message);
    return res.status(500).json({ status: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// 2. IMAGE GENERATE / EDIT
//    GET /api/image?prompt=...&model=flux
//    GET /api/image?prompt=...&model=nanobanana-pro&imgurl=https://...
//    → Retourne l'image DIRECTEMENT en binaire (image/jpeg)
// ─────────────────────────────────────────────────────────────────
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
    negative_prompt,
    quality,
  } = req.query;

  if (!prompt) return res.status(400).json({ status: false, error: "Missing 'prompt'" });

  try {
    let useModel = model;
    // Si édition demandée mais modèle ne supporte pas → auto-fallback
    if (imgurl) {
      const imgModel = ALL_IMAGE_MODELS.find(m => m.id === model);
      if (!imgModel || !imgModel.edit) useModel = "nanobanana-pro";
    }

    const params = new URLSearchParams({
      model:  useModel,
      width:  String(width),
      height: String(height),
      nologo: "true",
    });
    if (seed)             params.set("seed",            String(seed));
    if (enhance==="true") params.set("enhance",         "true");
    if (safe==="true")    params.set("safe",            "true");
    if (imgurl)           params.set("image",           imgurl);
    if (negative_prompt)  params.set("negative_prompt", negative_prompt);
    if (quality)          params.set("quality",         quality);

    const url = `${IMAGE_API}/prompt/${encodeURIComponent(prompt)}?${params}`;
    console.log(`[IMG ${imgurl?"EDIT":"GEN"}] model=${useModel}`);

    const r = await doFetch(url, {}, 180000);
    if (!r.ok) {
      const t = await r.text();
      throw new Error(`Image API ${r.status}: ${t.substring(0, 300)}`);
    }

    const ct  = r.headers.get("content-type") || "image/jpeg";
    const buf = await r.buffer();
    res.set("Content-Type",  ct);
    res.set("Cache-Control", "public, max-age=3600");
    res.set("X-Model-Used",  useModel);
    res.set("X-Mode",        imgurl ? "edit" : "generate");
    res.set("X-Provider",    "Pollinations.ai");
    return res.send(buf);
  } catch (err) {
    console.error("[IMAGE]", err.message);
    return res.status(500).json({ status: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// 3. WEB SEARCH  GET /api/search?query=...&model=searchgpt
// ─────────────────────────────────────────────────────────────────
app.get("/api/search", async (req, res) => {
  const { query, model = "perplexity-fast" } = req.query;
  if (!query) return res.status(400).json({ status: false, error: "Missing 'query'" });

  const useModel = FREE_SEARCH_MODELS.includes(model) ? model : "perplexity-fast";

  try {
    const r = await doFetch(`${TEXT_API}/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: `Search the web and answer: ${query}\nInclude sources and links where possible.` }],
        model: useModel,
        system: "You are a web search assistant. Provide comprehensive, up-to-date answers with sources and links.",
      }),
    }, 60000);

    if (!r.ok) {
      const t = await r.text();
      throw new Error(`Upstream ${r.status}: ${t.substring(0, 300)}`);
    }

    const text = await r.text();
    return res.json({
      status: true,
      provider: "Pollinations.ai",
      model: useModel,
      query,
      response: text,
      model_type: "websearch",
      free_search_models: FREE_SEARCH_MODELS,
    });
  } catch (err) {
    console.error("[SEARCH]", err.message);
    return res.status(500).json({ status: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// 4. OPENAI-COMPATIBLE UNIFIED  /api/openai (format reixz)
//    GET /api/openai?query=Hello&uid=3&model=openai&imgurl=(opt)
//    VISION : Le serveur récupère l'image → base64 → envoi inline
// ─────────────────────────────────────────────────────────────────
app.get("/api/openai", async (req, res) => {
  const {
    query,
    uid    = "anonymous",
    model  = "openai",
    imgurl,
    system = "You are a helpful AI assistant.",
  } = req.query;

  if (!query) return res.status(400).json({ status: false, error: "Missing 'query'" });

  try {
    let messages;
    let useModel = model;
    let visionMode = false;

    if (imgurl) {
      visionMode = true;
      // Force vision-capable model
      if (!FREE_VISION_MODELS.includes(model)) useModel = "gemini-fast";

      // Récupère image côté serveur → base64 (méthode la plus fiable)
      let imgPart;
      try {
        const { default: fetch } = await import("node-fetch");
        const ir = await fetch(imgurl, { timeout: 30000 });
        if (ir.ok) {
          const buf  = await ir.buffer();
          const mime = ir.headers.get("content-type") || "image/jpeg";
          imgPart = { type: "image_url", image_url: { url: `data:${mime};base64,${buf.toString("base64")}` } };
        } else throw new Error("img fetch failed");
      } catch (_) {
        imgPart = { type: "image_url", image_url: { url: imgurl } };
      }

      messages = [{ role: "user", content: [{ type: "text", text: query }, imgPart] }];
    } else {
      messages = [{ role: "user", content: query }];
    }

    const r = await doFetch(`${TEXT_API}/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, model: useModel, system }),
    });

    if (!r.ok) {
      const t = await r.text();
      throw new Error(`Upstream ${r.status}: ${t.substring(0, 300)}`);
    }

    const text = await r.text();
    return res.json({
      status: true,
      provider: "Pollinations.ai",
      maintainer: "Free AI API Server v3.0",
      uid,
      response: text,
      model_used: useModel,
      vision_mode: visionMode,
      model_type: visionMode ? "vision" : "chat",
      free_models: {
        text:   FREE_TEXT_IDS,
        image:  FREE_IMAGE_IDS,
        vision: FREE_VISION_MODELS,
        search: FREE_SEARCH_MODELS,
      },
    });
  } catch (err) {
    console.error("[OPENAI]", err.message);
    return res.status(500).json({ status: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// 5. MODELS  GET /api/models
// ─────────────────────────────────────────────────────────────────
app.get("/api/models", (req, res) => {
  res.json({
    status: true,
    provider: "Pollinations.ai",
    provider_url: "https://pollinations.ai",
    updated: "April 2026",
    summary: {
      total_text_models:       ALL_TEXT_MODELS.length,
      free_text_models:        FREE_TEXT_IDS.length,
      total_image_models:      ALL_IMAGE_MODELS.length,
      free_image_models:       FREE_IMAGE_IDS.length,
      free_vision_models:      FREE_VISION_MODELS.length,
      free_search_models:      FREE_SEARCH_MODELS.length,
    },
    free_text_models:   FREE_TEXT_IDS,
    free_image_models:  FREE_IMAGE_IDS,
    free_vision_models: FREE_VISION_MODELS,
    free_search_models: FREE_SEARCH_MODELS,
    all_text_models:    ALL_TEXT_MODELS,
    all_image_models:   ALL_IMAGE_MODELS,
    tips: {
      best_chat_free:       "openai (GPT-5.4 Nano) ou gemini-fast",
      best_vision_free:     "gemini-fast ou claude-fast",
      best_search_free:     "perplexity-fast ou gemini-search",
      best_image_free:      "flux ou zimage",
      best_image_edit_paid: "nanobanana-pro (Gemini 3 Pro) ou kontext",
      note:                 "Les modèles 💰 fonctionnent mais nécessitent une clé Pollen via enter.pollinations.ai",
    },
  });
});

// ─────────────────────────────────────────────────────────────────
// STATIC & ERRORS
// ─────────────────────────────────────────────────────────────────
app.get("/test", (req, res) => res.sendFile(join(__dirname, "public", "index.html")));
app.use(express.static(join(__dirname, "public")));
app.use((req, res) => res.status(404).json({ status: false, error: "Not found", available: ["/api/chat","/api/image","/api/search","/api/openai","/api/models","/test"] }));
app.use((err, req, res, _next) => { console.error(err.stack); res.status(500).json({ status: false, error: "Server error" }); });

// ═══════════════════════════════════════════════════════════════════
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║      🌸 FREE AI API SERVER v3.0 — Pollinations.ai           ║
║  Port     : ${PORT}                                            ║
║  Test UI  : http://localhost:${PORT}/test                       ║
║  Fournisseur : Pollinations.ai (open-source, gratuit !)     ║
╠══════════════════════════════════════════════════════════════╣
║  ✅ ${FREE_TEXT_IDS.length} modèles texte GRATUITS                            ║
║  ✅ ${FREE_IMAGE_IDS.length} modèles image GRATUITS                           ║
║  ✅ ${FREE_VISION_MODELS.length} modèles vision GRATUITS                         ║
║  ✅ ${FREE_SEARCH_MODELS.length} modèles web search GRATUITS                    ║
║  💰 Modèles payants aussi disponibles (avec clé Pollen)     ║
╚══════════════════════════════════════════════════════════════╝
  `);
});
