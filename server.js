import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ==================== SESSION / USER ID ====================
// Each visitor gets a unique persistent user ID (stored in cookie)
// This isolates conversations per user

app.get('/api/session', (req, res) => {
  const userId = req.headers['x-user-id'] || crypto.randomUUID();
  res.json({ userId, timestamp: new Date().toISOString() });
});

// ==================== HEALTH ====================
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

// ==================== ROUTES ====================
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/docs', (req, res) => res.sendFile(path.join(__dirname, 'public', 'docs.html')));

// ==================== API DOCS ENDPOINT ====================
app.get('/api/docs', (req, res) => {
  const base = req.protocol + '://' + req.get('host');
  res.json({
    name: 'AIVERSE API',
    version: '3.0',
    base_url: base,
    note: 'Toutes les fonctionnalités IA sont exécutées côté client via des fournisseurs gratuits.',
    endpoints: [
      { method: 'GET',  path: '/api/health',   description: 'Statut du serveur' },
      { method: 'GET',  path: '/api/session',  description: 'Obtenir un ID utilisateur unique' },
      { method: 'GET',  path: '/api/docs',     description: 'Cette documentation' },
    ],
    ai_providers: {
      text: 'text.pollinations.ai (OpenAI-compatible, gratuit, sans clé)',
      image: 'image.pollinations.ai (Flux/SDXL, gratuit, sans clé)',
      vision: 'text.pollinations.ai avec gpt-4o (vision multimodale)',
    },
    usage_example: {
      chat: `POST https://text.pollinations.ai/openai\n{"model":"openai","messages":[{"role":"user","content":"Bonjour"}]}`,
      image: `GET https://image.pollinations.ai/prompt/un%20coucher%20de%20soleil?model=flux&width=1024&height=1024`,
    }
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`\n╔══════════════════════════════════╗\n║   🤖 AIVERSE v3 — Port ${PORT}     ║\n╚══════════════════════════════════╝\n`);
});

export default app;
