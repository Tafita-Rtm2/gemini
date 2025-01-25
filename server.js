const express = require('express');
const fetch = require('node-fetch');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('public'));

app.post('/generate-image', async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) {
        return res.status(400).json({ success: false, error: 'Aucun prompt fourni.' });
    }

    try {
        const apiUrl = `https://betadash-api-swordslush.vercel.app/flux?prompt=${encodeURIComponent(prompt)}`;
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.ok) {
            res.json({ success: true, imageUrl: data.data.imageUrl });
        } else {
            res.json({ success: false, error: 'Erreur lors de la génération de l\'image.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Erreur serveur.' });
    }
});

app.listen(port, () => {
    console.log(`Serveur démarré sur http://localhost:${port}`);
});
