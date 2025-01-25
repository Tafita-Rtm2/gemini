const express = require("express");
const fetch = require("node-fetch");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const IMAGE_API_URL = "https://betadash-api-swordslush.vercel.app/flux?prompt=";

// Endpoint pour générer une image
app.post("/generate-image", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Le prompt est requis." });
  }

  try {
    const response = await fetch(`${IMAGE_API_URL}${encodeURIComponent(prompt)}`);
    const data = await response.json();

    if (data.ok && data.data.imageUrl) {
      // Télécharger l'image brute et la renvoyer
      const imageResponse = await fetch(data.data.imageUrl);
      const imageBuffer = await imageResponse.buffer();
      res.writeHead(200, { "Content-Type": "image/jpeg" });
      res.end(imageBuffer);
    } else {
      res.status(500).json({ error: "Impossible de générer l'image." });
    }
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la requête." });
  }
});

// Lancer le serveur
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
const PORT = 3000;
app.listen(PORT, () => console.log(`Serveur lancé sur http://localhost:${PORT}`));
