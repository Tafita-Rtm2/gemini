// ╔══════════════════════════════════════════════════════════════════╗
// ║   FREE AI API SERVER v5.0 — Pollinations.ai (gen.pollinations.ai)║
// ║   Chat · Image · Video · Audio · Music · Search · Vision        ║
// ║   100% GRATUIT — SANS CLÉ API — Deploy on Render                ║
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
// CONFIG — Pollinations.ai endpoints (Avril 2026)
// ═══════════════════════════════════════════════════════════════════

const GEN_API   = "https://gen.pollinations.ai";   // OpenAI-compatible (chat + image)
const IMAGE_API = "https://image.pollinations.ai"; // Image directe (legacy, toujours ok)

// Clé Pollen OPTIONNELLE — fonctionne sans pour tous les modèles gratuits
// Pour débloquer les modèles payants, créer une clé GRATUITE sur https://enter.pollinations.ai
const POLLEN_KEY = process.env.POLLEN_KEY || "";

function authHeaders(extra = {}) {
  const h = { "Content-Type": "application/json", ...extra };
  if (POLLEN_KEY) h["Authorization"] = `Bearer ${POLLEN_KEY}`;
  return h;
}

// ═══════════════════════════════════════════════════════════════════
// MODÈLES
// ═══════════════════════════════════════════════════════════════════

const TEXT_MODELS = [
  // ✅ GRATUITS sans clé
  { id:"openai",                label:"OpenAI GPT-5.4 Nano",               free:true,  vision:false, search:false },
  { id:"openai-fast",           label:"OpenAI GPT-5 Nano Ultra Fast",      free:true,  vision:false, search:false },
  { id:"openai-large",          label:"OpenAI GPT-5.4 Most Powerful",      free:true,  vision:false, search:false },
  { id:"gemini-fast",           label:"Google Gemini 2.5 Flash Lite",      free:true,  vision:true,  search:true  },
  { id:"gemini-search",         label:"Google Gemini 2.5 + Google Search", free:true,  vision:true,  search:true  },
  { id:"deepseek",              label:"DeepSeek V3.2",                     free:true,  vision:false, search:false },
  { id:"deepseek-reasoning",    label:"DeepSeek R1 Reasoning",             free:true,  vision:false, search:false },
  { id:"mistral",               label:"Mistral Small 3.2",                 free:true,  vision:false, search:false },
  { id:"mistral-large",         label:"Mistral Large 3",                   free:true,  vision:false, search:false },
  { id:"qwen-coder",            label:"Qwen3 Coder 30B",                   free:true,  vision:false, search:false },
  { id:"qwen-coder-large",      label:"Qwen3 Coder Next",                  free:true,  vision:false, search:false },
  { id:"qwen-large",            label:"Qwen3.5 Plus MoE",                  free:true,  vision:false, search:false },
  { id:"qwen-vision",           label:"Qwen3 VL Plus Vision",              free:true,  vision:true,  search:false },
  { id:"qwen-safety",           label:"Qwen3Guard 8B Safety",              free:true,  vision:false, search:false },
  { id:"claude-fast",           label:"Claude Haiku 4.5",                  free:true,  vision:true,  search:false },
  { id:"kimi",                  label:"Moonshot Kimi K2.5",                free:true,  vision:true,  search:false },
  { id:"perplexity-fast",       label:"Perplexity Sonar Web",              free:true,  vision:false, search:true  },
  { id:"perplexity-reasoning",  label:"Perplexity Sonar R1",               free:true,  vision:false, search:true  },
  { id:"nova-fast",             label:"Amazon Nova Micro",                 free:true,  vision:false, search:false },
  { id:"nova",                  label:"Amazon Nova 2 Lite 1M",             free:true,  vision:false, search:false },
  { id:"glm",                   label:"Z.ai GLM-5 744B MoE",               free:true,  vision:false, search:false },
  { id:"minimax",               label:"MiniMax M2.5",                      free:true,  vision:false, search:false },
  { id:"grok",                  label:"xAI Grok 4.1 Fast",                 free:true,  vision:false, search:false },
  { id:"midijourney",           label:"MIDIjourney Music AI",              free:true,  vision:false, search:false },
  { id:"polly",                 label:"Polly AI Search",                   free:true,  vision:false, search:true  },
  // 💰 Pollen (clé GRATUITE sur enter.pollinations.ai)
  { id:"gemini",                label:"Google Gemini 3 Flash",             free:false, vision:true,  search:true  },
  { id:"gemini-flash-lite-3.1", label:"Google Gemini 3.1 Flash Lite",      free:false, vision:true,  search:true  },
  { id:"gemini-large",          label:"Google Gemini 3.1 Pro 1M",          free:false, vision:true,  search:true  },
  { id:"claude",                label:"Anthropic Claude Sonnet 4.6",       free:false, vision:true,  search:false },
  { id:"claude-large",          label:"Anthropic Claude Opus 4.6",         free:false, vision:true,  search:false },
  { id:"grok-large",            label:"xAI Grok 4.20 Reasoning",           free:false, vision:false, search:false },
  { id:"midijourney-large",     label:"MIDIjourney Large Premium",         free:false, vision:false, search:false },
];

