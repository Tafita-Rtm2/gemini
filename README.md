# 🤖 Free AI API Server

> **Chat · Image Generation · Image Editing · Web Search**  
> 100% Gratuit — Aucune clé API requise — Hébergeable sur Render

[![Powered by Pollinations.ai](https://img.shields.io/badge/Powered%20by-Pollinations.ai-purple)](https://pollinations.ai)
[![No API Key](https://img.shields.io/badge/API%20Key-Not%20Required-green)](https://pollinations.ai)
[![Deploy to Render](https://img.shields.io/badge/Deploy-Render-blue)](https://render.com)

---

## ✨ Fonctionnalités

| Endpoint | Fonctionnalité | Modèles disponibles |
|----------|---------------|---------------------|
| `/api/chat` | Chat IA (texte) | GPT-4.1, Claude, Gemini, DeepSeek, Mistral... |
| `/api/image` | Génération d'image | Flux, Nano Banana (Gemini), GPT Image, Seedream... |
| `/api/image?imgurl=...` | **Édition d'image** | Kontext, Nano Banana, Seedream |
| `/api/search` | Recherche web temps réel | SearchGPT, Gemini |
| `/api/openai` | Endpoint unifié (style reixz) | Tous modèles + vision |
| `/api/models` | Liste des modèles | — |
| `/test` | Interface de test UI | — |

---

## 🚀 Démarrage rapide

### Installation locale

```bash
git clone <votre-repo>
cd ai-api-server
npm install
npm start
```

Ouvrez `http://localhost:3000/test` pour l'interface de test.

---

## 📡 Endpoints

### 1. 💬 Chat — `/api/chat`

```
GET /api/chat?query=Hello&model=openai
```

**Paramètres :**
| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `query` | string | ✅ | Votre message |
| `model` | string | ❌ | Modèle (défaut: `openai`) |
| `system` | string | ❌ | System prompt |

**Exemple de réponse :**
```json
{
  "status": true,
  "model": "openai",
  "response": "Bonjour ! Je suis GPT-4.1...",
  "model_type": "chat",
  "available_models": { "chat": ["openai", "claude", "gemini", ...] }
}
```

---

### 2. 🎨 Génération d'Image — `/api/image`

> ⚡ **Retourne l'image DIRECTEMENT en binaire** (image/jpeg) — utilisable dans `<img src="/api/image?...">`

```
GET /api/image?prompt=A+beautiful+cat&model=flux
```

**Paramètres :**
| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `prompt` | string | ✅ | Description de l'image |
| `model` | string | ❌ | Modèle (défaut: `flux`) |
| `width` | integer | ❌ | Largeur (défaut: 1024) |
| `height` | integer | ❌ | Hauteur (défaut: 1024) |
| `seed` | integer | ❌ | Seed pour résultats reproductibles |
| `enhance` | boolean | ❌ | L'IA améliore le prompt |
| `imgurl` | string | ❌ | URL image source (mode édition) |

**Exemples :**
```bash
# Générer une image
curl "http://localhost:3000/api/image?prompt=A+cat&model=flux" -o image.jpg

# Utiliser Nano Banana (Gemini)
curl "http://localhost:3000/api/image?prompt=A+dragon&model=nanobanana" -o dragon.jpg

# Utiliser GPT Image
curl "http://localhost:3000/api/image?prompt=A+sunset&model=gptimage" -o sunset.jpg
```

**Dans HTML :**
```html
<img src="https://votre-server.onrender.com/api/image?prompt=A+beautiful+cat&model=flux">
```

---

### 3. ✏️ Édition d'Image — `/api/image?imgurl=...`

> Modifiez une image existante avec un prompt. Retourne l'image éditée en binaire.

```
GET /api/image?prompt=Add+a+hat&model=kontext&imgurl=https://example.com/photo.jpg
```

**Meilleurs modèles pour l'édition :**
- `kontext` — Flux Kontext, meilleur pour l'édition précise ⭐
- `nanobanana` — Gemini 2.5 Flash Image 🍌
- `nanobanana-pro` — Gemini 3 Pro Image 🍌⭐
- `seedream` — Bon pour style transfer

**Exemple :**
```bash
curl "http://localhost:3000/api/image?prompt=Make+it+anime+style&model=kontext&imgurl=https://example.com/photo.jpg" -o edited.jpg
```

---

### 4. 🔍 Web Search — `/api/search`

```
GET /api/search?query=Latest+AI+news&model=searchgpt
```

**Paramètres :**
| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `query` | string | ✅ | Votre requête de recherche |
| `model` | string | ❌ | Modèle: `searchgpt`, `gemini`, `openai` |

**Exemple de réponse :**
```json
{
  "status": true,
  "model": "searchgpt",
  "query": "Latest AI news",
  "response": "Voici les dernières nouvelles en IA...",
  "model_type": "websearch"
}
```

---

### 5. ⚡ Endpoint Unifié — `/api/openai`

Format compatible avec le style reixz (votre exemple de référence) :

```
GET /api/openai?query=Hello&uid=3&model=openai&imgurl=(optionnel)
```

**Si `imgurl` fourni → Mode Vision** (analyse d'image)  
**Sinon → Chat standard**

**Exemple de réponse :**
```json
{
  "status": true,
  "maintainer": "Free AI API Server",
  "uid": "3",
  "response": "Hello! How can I assist you today?",
  "model_used": "openai",
  "vision_mode": false,
  "model_type": "chat",
  "available_models": {
    "chat": ["openai", "claude", "gemini", ...],
    "image": ["flux", "nanobanana", "gptimage", ...],
    "websearch": ["searchgpt", "gemini", "openai"]
  }
}
```

---

### 6. 📋 Liste des Modèles — `/api/models`

```
GET /api/models
```

---

## 🧩 Modèles disponibles

### 💬 Chat / LLM
| Modèle | Description |
|--------|-------------|
| `openai` | GPT-4.1 ⭐ |
| `openai-fast` | GPT-4.1-mini (rapide) |
| `openai-reasoning` | o4-mini (raisonnement) |
| `claude` | Claude Sonnet |
| `gemini` | Gemini 2.0 Flash |
| `gemini-thinking` | Gemini avec Thinking |
| `deepseek` | DeepSeek V3 |
| `deepseek-reasoning` | DeepSeek R1 |
| `mistral` | Mistral |
| `llama` | Llama |
| `searchgpt` | SearchGPT (web search intégré) |
| `unity` | Unity (uncensored) |

### 🎨 Image
| Modèle | Description |
|--------|-------------|
| `flux` | Flux Schnell (rapide, gratuit) ⭐ |
| `flux-realism` | Flux Realism |
| `flux-pro` | Flux Pro |
| `gptimage` | GPT Image (OpenAI) |
| `nanobanana` | Nano Banana = Gemini 2.5 Flash Image 🍌 |
| `nanobanana-pro` | Nano Banana Pro = Gemini 3 Pro Image 🍌⭐ |
| `seedream` | Seedream |
| `kontext` | Flux Kontext (image-to-image editing) |
| `turbo` | SDXL Turbo |

---

## 🌐 Déploiement sur Render

### Étapes :

1. **Poussez votre code sur GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/VOTRE_USER/ai-api-server.git
   git push -u origin main
   ```

2. **Créez un service sur [Render.com](https://render.com)**
   - Cliquez "New +" → "Web Service"
   - Connectez votre repo GitHub
   - Configurez :

   | Champ | Valeur |
   |-------|--------|
   | **Runtime** | Node |
   | **Build Command** | `npm install` |
   | **Start Command** | `npm start` |
   | **Instance Type** | Free |

3. **Variables d'environnement** (optionnel)
   - `PORT` → `3000` (Render le gère automatiquement)

4. **Cliquez "Create Web Service"** — votre API sera disponible sur `https://votre-service.onrender.com`

### 🔗 Vos endpoints seront :
```
https://votre-service.onrender.com/api/chat?query=Hello
https://votre-service.onrender.com/api/image?prompt=A+cat
https://votre-service.onrender.com/api/search?query=Latest+news
https://votre-service.onrender.com/api/openai?query=Hello&uid=1
https://votre-service.onrender.com/test  ← Interface de test
```

> ⚠️ **Note Render Free Tier** : Le service entre en veille après 15 minutes d'inactivité. La première requête peut prendre ~30s pour "réveiller" le serveur.

---

## 🔧 Structure du projet

```
ai-api-server/
├── server.js          # Serveur Express principal
├── package.json       # Dépendances
├── public/
│   └── index.html     # Interface de test interactive
└── README.md          # Ce fichier
```

---

## 💡 Exemples d'utilisation

### JavaScript / Fetch
```javascript
// Chat
const res = await fetch('https://votre-server.onrender.com/api/chat?query=Hello&model=openai');
const data = await res.json();
console.log(data.response);

// Image (afficher dans <img>)
const imgUrl = 'https://votre-server.onrender.com/api/image?prompt=A+beautiful+cat&model=flux';
document.getElementById('myImg').src = imgUrl;

// Web Search
const search = await fetch('https://votre-server.onrender.com/api/search?query=Latest+AI+news');
const searchData = await search.json();
console.log(searchData.response);
```

### Python
```python
import requests

# Chat
r = requests.get('http://localhost:3000/api/chat', params={'query': 'Hello', 'model': 'openai'})
print(r.json()['response'])

# Télécharger une image générée
img = requests.get('http://localhost:3000/api/image', params={'prompt': 'A cat', 'model': 'flux'})
with open('image.jpg', 'wb') as f:
    f.write(img.content)

# Éditer une image
edited = requests.get('http://localhost:3000/api/image', params={
    'prompt': 'Make it anime style',
    'model': 'kontext',
    'imgurl': 'https://example.com/photo.jpg'
})
with open('edited.jpg', 'wb') as f:
    f.write(edited.content)
```

### cURL
```bash
# Chat
curl "http://localhost:3000/api/chat?query=Bonjour&model=openai"

# Générer image
curl "http://localhost:3000/api/image?prompt=A+dragon&model=nanobanana" -o dragon.jpg

# Éditer image
curl "http://localhost:3000/api/image?prompt=Add+hat&model=kontext&imgurl=https://example.com/photo.jpg" -o edited.jpg

# Web search
curl "http://localhost:3000/api/search?query=Latest+AI+news"
```

---

## 📜 Licence

MIT — Libre d'utilisation, modification et distribution.

---

## 🙏 Crédits

- **[Pollinations.ai](https://pollinations.ai)** — Backend AI gratuit et open-source
- Modèles : OpenAI, Anthropic, Google, Mistral, Meta, DeepSeek
