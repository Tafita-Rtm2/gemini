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
const TEXT_API_URL = process.env.TEXT_API_URL || 'https://text.pollinations.ai/openai';
const IMAGE_API_URL = process.env.IMAGE_API_URL || 'https://image.pollinations.ai/prompt';

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

// ==================== MODELS MAPPING ====================

const TEXT_MODELS_MAP = {
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

const IMAGE_MODELS_MAP = {
  'flux':       'flux',
  'flux-schnell': 'flux',
  'turbo':      'turbo',
  'sdxl':       'turbo',
  'flux-pro':   'flux-pro',
};

// ==================== API HELPERS ====================

/**
 * Query Text API
 */
async function queryTextAPI(messages, modelId = 'openai-fast', systemPrompt = '') {
  // Use a reliable model for general chat if requested model is unknown
  const selectedModel = TEXT_MODELS_MAP[modelId] || 'openai-fast';
  
  const payload = {
    model: selectedModel,
    messages: [
      ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
      ...messages
    ],
    seed: Math.floor(Math.random() * 999999),
    stream: false
  };

  const response = await fetch(TEXT_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'AIVERSE/1.0'
    },
    body: JSON.stringify(payload),
    timeout: 60000
  });

  if (!response.ok) {
    const text = await response.text();
    // Fallback to openai-fast if specific model fails (e.g. 404 for deepseek-r1)
    if (response.status === 404 && selectedModel !== 'openai-fast') {
        return queryTextAPI(messages, 'openai-fast', systemPrompt);
    }
    throw new Error(`API error ${response.status}: ${text.slice(0, 200)}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const data = await response.json();
    return data?.choices?.[0]?.message?.content || data?.text || JSON.stringify(data);
  } else {
    return await response.text();
  }
}

/**
 * Query Image API
 */
async function queryImageAPI(prompt, options = {}) {
  const {
    width = 1024,
    height = 1024,
    seed = Math.floor(Math.random() * 1000000),
    model = 'flux'
  } = options;

  const selectedModel = IMAGE_MODELS_MAP[model] || 'flux';
  const url = `${IMAGE_API_URL}/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&model=${selectedModel}&nologo=true&enhance=false`;

  const response = await fetch(url, {
    headers: { 'User-Agent': 'AIVERSE/1.0' },
    timeout: 90000
  });

  if (!response.ok) {
    throw new Error(`Image generation failed: ${response.status}`);
  }

  return await response.arrayBuffer();
}

/**
 * Analyze image using Vision
 */
async function analyzeImageWithVision(imageUrl, question = 'Décris cette image en détail en français.') {
  const payload = {
    model: 'openai', // Use openai for vision support
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: question },
        { type: 'image_url', image_url: { url: imageUrl } }
      ]
    }],
    stream: false
  };

  const response = await fetch(TEXT_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'AIVERSE/1.0'
    },
    body: JSON.stringify(payload),
    timeout: 60000
  });

  if (!response.ok) {
    // Fallback to text-only if image_url payload fails
    return queryTextAPI([{role: 'user', content: `${question} (Image: ${imageUrl.slice(0, 100)}...)`}], 'openai-fast');
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content || data?.text || 'Analyse non disponible.';
}

// ==================== CONVERSATION STORE (Per User) ====================
// Map of UserID -> Map of ConversationID -> Conversation
const userConversations = new Map();

function getConversation(userId, conversationId) {
  if (!userConversations.has(userId)) {
    userConversations.set(userId, new Map());
  }
  const convos = userConversations.get(userId);

  if (!convos.has(conversationId)) {
    convos.set(conversationId, {
      id: conversationId,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
  }
  return convos.get(conversationId);
}

// ==================== API ENDPOINTS ====================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/models', (req, res) => {
  res.json({
    textModels: [
      { id: 'mistral',      name: 'Mistral Large',        provider: 'Mistral AI' },
      { id: 'llama',        name: 'Llama 3.3 70B',        provider: 'Meta' },
      { id: 'deepseek',     name: 'DeepSeek-V3',          provider: 'DeepSeek' },
      { id: 'deepseek-r1',  name: 'DeepSeek-R1',          provider: 'DeepSeek' },
      { id: 'gpt-4o',       name: 'GPT-4o',               provider: 'OpenAI' },
      { id: 'gemini',       name: 'Gemini 2.0 Flash',     provider: 'Google' },
      { id: 'claude',       name: 'Claude Sonnet',        provider: 'Anthropic' },
      { id: 'qwen',         name: 'Qwen-Max',             provider: 'Alibaba' },
      { id: 'search',       name: 'SearchGPT (Web)',      provider: 'OpenAI' },
      { id: 'phi',          name: 'Phi-4',                provider: 'Microsoft' },
    ],
    imageModels: [
      { id: 'flux',         name: 'Flux.1 Schnell',       provider: 'Black Forest' },
      { id: 'flux-pro',     name: 'Flux.1 Pro',           provider: 'Black Forest' },
      { id: 'turbo',        name: 'SDXL Turbo',           provider: 'Stability AI' },
    ]
  });
});

/**
 * Chat — text generation
 */
app.post('/api/chat', async (req, res) => {
  try {
    const { message, conversationId, userId = 'default_user', model = 'mistral', systemPrompt } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Le message est requis.' });
    }

    const convoId = conversationId || `conv_${Date.now()}`;
    const conversation = getConversation(userId, convoId);

    // Add user message
    conversation.messages.push({ role: 'user', content: message });

    // Keep last 20 messages
    if (conversation.messages.length > 20) {
      conversation.messages = conversation.messages.slice(-20);
    }

    const sysPrompt = systemPrompt || `Tu es AIVERSE, un assistant IA intelligent et serviable. Réponds toujours en français. Utilise le format Markdown pour tes réponses (titres, tableaux, blocs de code).`;

    const assistantMessage = await queryTextAPI(
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
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message || 'Erreur lors du traitement du chat.' });
  }
});

/**
 * Generate Image
 */
app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt, width = 1024, height = 1024, model = 'flux' } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Le prompt est requis.' });

    const buffer = await queryImageAPI(prompt, { width, height, model });
    res.set('Content-Type', 'image/jpeg');
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('Image generation error:', error);
    res.status(500).json({ error: error.message || 'Erreur de génération d\'image.' });
  }
});

/**
 * Analyze Image
 */
app.post('/api/analyze-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Image requise.' });

    const question = req.body.question || 'Décris cette image en détail en français.';
    const imageBuffer = fs.readFileSync(req.file.path);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = req.file.mimetype || 'image/jpeg';

    const description = await analyzeImageWithVision(`data:${mimeType};base64,${base64Image}`, question);

    fs.unlinkSync(req.file.path);

    res.json({
      description,
      analyzedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Image analysis error:', error);
    if (req.file) { try { fs.unlinkSync(req.file.path); } catch (e) {} }
    res.status(500).json({ error: error.message || 'Erreur d\'analyse d\'image.' });
  }
});

/**
 * Edit Image
 */
app.post('/api/edit-image', upload.single('image'), async (req, res) => {
  try {
    const { prompt, model = 'flux' } = req.body;
    if (!req.file) return res.status(400).json({ error: 'Image requise.' });
    if (!prompt) return res.status(400).json({ error: 'Prompt de modification requis.' });

    const imageBuffer = fs.readFileSync(req.file.path);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = req.file.mimetype || 'image/jpeg';

    // Describe the original image to maintain context during "edit" (regeneration)
    const originalDescription = await analyzeImageWithVision(
      `data:${mimeType};base64,${base64Image}`,
      'Describe this image very concisely in English for an image generation prompt.'
    );

    fs.unlinkSync(req.file.path);

    const combinedPrompt = `Based on this original image: "${originalDescription}", generate a new image with these modifications: ${prompt}. Maintain similar composition but apply the changes.`;
    const buffer = await queryImageAPI(combinedPrompt, { width: 1024, height: 1024, model });

    res.set('Content-Type', 'image/jpeg');
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('Image editing error:', error);
    if (req.file) { try { fs.unlinkSync(req.file.path); } catch (e) {} }
    res.status(500).json({ error: error.message || 'Erreur de modification d\'image.' });
  }
});

/**
 * Get conversation history for a user
 */
app.get('/api/conversation/:userId/:id', (req, res) => {
  const { userId, id } = req.params;
  const convos = userConversations.get(userId);
  const conversation = convos ? convos.get(id) : null;
  if (!conversation) return res.status(404).json({ error: 'Conversation introuvable.' });
  res.json(conversation);
});

/**
 * Clear conversation
 */
app.delete('/api/conversation/:userId/:id', (req, res) => {
  const { userId, id } = req.params;
  const convos = userConversations.get(userId);
  const deleted = convos ? convos.delete(id) : false;
  res.json({ deleted });
});

app.listen(PORT, () => {
  console.log(`🤖 AIVERSE running on http://localhost:${PORT}`);
});

export default app;