const IMAGE_MODELS = [
  // ✅ GRATUITS
  { id:"flux",           label:"Flux Schnell — Ultra Rapide",            free:true,  edit:false, video:false },
  { id:"zimage",         label:"Z-Image Turbo + 2x Upscale",            free:true,  edit:false, video:false },
  { id:"kontext",        label:"FLUX.1 Kontext — Édition image",         free:true,  edit:true,  video:false },
  { id:"gptimage",       label:"GPT Image 1 Mini — OpenAI",              free:true,  edit:true,  video:false },
  { id:"gptimage-large", label:"GPT Image 1.5 — OpenAI Avancé",          free:true,  edit:true,  video:false },
  { id:"klein",          label:"FLUX.2 Klein 4B — Édition",              free:true,  edit:true,  video:false },
  { id:"qwen-image",     label:"Qwen Image Plus — Alibaba",              free:true,  edit:true,  video:false },
  { id:"wan-image",      label:"Wan 2.7 Alibaba (2K)",                   free:true,  edit:true,  video:false },
  // 💰 Pollen
  { id:"nanobanana",     label:"NanoBanana — Gemini 2.5 Flash",          free:false, edit:true,  video:false },
  { id:"nanobanana-2",   label:"NanoBanana 2 — Gemini 3.1 Flash",        free:false, edit:true,  video:false },
  { id:"nanobanana-pro", label:"NanoBanana Pro — Gemini 3 Pro (4K)",      free:false, edit:true,  video:false },
  { id:"seedream5",      label:"Seedream 5.0 — ByteDance",               free:false, edit:true,  video:false },
  { id:"wan-image-pro",  label:"Wan 2.7 Pro (4K) — Alibaba",             free:false, edit:true,  video:false },
  { id:"nova-canvas",    label:"Amazon Nova Canvas",                     free:false, edit:true,  video:false },
  { id:"grok-imagine",   label:"Grok Imagine — xAI",                     free:false, edit:false, video:false },
  { id:"grok-imagine-pro",label:"Grok Imagine Pro — Aurora xAI",         free:false, edit:false, video:false },
  { id:"p-image",        label:"Pruna p-image — Text-to-Image",          free:false, edit:false, video:false },
  { id:"p-image-edit",   label:"Pruna p-image-edit — Image Editing",     free:false, edit:true,  video:false },
];

