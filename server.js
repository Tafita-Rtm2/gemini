import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import multer from 'multer';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
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

// Root route to serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: parseInt(process.env.MAX_IMAGE_SIZE) || 10485760 }
});

// ==================== CONSTANTS ====================
const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
const HF_API_URL = process.env.HUGGINGFACE_API_URL || 'https://api-inference.huggingface.co/models';
const TEXT_MODEL = process.env.DEFAULT_LLM_MODEL || 'mistralai/Mistral-7B-Instruct-v0.3';
const IMAGE_GEN_MODEL = process.env.DEFAULT_IMAGE_MODEL || 'stabilityai/stable-diffusion-3.5-large';
const IMAGE_EDIT_MODEL = process.env.DEFAULT_EDIT_MODEL || 'Qwen/Qwen-Image-Edit-2511';

// Store conversations in memory (use database in production)
const conversations = new Map();

// ==================== UTILITY FUNCTIONS ====================

/**
 * Query Pollinations API for Free AI
 */
async function queryPollinationsText(prompt, model = 'mistral') {
  const models = {
    'mistral': 'mistral',
    'llama-3': 'llama',
    'gpt-4o': 'openai',
    'claude-3-5': 'anthropic',
    'gemini-1.5': 'google',
    'search': 'searchgpt',
    'deepseek': 'deepseek'
  };
  
  const selectedModel = models[model] || 'mistral';
  const url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=${selectedModel}`;
  
  const response = await fetch(url);
  if (!response.ok) throw new Error('Pollinations API Error');
  return await response.text();
}

async function queryPollinationsImage(prompt, options = {}) {
  const { width = 512, height = 512, seed = Math.floor(Math.random() * 1000000), model = 'flux' } = options;
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&model=${model}&nologo=true`;
  
  const response = await fetch(url);
  if (!response.ok) throw new Error('Pollinations Image API Error');
  return await response.arrayBuffer();
}

/**
 * Query Hugging Face API
 */
