# 🍌 Nano Banana API — Endpoint perso pour Gemini 2.5 Flash Image

Un serveur Node.js qui expose un endpoint REST pour générer/éditer des images avec **Gemini 2.5 Flash Image** (le même modèle qu'EaseMate/Nano Banana), **sans compte, sans token côté client**.

---

## 📋 Structure

```
nano-banana-api/
├── server.js          # Serveur Express + logique API
├── package.json       # Dépendances
├── public/
│   └── index.html     # Interface de test (accessible sur /)
└── README.md
```

---

## 🚀 Déploiement sur Render

### Étape 1 — Obtenir une clé API Gemini (GRATUIT)
1. Va sur https://aistudio.google.com/app/apikey
2. Clique "Create API Key"
3. Copie ta clé (commence par `AIza...`)

### Étape 2 — Déployer sur Render
1. Push ce projet sur GitHub
2. Va sur https://render.com → "New Web Service"
3. Connecte ton repo GitHub
4. Paramètres :
   - **Build Command** : `npm install`
   - **Start Command** : `npm start`
   - **Environment** : Node
5. Ajoute la variable d'environnement :
   - **Key** : `GEMINI_API_KEY`
   - **Value** : `AIza...ta_clé`
6. Clique Deploy !

Ton API sera dispo sur : `https://ton-service.onrender.com`

---

## 📌 Utilisation de l'API

### GET /api/img — Retourne l'image brute (binaire)

```
GET https://ton-service.onrender.com/api/img?url=https://iili.io/BAHlZTx.jpg&prompt=change le fond en plage
```

**Paramètres :**
- `url` (optionnel) — URL de l'image source à éditer
- `prompt` (requis) — Instruction en français ou anglais

**Retourne :** Image binaire (Content-Type: image/jpeg)

**Exemple dans le navigateur :**
```
https://ton-service.onrender.com/api/img?url=https://iili.io/BAHlZTx.jpg&prompt=change le fond en plage tropicale
```

**Exemple en HTML :**
```html
<img src="https://ton-service.onrender.com/api/img?url=MON_IMAGE&prompt=MON_PROMPT" />
```

---

### POST /api/img — Retourne JSON avec base64

```json
POST /api/img
Content-Type: application/json

{
  "imageUrl": "https://iili.io/BAHlZTx.jpg",
  "prompt": "change le fond en plage"
}
```

**Ou avec base64 directement :**
```json
{
  "imageBase64": "...",
  "imageMimeType": "image/jpeg",
  "prompt": "change le fond en plage"
}
```

**Réponse :**
```json
{
  "success": true,
  "imageBase64": "...",
  "mimeType": "image/jpeg",
  "dataUrl": "data:image/jpeg;base64,...",
  "text": null
}
```

---

## 🔧 Test local

```bash
npm install
GEMINI_API_KEY=AIza...ta_clé npm start
```

Puis ouvre http://localhost:3000

---

## 🌐 Intégration dans n'importe quel site

```javascript
// Édition d'image
const result = await fetch(
  `https://ton-service.onrender.com/api/img?url=${encodeURIComponent(imageUrl)}&prompt=${encodeURIComponent(prompt)}`
);
const blob = await result.blob();
document.getElementById('myImg').src = URL.createObjectURL(blob);
```

```python
# Python
import requests
r = requests.post("https://ton-service.onrender.com/api/img", json={
    "imageUrl": "https://example.com/photo.jpg",
    "prompt": "change le fond en plage"
})
data = r.json()
# data["dataUrl"] → utilisable dans <img src="...">
```