const VIDEO_MODELS = [
  // ✅ GRATUITS
  { id:"ltx-2",          label:"LTX-2.3 — Fast Text-to-Video + Upscaler", free:true  },
  { id:"nova-reel",      label:"Amazon Nova Reel — 6-60s 720p",           free:true  },
  // 💰 Pollen
  { id:"veo",            label:"Google Veo 3.1 Fast (Preview)",           free:false },
  { id:"seedance",       label:"Seedance Lite — BytePlus Vidéo",          free:false },
  { id:"seedance-pro",   label:"Seedance Pro-Fast — BytePlus",            free:false },
  { id:"wan",            label:"Wan 2.6 — Alibaba Text/Image-to-Video",   free:false },
  { id:"wan-fast",       label:"Wan 2.2 — Fast Cheap Video (480P)",       free:false },
  { id:"grok-video-pro", label:"Grok Video Pro — xAI (720p, 1-15s)",      free:false },
  { id:"p-video",        label:"Pruna p-video — Text/Image-to-Video",     free:false },
];

const AUDIO_MODELS = [
  // TTS — tous gratuits via endpoint direct GET
  { id:"elevenlabs",  label:"ElevenLabs v3 TTS",         type:"tts",   free:true  },
  { id:"alloy",       label:"OpenAI Alloy",               type:"tts",   free:true  },
  { id:"echo",        label:"OpenAI Echo",                type:"tts",   free:true  },
  { id:"nova",        label:"OpenAI Nova",                type:"tts",   free:true  },
  { id:"shimmer",     label:"OpenAI Shimmer",             type:"tts",   free:true  },
  // Musique
  { id:"elevenmusic", label:"ElevenLabs Music Generator", type:"music", free:true  },
  { id:"acestep",     label:"ACE-Step 1.5 Turbo Music",   type:"music", free:true  },
  // STT
  { id:"whisper",     label:"Whisper Large V3 — STT",     type:"stt",   free:true  },
  { id:"scribe",      label:"ElevenLabs Scribe v2 — STT", type:"stt",   free:true  },
];

const FREE_TEXT   = TEXT_MODELS.filter(m=>m.free).map(m=>m.id);
const FREE_IMAGE  = IMAGE_MODELS.filter(m=>m.free).map(m=>m.id);
const FREE_VISION = TEXT_MODELS.filter(m=>m.free&&m.vision).map(m=>m.id);
const FREE_SEARCH = TEXT_MODELS.filter(m=>m.free&&m.search).map(m=>m.id);
const EDIT_MODELS = IMAGE_MODELS.filter(m=>m.edit).map(m=>m.id);

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════

async function doFetch(url, opts = {}, ms = 180000) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    const { default: fetch } = await import("node-fetch");
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } finally { clearTimeout(id); }
}

async function chatCompletion(messages, model, system, opts = {}) {
  const body = {
    model,
    messages: system ? [{ role: "system", content: system }, ...messages] : messages,
    ...opts,
  };
  const r = await doFetch(`${GEN_API}/v1/chat/completions`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`Upstream ${r.status}: ${t.substring(0, 400)}`);
  }
  const data = await r.json();
  return data.choices?.[0]?.message?.content ?? "";
}

// ═══════════════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════════════

// ─── ROOT
app.get("/", (req, res) => res.json({
  status: true,
  server: "Free AI API Server v5.0 — 100% Gratuit Sans Clé",
  provider: "Pollinations.ai",
  provider_url: "https://pollinations.ai",
  api: `${GEN_API} (OpenAI-compatible)`,
  pollen_key_configured: !!POLLEN_KEY,
  endpoints: ["/api/chat", "/api/image", "/api/video", "/api/audio", "/api/music", "/api/search", "/api/openai", "/api/models"],
  free_models: { text: FREE_TEXT.length, image: FREE_IMAGE.length, vision: FREE_VISION.length, search: FREE_SEARCH.length },
}));

// ─── 1. CHAT  GET /api/chat?query=...&model=openai
app.get("/api/chat", async (req, res) => {
  const { query, model = "openai", system = "You are a helpful AI assistant." } = req.query;
  if (!query) return res.status(400).json({ status: false, error: "Missing 'query'" });
  const info = TEXT_MODELS.find(m => m.id === model);
  try {
    const text = await chatCompletion([{ role: "user", content: query }], model, system);
    return res.json({ status: true, provider: "Pollinations.ai", model, model_info: info, response: text, model_type: "chat" });
  } catch (err) {
    console.error("[CHAT]", err.message);
    return res.status(500).json({ status: false, error: err.message });
  }
});

