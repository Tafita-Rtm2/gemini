import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import multer from 'multer';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// ==================== MIDDLEWARE ====================
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/docs', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'docs.html'));
});

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }
});

// ==================== POLLINATIONS API (100% Free, No Key) ====================

/**
 * Maps frontend model IDs to Pollinations model names
 * All models are free, no API key required
 */
const POLLINATIONS_TEXT_MODELS = {
  'mistral':    'mistral',
  'llama':      'llama',
  'llama-3':    'llama',
  'deepseek':   'deepseek',
  'deepseek-r1':'deepseek-r1',
  'gpt-4o':     'openai',
  'gpt4o':      'openai',
  'gemini':     'gemini',
  'gemini-1.5': 'gemini',
  'claude':     'claude',
  'claude-3-5': 'claude',
  'qwen':       'qwen',
  'search':     'searchgpt',
  'phi':        'phi',
};

const POLLINATIONS_IMAGE_MODELS = {
  'flux':       'flux',
  'flux-schnell': 'flux',
  'turbo':      'turbo',
  'sdxl':       'turbo',
  'flux-pro':   'flux-pro',
};

/**
 * Query Pollinations Text API — totally free, no key
 */
async function queryPollinationsText(messages, modelId = 'mistral', systemPrompt = '') {
  const pollinationsModel = POLLINATIONS_TEXT_MODELS[modelId] || 'mistral';
  
  const payload = {
    model: pollinationsModel,
    messages: [
      ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
      ...messages
    ],
    seed: Math.floor(Math.random() * 999999),
    stream: false
  };

  const response = await fetch('https://text.pollinations.ai/openai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    timeout: 60000
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Pollinations API error ${response.status}: ${text.slice(0, 200)}`);
  }

  // Pollinations returns plain text or JSON depending on endpoint
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const data = await response.json();
    return data?.choices?.[0]?.message?.content || data?.text || JSON.stringify(data);
  } else {
    return await response.text();
  }
}

/**
 * Query Pollinations Image API — totally free, no key
 */
async function queryPollinationsImage(prompt, options = {}) {
  const {
    width = 1024,
    height = 1024,
    seed = Math.floor(Math.random() * 1000000),
    model = 'flux'
  } = options;

  const pollinationsModel = POLLINATIONS_IMAGE_MODELS[model] || 'flux';
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&model=${pollinationsModel}&nologo=true&enhance=false`;

  const response = await fetch(url, { timeout: 90000 });

  if (!response.ok) {
    throw new Error(`Image generation failed: ${response.status}`);
  }

  return await response.arrayBuffer();
}

/**
 * Analyze image using Pollinations Vision (LLaVA via openai compatible endpoint)
 */
async function analyzeImageWithPollinations(base64Image, mimeType = 'image/jpeg', question = 'Describe this image in detail in French.') {
  const payload = {
    model: 'openai',
    messages: [{
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } },
        { type: 'text', text: question }
      ]
    }],
    stream: false
  };

  const response = await fetch('https://text.pollinations.ai/openai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    timeout: 60000
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Vision API error: ${text.slice(0, 200)}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const data = await response.json();
    return data?.choices?.[0]?.message?.content || data?.text || 'Analyse non disponible.';
  }
  return await response.text();
}

// ==================== CONVERSATION STORE ====================
const conversations = new Map();

function getConversation(conversationId) {
  if (!conversations.has(conversationId)) {
    conversations.set(conversationId, {
      id: conversationId,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
  }
  return conversations.get(conversationId);
}

// ==================== API ENDPOINTS ====================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    freeMode: true,
    apiKeyRequired: false,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/api/models', (req, res) => {
  res.json({
    note: 'All models are 100% free via Pollinations.ai — no API key required',
    textModels: [
      { id: 'mistral',      name: 'Mistral Large',        provider: 'Mistral AI',  free: true },
      { id: 'llama',        name: 'Llama 3.3 70B',        provider: 'Meta',        free: true },
      { id: 'deepseek',     name: 'DeepSeek-V3',          provider: 'DeepSeek',    free: true },
      { id: 'deepseek-r1',  name: 'DeepSeek-R1 (raisonnement)', provider: 'DeepSeek', free: true },
      { id: 'gpt-4o',       name: 'GPT-4o',               provider: 'OpenAI',      free: true },
      { id: 'gemini',       name: 'Gemini 2.0 Flash',     provider: 'Google',      free: true },
      { id: 'claude',       name: 'Claude Sonnet',        provider: 'Anthropic',   free: true },
      { id: 'qwen',         name: 'Qwen-Max',             provider: 'Alibaba',     free: true },
      { id: 'search',       name: 'SearchGPT (Web)',      provider: 'OpenAI',      free: true },
      { id: 'phi',          name: 'Phi-4',                provider: 'Microsoft',   free: true },
    ],
    imageModels: [
      { id: 'flux',         name: 'Flux.1 Schnell',       provider: 'Black Forest Labs', free: true },
      { id: 'flux-pro',     name: 'Flux.1 Pro',           provider: 'Black Forest Labs', free: true },
      { id: 'turbo',        name: 'SDXL Turbo',           provider: 'Stability AI',      free: true },
    ]
  });
});

/**
 * Chat — text generation, 100% free
 */
