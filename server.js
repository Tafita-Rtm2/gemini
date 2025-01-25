const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Endpoint pour l'API génératrice d'images
app.post("/generate-image", async (req, res) => {
  const prompt = req.body.prompt;
  if (!prompt) {
    return res.status(400).json({ error: "Prompt manquant" });
  }

  try {
    const response = await axios.get(`https://betadash-api-swordslush.vercel.app/flux?prompt=${prompt}`);
    const imageUrl = response.data.data.imageUrl;
    res.json({ success: true, imageUrl });
  } catch (error) {
    res.status(500).json({ success: false, error: "Erreur lors de la génération de l'image" });
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Serveur lancé sur http://localhost:${PORT}`));