async function queryHuggingFace(modelId, inputs, options = {}) {
  const maxRetries = 3;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      const response = await fetch(`${HF_API_URL}/${modelId}`, {
        headers: { Authorization: `Bearer ${HF_API_KEY}` },
        method: 'POST',
        body: JSON.stringify(inputs),
      });

      if (!response.ok) {
        const error = await response.json();
        
        // Check if model is loading
        if (error.error && error.error.includes('currently loading')) {
          console.log(`Model ${modelId} loading... retrying in 10s`);
          await new Promise(resolve => setTimeout(resolve, 10000));
          retries++;
          continue;
        }
        
        throw new Error(`HF API Error: ${error.error || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error querying ${modelId}:`, error.message);
      retries++;
      
      if (retries >= maxRetries) {
        throw error;
      }
      
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

/**
 * Get or create conversation
 */
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

/**
 * Format messages for LLM
 */
function formatMessagesForLLM(messages) {
  return messages
    .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
    .join('\n');
}

// ==================== API ENDPOINTS ====================

/**
 * Health Check
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * Chat Endpoint - Text Generation
 */
app.post('/api/chat', async (req, res) => {
  try {
    const { message, conversationId, systemPrompt } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const convoId = conversationId || `conv_${Date.now()}`;
    const conversation = getConversation(convoId);

    // Add user message
    conversation.messages.push({
      role: 'user',
      content: message,
      timestamp: Date.now()
    });

    // Limit conversation history
    const maxLen = parseInt(process.env.MAX_CONVERSATION_LENGTH) || 50;
    if (conversation.messages.length > maxLen) {
      conversation.messages = conversation.messages.slice(-maxLen);
    }

    // Prepare prompt
    const systemMsg = systemPrompt || `Tu es un assistant IA intelligent et serviable nommé AIVERSE. Tu aides les utilisateurs avec leurs questions, la rédaction de textes, la génération d'images et l'analyse visuelle. Réponds en français de manière élégante et concise.`;

    const chatHistory = formatMessagesForLLM(conversation.messages);
    const fullPrompt = `${systemMsg}\n\nConversation:\n${chatHistory}\nAssistant:`;

    // Try Pollinations first (Unlimited & Free)
    let assistantMessage = '';
    try {
      assistantMessage = await queryPollinationsText(fullPrompt, req.body.model);
    } catch (e) {
      console.log('Pollinations failed, falling back to HF');
      // Query LLM via Hugging Face if Pollinations fails
      const result = await queryHuggingFace(TEXT_MODEL, {
        inputs: fullPrompt,
        parameters: {
          max_new_tokens: 500,
          temperature: 0.7,
          top_p: 0.9,
          do_sample: true
        }
      });

      if (Array.isArray(result)) {
        assistantMessage = result[0]?.generated_text || 'No response generated';
      } else if (result.generated_text) {
        assistantMessage = result.generated_text;
      } else {
        throw new Error('Unexpected API response format');
      }

      // Extract only the new response (remove prompt from output)
      const lastUserMsg = 'Assistant:';
      const responseStart = assistantMessage.lastIndexOf(lastUserMsg);
      if (responseStart !== -1) {
        assistantMessage = assistantMessage.substring(responseStart + lastUserMsg.length).trim();
      }
    }

    // Add assistant response
    conversation.messages.push({
      role: 'assistant',
      content: assistantMessage,
      timestamp: Date.now()
    });

    conversation.updatedAt = Date.now();

    res.json({
      conversationId: convoId,
      message: assistantMessage,
      messageCount: conversation.messages.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      error: error.message || 'Failed to process chat',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * Generate Image Endpoint
 */
app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt, height = 512, width = 512, numSteps = 20, guidanceScale = 7.5 } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Use Pollinations for free unlimited image generation
    try {
      const buffer = await queryPollinationsImage(prompt, { 
        width, 
        height, 
        model: req.body.model === 'flux' ? 'flux' : 'turbo' 
      });
      res.set('Content-Type', 'image/png');
      res.send(Buffer.from(buffer));
    } catch (e) {
      console.log('Pollinations image failed, falling back to HF');
      // For Stable Diffusion via HF fallback
      const result = await queryHuggingFace(IMAGE_GEN_MODEL, {
        inputs: prompt,
        parameters: { height, width }
      });

      if (Buffer.isBuffer(result)) {
        res.set('Content-Type', 'image/png');
        res.send(result);
      } else {
        res.json(result);
      }
    }

  } catch (error) {
    console.error('Image generation error:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate image',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * Edit Image Endpoint
 */
app.post('/api/edit-image', upload.single('image'), async (req, res) => {
  try {
    const { prompt, strength = 0.75, guidanceScale = 7.5 } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    if (!prompt) {
      return res.status(400).json({ error: 'Edit prompt is required' });
    }

    // Read image file
    const imageBuffer = fs.readFileSync(req.file.path);
    const base64Image = imageBuffer.toString('base64');

    // Query editing model
    const result = await queryHuggingFace(IMAGE_EDIT_MODEL, {
      inputs: {
        image: base64Image,
        prompt: prompt
      },
      parameters: {
        strength,
        guidance_scale: guidanceScale
      }
    });

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    if (Buffer.isBuffer(result)) {
      res.set('Content-Type', 'image/png');
      res.send(result);
    } else {
      res.json(result);
    }

  } catch (error) {
    console.error('Image editing error:', error);
    
    // Clean up on error
    if (req.file) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }

    res.status(500).json({
      error: error.message || 'Failed to edit image',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * Analyze Image Endpoint
 */
app.post('/api/analyze-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    const imageBuffer = fs.readFileSync(req.file.path);
    const base64Image = imageBuffer.toString('base64');

    // Use image classification model
    const result = await queryHuggingFace('google/vit-base-patch16-224', {
      inputs: base64Image
    });

    fs.unlinkSync(req.file.path);

    res.json({
      classifications: result,
      imageSize: req.file.size,
      uploadedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Image analysis error:', error);
    
    if (req.file) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }

    res.status(500).json({
      error: error.message || 'Failed to analyze image',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * Get Conversation History
 */
app.get('/api/conversation/:id', (req, res) => {
  try {
    const conversation = conversations.get(req.params.id);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json(conversation);

  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve conversation' });
  }
});

/**
 * Clear Conversation
 */
app.delete('/api/conversation/:id', (req, res) => {
  try {
    const deleted = conversations.delete(req.params.id);

    res.json({
      deleted,
      message: deleted ? 'Conversation deleted' : 'Conversation not found'
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

/**
 * List Models (Available Models)
 */
app.get('/api/models', (req, res) => {
  res.json({
    textGeneration: {
      default: TEXT_MODEL,
      available: [
        'mistralai/Mistral-7B-Instruct-v0.3',
        'meta-llama/Llama-2-7b-chat-hf',
        'google/flan-t5-large'
      ]
    },
    imageGeneration: {
      default: IMAGE_GEN_MODEL,
      available: [
        'stabilityai/stable-diffusion-3.5-large',
        'black-forest-labs/FLUX.1-schnell',
        'Qwen/Qwen-Image'
      ]
    },
    imageEditing: {
      default: IMAGE_EDIT_MODEL,
      available: [
        'Qwen/Qwen-Image-Edit-2511',
        'stabilityai/stable-diffusion-inpainting'
      ]
    }
  });
});

/**
 * Error handling middleware
 */
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// ==================== START SERVER ====================
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   🤖 AIVERSE CHATBOT SERVER STARTED    ║
╚════════════════════════════════════════╝
  
📍 Server: http://localhost:${PORT}
🌐 API Docs: http://localhost:${PORT}/docs
💬 Chat: http://localhost:${PORT}

📌 Available Endpoints:
  ✓ POST   /api/chat              - Chat with AI
  ✓ POST   /api/generate-image    - Generate images
  ✓ POST   /api/edit-image        - Edit images
  ✓ POST   /api/analyze-image     - Analyze images
  ✓ GET    /api/conversation/:id  - Get chat history
  ✓ DELETE /api/conversation/:id  - Clear conversation
  ✓ GET    /api/models            - List available models
  ✓ GET    /api/health            - Health check

⚠️  Make sure to set HUGGINGFACE_API_KEY in .env

  `);
});

export default app;
