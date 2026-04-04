# 🚀 Déploiement AIVERSE sur cPanel

Ce guide vous explique comment héberger la **vitrine (Frontend)** de votre chatbot sur votre hébergement cPanel (ex: LWS, Hostinger, PlanetHoster) tout en utilisant le serveur **Render** pour l'intelligence artificielle.

## 📁 Fichiers à envoyer sur cPanel

Vous ne devez envoyer que les fichiers de l'interface. Connectez-vous à votre gestionnaire de fichiers cPanel et allez dans le dossier `public_html` (ou votre sous-domaine).

Uploadez les fichiers suivants :

1.  `index.html` (Renommez le fichier `public/index.html` en `index.html` à la racine de votre site cPanel)
2.  `docs.html` (Du dossier `public/docs.html`)
3.  `.htaccess` (Créez ce fichier s'il n'existe pas, voir ci-dessous)

## ⚙️ Configuration du fichier .htaccess

Pour que votre site fonctionne bien, créez un fichier nommé `.htaccess` dans le même dossier que votre `index.html` et collez ceci :

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [L]
```

## 🔗 Connexion au Serveur Render

Votre interface est déjà configurée pour communiquer avec votre serveur Render à l'adresse :
`https://fitadiavambola-tena-izy-amzay-1-gylo.onrender.com/api`

**Note Importante :**
- Ne mettez jamais votre clé API Hugging Face sur cPanel. Elle doit rester uniquement dans les variables d'environnement sur **Render**.
- Si vous changez d'adresse de serveur Render, vous devez éditer la ligne `const API = ...` dans votre fichier `index.html` sur cPanel.

## ✅ Vérification

Une fois les fichiers uploadés :
1. Ouvrez votre domaine (ex: `https://votre-site.com`).
2. Si vous voyez l'interface mais que le chat ne répond pas, vérifiez que votre serveur Render est bien actif (Statut "Live").
3. Si vous avez une erreur de type "Mixed Content", assurez-vous que votre site cPanel utilise bien **HTTPS**.

---
**AIVERSE** — Solution IA Multimodale 100% Gratuite
