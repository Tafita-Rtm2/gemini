const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// ⚠️  IMPORTANT: Mets ta clé API Gemini ici ou dans une variable d'environnement sur Render
// Obtiens une clé GRATUITE sur: https://aistudio.google.com/app/apikey
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "METS_TA_CLE_ICI";

app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.static(path.join(__dirname, "public")));

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Télécharge une image depuis une URL et la convertit en base64
// ─────────────────────────────────────────────────────────────────────────────
async function fetchImageAsBase64(imageUrl) {
  const response = await fetch(imageUrl, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  if (!response.ok) throw new Error(`Impossible de télécharger l'image: ${response.status}`);
  const buffer = await response.buffer();
  const contentType = response.headers.get("content-type") || "image/jpeg";
  return { base64: buffer.toString("base64"), mimeType: contentType.split(";")[0] };
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Appelle Gemini 2.5 Flash Image (Nano Banana)
// ─────────────────────────────────────────────────────────────────────────────
async function callGemini({ prompt, imageBase64, imageMimeType }) {
  const parts = [];

  // Si une image est fournie, l'ajouter en premier
  if (imageBase64) {
    parts.push({
      inlineData: {
        mimeType: imageMimeType || "image/jpeg",
        data: imageBase64,
      },
    });
  }

  // Ajouter le prompt texte
  parts.push({ text: prompt });

  const body = {
    contents: [{ role: "user", parts }],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"],
      temperature: 1.0,
    },
  };

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${GEMINI_API_KEY}`;

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Erreur Gemini API (${response.status}): ${err}`);
  }

  const data = await response.json();
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// ENDPOINT PRINCIPAL: GET /api/img
// Usage: /api/img?url=https://example.com/photo.jpg&prompt=change le fond en plage
// ─────────────────────────────────────────────────────────────────────────────
app.get("/api/img", async (req, res) => {
  const { url: imageUrl, prompt } = req.query;

  if (!prompt) {
    return res.status(400).json({ error: "Le paramètre 'prompt' est requis." });
  }

  try {
    let imageBase64 = null;
    let imageMimeType = null;

    // Si une URL d'image est fournie, la télécharger
    if (imageUrl) {
      const imgData = await fetchImageAsBase64(imageUrl);
      imageBase64 = imgData.base64;
      imageMimeType = imgData.mimeType;
    }

    const geminiResult = await callGemini({ prompt, imageBase64, imageMimeType });

    // Extraire l'image générée de la réponse
    const candidates = geminiResult.candidates || [];
    let generatedImageBase64 = null;
    let generatedMimeType = "image/jpeg";
    let textResponse = null;

    for (const candidate of candidates) {
      for (const part of candidate.content?.parts || []) {
        if (part.inlineData?.data) {
          generatedImageBase64 = part.inlineData.data;
          generatedMimeType = part.inlineData.mimeType || "image/jpeg";
        }
        if (part.text) {
          textResponse = part.text;
        }
      }
    }

    if (!generatedImageBase64) {
      return res.status(500).json({
        error: "Gemini n'a pas retourné d'image.",
        text: textResponse,
        raw: geminiResult,
      });
    }

    // Retourner l'image brute (binary)
    const imageBuffer = Buffer.from(generatedImageBase64, "base64");
    res.set("Content-Type", generatedMimeType);
    res.set("Content-Length", imageBuffer.length);
    res.set("Access-Control-Allow-Origin", "*");
    res.send(imageBuffer);
  } catch (error) {
    console.error("Erreur /api/img:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ENDPOINT POST /api/img (pour uploader une image directement)
// Body: { prompt: string, imageBase64: string, imageMimeType: string }
// ─────────────────────────────────────────────────────────────────────────────
app.post("/api/img", async (req, res) => {
  const { prompt, imageBase64, imageMimeType, imageUrl } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Le paramètre 'prompt' est requis." });
  }

  try {
    let base64 = imageBase64;
    let mimeType = imageMimeType;

    if (imageUrl && !imageBase64) {
      const imgData = await fetchImageAsBase64(imageUrl);
      base64 = imgData.base64;
      mimeType = imgData.mimeType;
    }

    const geminiResult = await callGemini({ prompt, imageBase64: base64, imageMimeType: mimeType });

    const candidates = geminiResult.candidates || [];
    let generatedImageBase64 = null;
    let generatedMimeType = "image/jpeg";
    let textResponse = null;

    for (const candidate of candidates) {
      for (const part of candidate.content?.parts || []) {
        if (part.inlineData?.data) {
          generatedImageBase64 = part.inlineData.data;
          generatedMimeType = part.inlineData.mimeType || "image/jpeg";
        }
        if (part.text) textResponse = part.text;
      }
    }

    if (!generatedImageBase64) {
      return res.status(500).json({ error: "Pas d'image générée.", text: textResponse });
    }

    // Retourner JSON avec base64 + data URL
    res.json({
      success: true,
      imageBase64: generatedImageBase64,
      mimeType: generatedMimeType,
      dataUrl: `data:${generatedMimeType};base64,${generatedImageBase64}`,
      text: textResponse,
    });
  } catch (error) {
    console.error("Erreur POST /api/img:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    model: "gemini-2.0-flash-preview-image-generation (Nano Banana)",
    endpoints: {
      "GET /api/img": "?url=IMAGE_URL&prompt=PROMPT → retourne l'image brute",
      "POST /api/img": "{ prompt, imageBase64?, imageUrl? } → retourne JSON avec base64",
    },
  });
});

// Interface de test (index.html dans /public)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
  console.log(`📌 Endpoint: GET /api/img?url=IMAGE_URL&prompt=TON_PROMPT`);
  console.log(`📌 Interface de test: http://localhost:${PORT}/`);
});
