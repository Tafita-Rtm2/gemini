# 🚀 AIVERSE - Démarrage Rapide

Lancez votre chatbot IA en 5 minutes!

## ⚡ TL;DR (30 secondes)

```bash
# 1. Cloner
git clone https://github.com/YOUR_USERNAME/aiverse-chatbot.git
cd aiverse-chatbot

# 2. Installer
npm install

# 3. Configurer
cp .env.example .env
# Éditer .env et ajouter HUGGINGFACE_API_KEY

# 4. Lancer
npm run dev

# 5. Ouvrir
# http://localhost:5000
```

---

## 📦 Avant de Commencer

- ✅ Node.js 18+ ([Télécharger](https://nodejs.org/))
- ✅ Token Hugging Face ([Créer](https://huggingface.co/settings/tokens))
- ✅ Compte GitHub (pour Render)
- ✅ Compte Render (gratuit sur [render.com](https://render.com))

---

## 🏠 Installation Locale (5 min)

### 1️⃣ Télécharger le Code

**Option A - Avec Git:**
```bash
git clone https://github.com/YOUR_USERNAME/aiverse-chatbot.git
cd aiverse-chatbot
```

**Option B - Télécharger ZIP:**
1. Aller sur GitHub
2. Code → Download ZIP
3. Extraire le zip
4. `cd aiverse-chatbot`

### 2️⃣ Installer les Dépendances

```bash
npm install
```

### 3️⃣ Configurer l'API Key

```bash
cp .env.example .env
```

Éditer `.env`:
```env
HUGGINGFACE_API_KEY=hf_YOUR_TOKEN_HERE
PORT=5000
NODE_ENV=development
```

**Où obtenir votre token?**
1. Aller sur [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
2. Cliquer **New token**
3. Type: **Read**
4. Copier le token

### 4️⃣ Lancer le Serveur

```bash
npm run dev
```

Résultat attendu:
```
╔════════════════════════════════════════╗
║   🤖 AIVERSE CHATBOT SERVER STARTED    ║
╚════════════════════════════════════════╝

📍 Server: http://localhost:5000
📌 Available Endpoints:
  ✓ POST   /api/chat
  ✓ POST   /api/generate-image
  ✓ POST   /api/edit-image
  ✓ POST   /api/analyze-image
  ✓ GET    /api/health
```

### 5️⃣ Ouvrir dans le Navigateur

Allez à: **http://localhost:5000**

---

## ✨ Tester les Fonctionnalités

### 💬 Chat

1. Cliquer sur **💬 Conversation**
2. Écrire: "Bonjour!"
3. Cliquer **Envoyer**
4. ✅ Réponse de l'IA

### 🎨 Génération d'Images

1. Cliquer sur **✨ Générer Image**
2. Écrire: "Un coucher de soleil magnifique"
3. Cliquer **🚀 Générer**
4. ⏳ Attendre 30-60 secondes
5. ✅ Image affichée

### ✏️ Édition d'Images

1. Cliquer sur **✏️ Éditer Image**
2. Uploader une image
3. Écrire: "Change le ciel en bleu"
4. Cliquer **🎨 Éditer**
5. ⏳ Attendre 20-40 secondes
6. ✅ Image modifiée

### 🔍 Analyse d'Images

1. Cliquer sur **🔍 Analyser Image**
2. Uploader une image
3. Cliquer **🔍 Analyser**
4. ⏳ Attendre < 5 secondes
5. ✅ Résultats affichés

---

## 🌐 Déployer sur Render (10 min)

### 1️⃣ Préparer GitHub

```bash
# Initialiser le repo
git init
git add .
git commit -m "Initial commit: AIVERSE Chatbot"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/aiverse-chatbot.git
git push -u origin main
```

Vérifier: [github.com/YOUR_USERNAME/aiverse-chatbot](https://github.com/YOUR_USERNAME/aiverse-chatbot)

### 2️⃣ Créer un Compte Render

1. Aller sur [render.com](https://render.com)
2. Cliquer **Sign Up**
3. Connecter avec GitHub

### 3️⃣ Créer un Service Web

1. Dashboard Render → **+ New**
2. Sélectionner **Web Service**
3. Connecter le repository `aiverse-chatbot`
4. Remplir:
   - **Name:** `aiverse-chatbot`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Cliquer **Create Web Service**
6. ⏳ Attendre le déploiement (~2-3 min)

### 4️⃣ Ajouter les Variables d'Environnement

1. Aller dans **Environment** (menu gauche)
2. Cliquer **+ Add Environment Variable**
3. Ajouter:
   ```
   HUGGINGFACE_API_KEY = hf_YOUR_TOKEN
   NODE_ENV = production
   PORT = 5000
   ```
4. Render redémarre automatiquement

### 5️⃣ Tester

L'URL est affichée en haut du service. Exemple:
```
https://aiverse-chatbot.onrender.com
```

Tester l'API:
```bash
curl https://aiverse-chatbot.onrender.com/api/health
```

Résultat:
```json
{"status":"OK","timestamp":"2024-01-01T12:00:00.000Z","uptime":123.45}
```

✅ **Félicitations! Votre chatbot est en ligne!**

---

## 📚 Documentation

| Document | Contenu |
|----------|---------|
| **README.md** | Vue d'ensemble complète |
| **API_DOCUMENTATION.md** | Référence API détaillée |
| **DEPLOYMENT_GUIDE.md** | Guide déploiement Render |
| **STRUCTURE.txt** | Structure du projet |

---

## 🔧 Commandes Utiles

### Développement Local

```bash
# Lancer en mode dev (auto-reload)
npm run dev

# Lancer en mode production
npm start

# Installer une dépendance
npm install express

# Voir les logs
npm run dev 2>&1 | tee app.log
```

### Git

```bash
# Pousser les changements
git add .
git commit -m "Description du changement"
git push origin main

# Voir l'historique
git log --oneline

# Annuler le dernier commit
git reset --soft HEAD~1
```

### cURL (Tester l'API)

```bash
# Health check
curl http://localhost:5000/api/health

# Chat
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Bonjour!"}'

# Générer une image (fichier image.png)
curl -X POST http://localhost:5000/api/generate-image \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Un chat"}' \
  > image.png

# Éditer une image
curl -X POST http://localhost:5000/api/edit-image \
  -F "image=@input.jpg" \
  -F "prompt=Change le ciel en bleu" \
  > edited.png
```

---

## ❓ Problèmes Courants

### "Module not found"
```bash
# Solution
rm -rf node_modules package-lock.json
npm install
```

### "HUGGINGFACE_API_KEY not found"
```
# Vérifier .env existe
# Vérifier token valide sur hf.co/settings/tokens
# Redémarrer: npm run dev
```

### Port déjà utilisé
```bash
# Tuer le processus
pkill -f "node server.js"
# Ou changer le port dans .env
# PORT=5001
```

### Image generation très lente
```
Normal! Première génération charge le modèle (1-5 min).
Utilisez FLUX.1-schnell pour plus rapide.
```

---

## 🎓 Ressources d'Apprentissage

### Hugging Face
- [Docs Inference](https://huggingface.co/docs/api-inference)
- [Modèles](https://huggingface.co/models)
- [Spaces](https://huggingface.co/spaces)

### Node.js & Express
- [Express Guide](https://expressjs.com/en/guide/routing.html)
- [Node.js Docs](https://nodejs.org/docs)
- [MDN Web Docs](https://developer.mozilla.org/)

### Render
- [Render Docs](https://render.com/docs)
- [Troubleshooting](https://render.com/docs/deploy-node-express-app)

---

## 🎯 Prochaines Étapes

### Niveau 1 - Customisation
- [ ] Changer les couleurs dans `index.html`
- [ ] Modifier le logo
- [ ] Changer les textes par défaut

### Niveau 2 - Fonctionnalités
- [ ] Ajouter une base de données
- [ ] Authentification utilisateur
- [ ] Historique persistant

### Niveau 3 - Production
- [ ] Domaine personnalisé
- [ ] Plan payant Render
- [ ] Monitoring & Analytics

---

## 📞 Support

- 📧 **Email:** support@aiverse.io
- 💬 **Discord:** [Rejoindre](https://discord.gg/aiverse)
- 🐛 **GitHub Issues:** [Rapport de bug](https://github.com/yourusername/aiverse-chatbot/issues)
- 📖 **Docs:** [docs.aiverse.io](https://docs.aiverse.io)

---

## ✅ Checklist Final

Avant de passer en production:

- [ ] Cloner/créer le repo GitHub
- [ ] Code poussé sur GitHub
- [ ] Service Render créé
- [ ] Variables d'environnement configurées
- [ ] Health check ✓ (GET /api/health)
- [ ] Chat testé ✓
- [ ] Image generation testé ✓
- [ ] Image editing testé ✓
- [ ] Interface accessible publiquement

🎉 **Vous êtes prêt!**

---

**Dernière mise à jour:** 2024
**Version:** 1.0