app.post('/api/chat', async (req, res) => {
  try {
    const { message, conversationId, model = 'mistral', systemPrompt } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Le message est requis.' });
    }

    const convoId = conversationId || `conv_${Date.now()}`;
    const conversation = getConversation(convoId);

    // Add user message
    conversation.messages.push({ role: 'user', content: message });

    // Keep last 20 messages
    if (conversation.messages.length > 20) {
      conversation.messages = conversation.messages.slice(-20);
    }

    const sysPrompt = systemPrompt || `Tu es AIVERSE, un assistant IA intelligent, créatif et serviable. Tu peux discuter, analyser, rédiger, et aider avec des images. Réponds toujours en français de manière claire et utile.`;

    const assistantMessage = await queryPollinationsText(
      conversation.messages,
      model,
      sysPrompt
    );

    // Add assistant response
    conversation.messages.push({ role: 'assistant', content: assistantMessage });
    conversation.updatedAt = Date.now();

    res.json({
      conversationId: convoId,
      message: assistantMessage,
      model: model,
      messageCount: conversation.messages.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      error: error.message || 'Erreur lors du traitement du chat.'
    });
  }
});

/**
 * Generate Image — free via Pollinations
 */
app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt, width = 1024, height = 1024, model = 'flux' } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Le prompt est requis.' });
    }

    const buffer = await queryPollinationsImage(prompt, { width, height, model });

    res.set('Content-Type', 'image/jpeg');
    res.send(Buffer.from(buffer));

  } catch (error) {
    console.error('Image generation error:', error);
    res.status(500).json({ error: error.message || 'Erreur de génération d\'image.' });
  }
});

/**
 * Analyze Image — free via Pollinations Vision
 */
app.post('/api/analyze-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Image requise.' });
    }

    const question = req.body.question || 'Décris cette image en détail en français.';
    const imageBuffer = fs.readFileSync(req.file.path);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = req.file.mimetype || 'image/jpeg';

    const description = await analyzeImageWithPollinations(base64Image, mimeType, question);

    fs.unlinkSync(req.file.path);

    res.json({
      description,
      imageSize: req.file.size,
      analyzedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Image analysis error:', error);
    if (req.file) { try { fs.unlinkSync(req.file.path); } catch (e) {} }
    res.status(500).json({ error: error.message || 'Erreur d\'analyse d\'image.' });
  }
});

/**
 * Edit Image — regenerate with modified prompt (Pollinations doesn't support true inpainting)
 */
app.post('/api/edit-image', upload.single('image'), async (req, res) => {
  try {
    const { prompt, model = 'flux' } = req.body;

    if (!req.file) return res.status(400).json({ error: 'Image requise.' });
    if (!prompt) return res.status(400).json({ error: 'Prompt de modification requis.' });

    // First: analyze the image, then regenerate with the edit prompt
    const imageBuffer = fs.readFileSync(req.file.path);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = req.file.mimetype || 'image/jpeg';

    fs.unlinkSync(req.file.path);

    // Describe the original image
    const originalDescription = await analyzeImageWithPollinations(
      base64Image,
      mimeType,
      'Describe this image very concisely in English in 2-3 sentences for an image generation prompt.'
    );

    // Generate new image combining original description + edit instructions
    const combinedPrompt = `${originalDescription}. Modification: ${prompt}`;
    const buffer = await queryPollinationsImage(combinedPrompt, { width: 1024, height: 1024, model });

    res.set('Content-Type', 'image/jpeg');
    res.send(Buffer.from(buffer));

  } catch (error) {
    console.error('Image editing error:', error);
    if (req.file) { try { fs.unlinkSync(req.file.path); } catch (e) {} }
    res.status(500).json({ error: error.message || 'Erreur de modification d\'image.' });
  }
});

/**
 * Get conversation history
 */
app.get('/api/conversation/:id', (req, res) => {
  const conversation = conversations.get(req.params.id);
  if (!conversation) return res.status(404).json({ error: 'Conversation introuvable.' });
  res.json(conversation);
});

/**
 * Clear conversation
 */
app.delete('/api/conversation/:id', (req, res) => {
  const deleted = conversations.delete(req.params.id);
  res.json({ deleted, message: deleted ? 'Conversation supprimée.' : 'Introuvable.' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Erreur interne du serveur.', message: err.message });
});

// ==================== START ====================
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════╗
║   🤖 AIVERSE — Démarré sans clé API !       ║
║   ✅ 100% Gratuit via Pollinations.ai        ║
╚══════════════════════════════════════════════╝

📍 Serveur   : http://localhost:${PORT}
📄 Docs      : http://localhost:${PORT}/docs
💬 Chat      : http://localhost:${PORT}

📌 Endpoints disponibles:
  ✓ POST   /api/chat              — Chat IA (texte)
  ✓ POST   /api/generate-image    — Génération d'image
  ✓ POST   /api/edit-image        — Édition d'image
  ✓ POST   /api/analyze-image     — Analyse visuelle
  ✓ GET    /api/models            — Liste des modèles
  ✓ GET    /api/health            — Santé du serveur
  ✓ GET    /api/conversation/:id  — Historique
  ✓ DELETE /api/conversation/:id  — Supprimer conv.

⚡ Aucune clé API requise !
  `);
});

export default app;
