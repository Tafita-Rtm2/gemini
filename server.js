const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Middleware pour servir les fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Endpoint pour générer une image
app.post('/generate-image', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ success: false, message: "Le prompt est requis." });
  }

  try {
    const response = await axios.get(`https://betadash-api-swordslush.vercel.app/flux?prompt=${encodeURIComponent(prompt)}`);
    const imageUrl = response.data.data.imageUrl;
    return res.json({ success: true, imageUrl });
  } catch (error) {
    console.error('Erreur lors de la génération de l\'image:', error.message);
    return res.status(500).json({ success: false, message: "Erreur lors de la génération de l'image." });
  }
});

// Lancer le serveur
app.listen(port, () => {
  console.log(`Serveur démarré sur le port ${port}`);
});
