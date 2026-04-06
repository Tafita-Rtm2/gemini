import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import { GoogleGenAI } from "@google/genai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

// ── Clé API (variable d'environnement Render) ──────────────────────────────
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error("❌  GEMINI_API_KEY manquante dans les variables d'environnement !");
  process.exit(1);
}

// ── Client officiel Google GenAI ───────────────────────────────────────────
const ai = new GoogleGenAI({ apiKey: API_KEY });

// ── Express setup ──────────────────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json({ limit: "30mb" }));
app.use(express.static(path.join(__dirname, "public")));

// Multer — stockage en mémoire (pas sur disque)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_, file, cb) => {
    const ok = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    ok.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error("Format non supporté. Utilise JPG, PNG, WEBP ou GIF."));
  },
});

// ── Helper : télécharge une image distante → buffer ───────────────────────
async function fetchImageBuffer(url) {
  const r = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!r.ok) throw new Error(`Impossible de télécharger l'image (HTTP ${r.status})`);
  const buf = Buffer.from(await r.arrayBuffer());
  const mime = (r.headers.get("content-type") || "image/jpeg").split(";")[0].trim();
  return { buffer: buf, mimeType: mime };
}

// ── Core : appelle Gemini avec le SDK officiel ─────────────────────────────
async function generateImage({ prompt, imageBuffer, imageMimeType }) {
  // Construction du prompt selon la doc officielle
  const parts = [];

  // Texte en premier (comme dans la doc)
  parts.push({ text: prompt });

  // Image optionnelle
  if (imageBuffer) {
    parts.push({
      inlineData: {
        mimeType: imageMimeType || "image/jpeg",
        data: imageBuffer.toString("base64"),
      },
    });
  }

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-image-preview",
    contents: parts,
    // Config pour forcer la sortie image
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"],
    },
  });

  // Extraction résultat (même logique que la doc)
  let resultImageBuffer = null;
  let resultMimeType = "image/png";
  let resultText = null;

  for (const part of response.candidates[0].content.parts) {
    if (part.text) {
      resultText = part.text;
    } else if (part.inlineData) {
      resultImageBuffer = Buffer.from(part.inlineData.data, "base64");
      resultMimeType = part.inlineData.mimeType || "image/png";
    }
  }

  if (!resultImageBuffer) {
    throw new Error(
      resultText
        ? `Gemini a répondu en texte : "${resultText}"`
        : "Gemini n'a retourné aucune image."
    );
  }

  return { buffer: resultImageBuffer, mimeType: resultMimeType, text: resultText };
}

// ── Helper : envoie l'image brute en réponse HTTP ─────────────────────────
function sendImage(res, buffer, mimeType) {
  res.set({
    "Content-Type": mimeType,
    "Content-Length": buffer.length,
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-cache",
  });
  res.send(buffer);
}

// ═══════════════════════════════════════════════════════════════════════════
// ENDPOINT 1 — GET /api/img
// Params : ?prompt=...  &  ?url=IMAGE_URL (optionnel)
// Retourne : image brute (binary) — utilisable dans <img src="...">
// ═══════════════════════════════════════════════════════════════════════════
app.get("/api/img", async (req, res) => {
  const { prompt, url: imageUrl } = req.query;
  if (!prompt) return res.status(400).json({ error: "Paramètre 'prompt' requis." });

  try {
    let imageBuffer = null;
    let imageMimeType = null;

    if (imageUrl) {
      const fetched = await fetchImageBuffer(imageUrl);
      imageBuffer = fetched.buffer;
      imageMimeType = fetched.mimeType;
    }

    const result = await generateImage({ prompt, imageBuffer, imageMimeType });
    sendImage(res, result.buffer, result.mimeType);
  } catch (e) {
    console.error("[GET /api/img]", e.message);
    res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// ENDPOINT 2 — POST /api/img  (JSON)
// Body : { prompt, imageUrl?, imageBase64?, imageMimeType? }
// Retourne : JSON { success, dataUrl, imageBase64, mimeType, text }
// ═══════════════════════════════════════════════════════════════════════════
app.post("/api/img", async (req, res) => {
  const { prompt, imageUrl, imageBase64, imageMimeType } = req.body;
  if (!prompt) return res.status(400).json({ error: "Paramètre 'prompt' requis." });

  try {
    let imageBuffer = null;
    let mimeType = imageMimeType || null;

    if (imageBase64) {
      imageBuffer = Buffer.from(imageBase64, "base64");
    } else if (imageUrl) {
      const fetched = await fetchImageBuffer(imageUrl);
      imageBuffer = fetched.buffer;
      mimeType = fetched.mimeType;
    }

    const result = await generateImage({ prompt, imageBuffer, imageMimeType: mimeType });

    res.json({
      success: true,
      imageBase64: result.buffer.toString("base64"),
      mimeType: result.mimeType,
      dataUrl: `data:${result.mimeType};base64,${result.buffer.toString("base64")}`,
      text: result.text,
    });
  } catch (e) {
    console.error("[POST /api/img]", e.message);
    res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// ENDPOINT 3 — POST /api/img/upload  (multipart/form-data)
// Fields : file (image), prompt (string)
// Retourne : image brute (binary)
// ═══════════════════════════════════════════════════════════════════════════
app.post("/api/img/upload", upload.single("file"), async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Champ 'prompt' requis." });
  if (!req.file) return res.status(400).json({ error: "Champ 'file' requis (image)." });

  try {
    const result = await generateImage({
      prompt,
      imageBuffer: req.file.buffer,
      imageMimeType: req.file.mimetype,
    });
    sendImage(res, result.buffer, result.mimeType);
  } catch (e) {
    console.error("[POST /api/img/upload]", e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── Health check ───────────────────────────────────────────────────────────
app.get("/health", (_, res) =>
  res.json({
    status: "ok",
    model: "gemini-3.1-flash-image-preview",
    sdk: "@google/genai",
    key_configured: !!API_KEY,
    endpoints: {
      "GET  /api/img": "?prompt=PROMPT&url=IMG_URL → image brute",
      "POST /api/img": "{ prompt, imageUrl?, imageBase64? } → JSON",
      "POST /api/img/upload": "multipart: file + prompt → image brute",
    },
  })
);

app.get("/", (_, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

// Gestion erreurs multer
app.use((err, req, res, next) => {
  if (err.code === "LIMIT_FILE_SIZE")
    return res.status(400).json({ error: "Fichier trop grand (max 10 MB)" });
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`✅  Serveur: http://localhost:${PORT}`);
  console.log(`🤖  Modèle : gemini-3.1-flash-image-preview`);
  console.log(`🔑  Clé   : ${API_KEY ? "configurée ✅" : "MANQUANTE ❌"}`);
});