// ─── 2. IMAGE  GET /api/image?prompt=...&model=flux[&imgurl=...]
app.get("/api/image", async (req, res) => {
  const { prompt, model = "flux", width = 1024, height = 1024, seed, enhance = "false", safe = "false", imgurl, negative_prompt, quality } = req.query;
  if (!prompt) return res.status(400).json({ status: false, error: "Missing 'prompt'" });

  try {
    let useModel = model;
    if (imgurl && !EDIT_MODELS.includes(model)) useModel = "kontext";

    const params = new URLSearchParams({ model: useModel, width: String(width), height: String(height), nologo: "true" });
    if (seed)             params.set("seed",            String(seed));
    if (enhance === "true") params.set("enhance",        "true");
    if (safe === "true")  params.set("safe",             "true");
    if (imgurl)           params.set("image",            imgurl);
    if (negative_prompt)  params.set("negative_prompt",  negative_prompt);
    if (quality)          params.set("quality",          quality);
    if (POLLEN_KEY)       params.set("key",              POLLEN_KEY);

    const url = `${IMAGE_API}/prompt/${encodeURIComponent(prompt)}?${params}`;
    console.log(`[IMG ${imgurl ? "EDIT" : "GEN"}] model=${useModel}`);

    const r = await doFetch(url, {}, 180000);
    if (!r.ok) { const t = await r.text(); throw new Error(`Image ${r.status}: ${t.substring(0, 300)}`); }

    const ct  = r.headers.get("content-type") || "image/jpeg";
    const buf = await r.buffer();
    res.set("Content-Type", ct);
    res.set("Cache-Control", "public, max-age=3600");
    res.set("X-Model-Used", useModel);
    res.set("Access-Control-Allow-Origin", "*");
    return res.send(buf);
  } catch (err) {
    console.error("[IMAGE]", err.message);
    return res.status(500).json({ status: false, error: err.message });
  }
});

// ─── 3. VIDEO  GET /api/video?prompt=...&model=ltx-2
// Utilise l'endpoint image de Pollinations avec des modèles vidéo (retourne video/mp4)
app.get("/api/video", async (req, res) => {
  const { prompt, model = "ltx-2", width = 1280, height = 720, duration = 5, seed, aspectRatio = "16:9" } = req.query;
  if (!prompt) return res.status(400).json({ status: false, error: "Missing 'prompt'" });

  try {
    const params = new URLSearchParams({ model, width: String(width), height: String(height), nologo: "true" });
    if (seed)        params.set("seed",        String(seed));
    if (duration)    params.set("duration",    String(duration));
    if (aspectRatio) params.set("aspectRatio", aspectRatio);
    if (POLLEN_KEY)  params.set("key",         POLLEN_KEY);

    const url = `${IMAGE_API}/prompt/${encodeURIComponent(prompt)}?${params}`;
    console.log(`[VIDEO] model=${model} duration=${duration}s`);

    const r = await doFetch(url, {}, 300000); // 5min timeout pour vidéo
    if (!r.ok) { const t = await r.text(); throw new Error(`Video ${r.status}: ${t.substring(0, 300)}`); }

    const ct  = r.headers.get("content-type") || "video/mp4";
    const buf = await r.buffer();
    res.set("Content-Type", ct);
    res.set("Cache-Control", "public, max-age=3600");
    res.set("X-Model-Used", model);
    res.set("Access-Control-Allow-Origin", "*");
    return res.send(buf);
  } catch (err) {
    console.error("[VIDEO]", err.message);
    return res.status(500).json({ status: false, error: err.message });
  }
});

