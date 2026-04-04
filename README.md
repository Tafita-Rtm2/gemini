# 🤖 AIVERSE - Advanced AI Chatbot

Une chatbot IA moderne et élégante avec support de **génération d'images**, **édition d'images**, **analyse d'images** et **conversation intelligente**. Interface futuriste avec backend Node.js robuste et API REST complète.

![AIVERSE Logo](https://img.shields.io/badge/AIVERSE-Advanced%20AI%20Chatbot-blue?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge)
![Express](https://img.shields.io/badge/Express-4.18-black?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

## ✨ Caractéristiques

### 💬 Chat Intelligent
- Conversation en temps réel avec l'IA
- Historique mémorisé (jusqu'à 50 messages)
- Modèle: **Mistral-7B-Instruct** (performant et léger)
- Support de prompts système personnalisés

### 🎨 Génération d'Images
- Création d'images à partir de texte
- Modèles: **Stable Diffusion 3.5** ou **FLUX.2**
- Résolutions: 256px à 1024px
- Contrôle des paramètres (étapes d'inférence, guidance scale)

### ✏️ Édition d'Images
- Modification d'images existantes
- Modèle: **Qwen-Image-Edit-2511**
- Support: Inpainting, Suppression, Style Transfer, Couleur
- Haute fidélité et précision

### 🔍 Analyse d'Images
- Classification et détection d'objets
- Vision Transformer (ViT)
- Identification de contenu
- Résultats instantanés

### 📚 Documentation Intégrée
- Docs complètes des endpoints API
- Exemples d'utilisation (cURL, Python)
- Configuration étape par étape

### 🔌 API REST Complète
- `/api/chat` - Converser avec l'IA
- `/api/generate-image` - Générer des images
- `/api/edit-image` - Éditer des images
- `/api/analyze-image` - Analyser des images
- `/api/conversation/:id` - Récupérer l'historique
- `/api/models` - Lister les modèles disponibles
- `/api/health` - Vérifier l'état du serveur

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 18+ ([Télécharger](https://nodejs.org/))
- npm ou yarn
- Token Hugging Face ([Obtenir ici](https://huggingface.co/settings/tokens))

### Installation Locale

1. **Cloner le repository**
```bash
git clone https://github.com/yourusername/aiverse-chatbot.git
cd aiverse-chatbot
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer les variables d'environnement**
```bash
cp .env.example .env
```

Éditer le fichier `.env` et ajouter votre token Hugging Face:
```env
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxx
PORT=5000
NODE_ENV=development
```

4. **Lancer le serveur en développement**
```bash
npm run dev
```

5. **Ouvrir dans le navigateur**
```
http://localhost:5000
```

## 📦 Installation des Dépendances

```bash
npm install
```

### Dépendances principales:
- **express** - Framework web
- **cors** - Gestion CORS
- **dotenv** - Variables d'environnement
- **axios** - Requêtes HTTP
- **multer** - Upload de fichiers
- **sharp** - Traitement d'images
- **node-fetch** - Fetch API

## 🔧 Configuration

### Variables d'Environnement

```env
# Hugging Face
HUGGINGFACE_API_KEY=your_token_here

# Serveur
PORT=5000
NODE_ENV=development

# Modèles par défaut
DEFAULT_LLM_MODEL=mistralai/Mistral-7B-Instruct-v0.3
DEFAULT_IMAGE_MODEL=stabilityai/stable-diffusion-3.5-large
DEFAULT_EDIT_MODEL=Qwen/Qwen-Image-Edit-2511

# Limites
MAX_IMAGE_SIZE=10485760
MAX_CONVERSATION_LENGTH=50
```

### Changer les Modèles

Dans `.env`:
```env
# Génération d'images
DEFAULT_IMAGE_MODEL=black-forest-labs/FLUX.2-dev
DEFAULT_IMAGE_MODEL=Qwen/Qwen-Image

# Édition d'images
DEFAULT_EDIT_MODEL=Qwen/Qwen-Image-Edit-2511

# Chat (LLM)
DEFAULT_LLM_MODEL=meta-llama/Llama-2-7b-chat-hf
DEFAULT_LLM_MODEL=google/flan-t5-large
```

## 📚 API Documentation

### 1. Chat Endpoint
**POST** `/api/chat`

```javascript
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Bonjour, comment vas-tu?",
    "conversationId": "conv_123"
  }'
```

**Réponse:**
```json
{
  "conversationId": "conv_123",
  "message": "Bonjour! Je vais bien, merci de demander...",
  "messageCount": 2,
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### 2. Generate Image Endpoint
**POST** `/api/generate-image`

```javascript
curl -X POST http://localhost:5000/api/generate-image \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Un coucher de soleil sur les montagnes",
    "height": 512,
    "width": 512,
    "numSteps": 20,
    "guidanceScale": 7.5
  }'
```

**Réponse:** Image PNG en binaire

### 3. Edit Image Endpoint
**POST** `/api/edit-image` (multipart/form-data)

```bash
curl -X POST http://localhost:5000/api/edit-image \
  -F "image=@input.jpg" \
  -F "prompt=Change the sky to blue" \
  -F "strength=0.75"
```

**Réponse:** Image modifiée en PNG

### 4. Analyze Image Endpoint
**POST** `/api/analyze-image` (multipart/form-data)

```bash
curl -X POST http://localhost:5000/api/analyze-image \
  -F "image=@input.jpg"
```

**Réponse:**
```json
{
  "classifications": [
    {"label": "cat", "score": 0.95},
    {"label": "animal", "score": 0.92}
  ],
  "imageSize": 123456,
  "uploadedAt": "2024-01-01T12:00:00Z"
}
```

### 5. Get Conversation History
**GET** `/api/conversation/:id`

```bash
curl http://localhost:5000/api/conversation/conv_123
```

**Réponse:**
```json
{
  "id": "conv_123",
  "messages": [
    {"role": "user", "content": "...", "timestamp": 1234567890},
    {"role": "assistant", "content": "...", "timestamp": 1234567891}
  ],
  "createdAt": 1234567890,
  "updatedAt": 1234567895
}
```

### 6. Available Models
**GET** `/api/models`

```bash
curl http://localhost:5000/api/models
```

### 7. Health Check
**GET** `/api/health`

```bash
curl http://localhost:5000/api/health
```

## 🌐 Déploiement sur Render

### Étape 1: Préparer le Repository GitHub

1. Créer un repository sur GitHub
```bash
git init
git add .
git commit -m "Initial commit: AIVERSE Chatbot"
git branch -M main
git remote add origin https://github.com/yourusername/aiverse-chatbot.git
git push -u origin main
```

2. Créer un fichier `.gitignore`:
```
node_modules/
.env
.env.local
uploads/
.DS_Store
*.log
```

### Étape 2: Déployer sur Render

1. **Créer un compte** sur [render.com](https://render.com)

2. **Connecter GitHub** à Render
   - Dashboard → New → Web Service
   - Connecter votre repository GitHub

3. **Configurer le service**
   - **Name:** `aiverse-chatbot`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free (ou Starter si vous voulez plus de ressources)

4. **Ajouter les variables d'environnement**
   - Cliquer sur "Environment" dans les paramètres
   - Ajouter:
     ```
     HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxx
     PORT=5000
     NODE_ENV=production
     ```

5. **Déployer**
   - Cliquer sur "Create Web Service"
   - Attendre ~2-3 minutes le déploiement
   - URL publique générée automatiquement

### Étape 3: Tester le déploiement

```bash
curl https://your-app.onrender.com/api/health
```

## 💻 Exemples d'Utilisation

### Python
```python
import requests

# Chat
response = requests.post(
    "https://your-app.onrender.com/api/chat",
    json={"message": "Bonjour!"}
)
print(response.json())

# Generate Image
response = requests.post(
    "https://your-app.onrender.com/api/generate-image",
    json={
        "prompt": "A beautiful sunset",
        "height": 512,
        "width": 512
    }
)
with open("image.png", "wb") as f:
    f.write(response.content)
```

### JavaScript/Node.js
```javascript
const fetch = require('node-fetch');

async function chat(message) {
  const response = await fetch('https://your-app.onrender.com/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  });
  return response.json();
}

const result = await chat("Bonjour!");
console.log(result);
```

## 🎨 Interface

### Thème
- **Dark Mode** optimisé pour une utilisation longue
- **Gradient futuriste** avec accents bleus
- **Animation fluides** et micro-interactions
- **Responsive** sur tous les appareils

### Sections
1. **💬 Conversation** - Chat avec l'IA
2. **✨ Générer Image** - Créer des images
3. **✏️ Éditer Image** - Modifier des images
4. **🔍 Analyser Image** - Classifier des images
5. **📚 Documentation** - Docs complètes
6. **🔌 API Endpoints** - Référence API

## 🔒 Sécurité

- ✅ CORS activé (configurable)
- ✅ Validation des entrées serveur-side
- ✅ Limites de taille de fichier
- ✅ Nettoyage des fichiers uploadés
- ✅ Variables d'environnement sécurisées
- ✅ Gestion d'erreurs robuste

## ⚡ Performance

- **Temps de réponse:** < 1s pour le chat
- **Génération d'image:** 30-60s (dépend du modèle)
- **Édition d'image:** 20-40s
- **Analyse d'image:** < 5s

### Optimisations
- Cache du modèle côté serveur
- Compression des réponses
- Offloading GPU (si disponible)
- Nettoyage automatique des uploads

## 📊 Modèles Disponibles

### Chat (LLM)
- **Mistral-7B-Instruct** ⭐ (défaut)
- Llama 2 13B
- Flan-T5 Large

### Génération d'Images
- **Stable Diffusion 3.5 Large** ⭐ (défaut)
- FLUX.2 dev/schnell
- Qwen-Image

### Édition d'Images
- **Qwen-Image-Edit-2511** ⭐ (défaut)
- Stable Diffusion Inpainting

### Analyse
- **Vision Transformer (ViT)** ⭐

## 🐛 Troubleshooting

### "401 Unauthorized" - Hugging Face
- Vérifier votre token HF dans `.env`
- Vérifier que le token est valide sur [hf.co/settings/tokens](https://huggingface.co/settings/tokens)

### "Model is loading"
- Les modèles HF mettent 1-5 min à charger la première fois
- Le serveur réessaye automatiquement

### Erreur "CORS"
- Vérifier que CORS est activé dans `server.js`
- Vérifier l'URL d'origine

### Image génération lente
- Normal pour les modèles haute qualité (30-60s)
- Réduire les étapes d'inférence pour plus de vitesse

## 📝 License

MIT License - Voir [LICENSE](LICENSE) pour plus de détails

## 🤝 Contribution

Les contributions sont bienvenues! 

1. Fork le repository
2. Créer une branch (`git checkout -b feature/amazing-feature`)
3. Commit vos changements (`git commit -m 'Add amazing feature'`)
4. Push la branch (`git push origin feature/amazing-feature`)
5. Ouvrir une Pull Request

## 📮 Contact & Support

- 📧 Email: support@aiverse.io
- 🐦 Twitter: [@aiverse_io](https://twitter.com/aiverse_io)
- 💬 Discord: [Rejoindre le serveur](https://discord.gg/aiverse)
- 📖 Documentation: [docs.aiverse.io](https://docs.aiverse.io)

## 🙏 Remerciements

- Hugging Face pour les modèles et l'infrastructure
- Stability AI pour Stable Diffusion
- Alibaba Qwen pour Qwen-Image
- Black Forest Labs pour FLUX
- Mistral AI pour Mistral-7B

## 🚀 Roadmap

- [ ] Support des modèles audio (Whisper)
- [ ] Génération vidéo
- [ ] Fine-tuning de modèles
- [ ] WebSocket pour streaming en temps réel
- [ ] Base de données persistent
- [ ] Authentification utilisateur
- [ ] Tableau de bord analytics
- [ ] Support multilingue avancé
- [ ] CLI pour déploiement

---

**AIVERSE** - Transforming AI Conversations 🚀

Made with ❤️ by the AIVERSE Team