// ─── 4. AUDIO TTS  GET /api/audio?text=...&voice=nova&model=elevenlabs
// Retourne audio/mpeg directement (prêt pour <audio src>)
app.get("/api/audio", async (req, res) => {
  const { text, voice = "nova", model = "elevenlabs", duration } = req.query;
  if (!text) return res.status(400).json({ status: false, error: "Missing 'text'" });

  try {
    const params = new URLSearchParams({ voice });
    if (model && model !== "elevenlabs") params.set("model", model);
    if (duration) params.set("duration", String(duration));
    if (POLLEN_KEY) params.set("key", POLLEN_KEY);

    const url = `${GEN_API}/audio/${encodeURIComponent(text)}?${params}`;
    console.log(`[AUDIO TTS] voice=${voice} model=${model}`);

    const r = await doFetch(url, {
      headers: POLLEN_KEY ? { "Authorization": `Bearer ${POLLEN_KEY}` } : {}
    }, 60000);
    if (!r.ok) { const t = await r.text(); throw new Error(`Audio ${r.status}: ${t.substring(0, 300)}`); }

    const ct  = r.headers.get("content-type") || "audio/mpeg";
    const buf = await r.buffer();
    res.set("Content-Type", ct);
    res.set("Cache-Control", "public, max-age=3600");
    res.set("Access-Control-Allow-Origin", "*");
    return res.send(buf);
  } catch (err) {
    console.error("[AUDIO]", err.message);
    return res.status(500).json({ status: false, error: err.message });
  }
});

// ─── 5. MUSIC  GET /api/music?prompt=...&model=elevenmusic
// Génération musicale via ElevenLabs Music ou ACE-Step
app.get("/api/music", async (req, res) => {
  const { prompt, model = "elevenmusic", duration = 30 } = req.query;
  if (!prompt) return res.status(400).json({ status: false, error: "Missing 'prompt'" });

  try {
    const params = new URLSearchParams({ model, duration: String(duration) });
    if (POLLEN_KEY) params.set("key", POLLEN_KEY);

    // elevenmusic et acestep utilisent l'endpoint audio avec model param
    const url = `${GEN_API}/audio/${encodeURIComponent(prompt)}?${params}`;
    console.log(`[MUSIC] model=${model} duration=${duration}s`);

    const r = await doFetch(url, {
      headers: POLLEN_KEY ? { "Authorization": `Bearer ${POLLEN_KEY}` } : {}
    }, 120000);
    if (!r.ok) { const t = await r.text(); throw new Error(`Music ${r.status}: ${t.substring(0, 300)}`); }

    const ct  = r.headers.get("content-type") || "audio/mpeg";
    const buf = await r.buffer();
    res.set("Content-Type", ct);
    res.set("Cache-Control", "public, max-age=3600");
    res.set("Access-Control-Allow-Origin", "*");
    return res.send(buf);
  } catch (err) {
    console.error("[MUSIC]", err.message);
    return res.status(500).json({ status: false, error: err.message });
  }
});

// ─── 6. WEB SEARCH  GET /api/search?query=...&model=perplexity-fast
app.get("/api/search", async (req, res) => {
  const { query, model = "perplexity-fast" } = req.query;
  if (!query) return res.status(400).json({ status: false, error: "Missing 'query'" });
  const useModel = FREE_SEARCH.includes(model) ? model : "perplexity-fast";
  try {
    const text = await chatCompletion(
      [{ role: "user", content: `Search the web and answer: ${query}\nInclude sources and links where possible.` }],
      useModel,
      "You are a web search assistant. Provide comprehensive, up-to-date answers with sources and links."
    );
    return res.json({ status: true, provider: "Pollinations.ai", model: useModel, query, response: text, model_type: "websearch", free_search_models: FREE_SEARCH });
  } catch (err) {
    console.error("[SEARCH]", err.message);
    return res.status(500).json({ status: false, error: err.message });
  }
});

// ─── 7. OPENAI-COMPAT UNIFIÉ  GET /api/openai?query=...&imgurl=...
app.get("/api/openai", async (req, res) => {
  const { query, uid = "anonymous", model = "openai", imgurl, system = "You are a helpful AI assistant." } = req.query;
  if (!query) return res.status(400).json({ status: false, error: "Missing 'query'" });

  try {
    let messages, useModel = model, visionMode = false;

    if (imgurl) {
      visionMode = true;
      if (!FREE_VISION.includes(model) && !TEXT_MODELS.find(m => m.id === model && m.vision)) useModel = "gemini-fast";

      let imgPart;
      try {
        const { default: fetch } = await import("node-fetch");
        const ir = await fetch(imgurl, { timeout: 30000 });
        if (ir.ok) {
          const buf  = await ir.buffer();
          const mime = ir.headers.get("content-type") || "image/jpeg";
          imgPart = { type: "image_url", image_url: { url: `data:${mime};base64,${buf.toString("base64")}` } };
        } else throw new Error("fetch failed");
      } catch (_) {
        imgPart = { type: "image_url", image_url: { url: imgurl } };
      }
      messages = [{ role: "user", content: [{ type: "text", text: query }, imgPart] }];
    } else {
      messages = [{ role: "user", content: query }];
    }

    const text = await chatCompletion(messages, useModel, system);
    return res.json({
      status: true, provider: "Pollinations.ai", maintainer: "Free AI API Server v5.0",
      uid, response: text, model_used: useModel, vision_mode: visionMode,
      model_type: visionMode ? "vision" : "chat",
      pollen_key_active: !!POLLEN_KEY,
      available_models: { text: FREE_TEXT, image: FREE_IMAGE, vision: FREE_VISION, search: FREE_SEARCH },
    });
  } catch (err) {
    console.error("[OPENAI]", err.message);
    return res.status(500).json({ status: false, error: err.message });
  }
});

// ─── 8. MODELS  GET /api/models
app.get("/api/models", (req, res) => res.json({
  status: true, provider: "Pollinations.ai", updated: "10 Avril 2026",
  api: `${GEN_API} (OpenAI-compatible)`,
  pollen_key_active: !!POLLEN_KEY,
  summary: {
    free_text: FREE_TEXT.length,
    free_image: FREE_IMAGE.length,
    free_vision: FREE_VISION.length,
    free_search: FREE_SEARCH.length,
    total_video: VIDEO_MODELS.length,
    total_audio: AUDIO_MODELS.length,
  },
  all_text_models:  TEXT_MODELS,
  all_image_models: IMAGE_MODELS,
  all_video_models: VIDEO_MODELS,
  all_audio_models: AUDIO_MODELS,
}));

// ─── STATIC & ERRORS
app.use(express.static(join(__dirname, "public")));
app.use((req, res) => res.status(404).json({
  status: false, error: "Not found",
  endpoints: ["/api/chat", "/api/image", "/api/video", "/api/audio", "/api/music", "/api/search", "/api/openai", "/api/models"]
}));
app.use((err, req, res, _next) => { console.error(err.stack); res.status(500).json({ status: false, error: "Server error" }); });

// ═══════════════════════════════════════════════════════════════════
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║   🌸 FREE AI API SERVER v5.0 — Pollinations.ai                 ║
║   Port       : ${PORT}                                            ║
║   API Gen    : ${GEN_API}            ║
╠════════════════════════════════════════════════════════════════╣
║   ✅ ${FREE_TEXT.length} modèles texte GRATUITS                               ║
║   ✅ ${FREE_IMAGE.length} modèles image GRATUITS                               ║
║   ✅ ${VIDEO_MODELS.length} modèles vidéo (ltx-2, nova-reel gratuits)           ║
║   ✅ ${AUDIO_MODELS.length} modèles audio/musique (ElevenLabs, ACE-Step...)     ║
║   ✅ Vision base64 — 100% fonctionnel                          ║
║   ${POLLEN_KEY ? "🔑 Clé Pollen configurée — TOUS modèles débloqués !" : "🆓 Mode anonyme — modèles gratuits actifs"}  ║
╚════════════════════════════════════════════════════════════════╝
  `);
});
