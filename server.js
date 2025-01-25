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
        
        // Vérification de la réponse de l'API
        if (!response.ok) {
            return res.status(500).json({ success: false, error: 'Erreur lors de l\'appel de l\'API.' });
        }

        const data = await response.json();

        // Vérification si l'API retourne bien l'URL de l'image
        if (data.ok && data.data && data.data.imageUrl) {
            return res.json({ success: true, imageUrl: data.data.imageUrl });
        } else {
            return res.status(500).json({ success: false, error: 'Réponse invalide de l\'API.' });
        }
    } catch (error) {
        console.error('Erreur API :', error);
        res.status(500).json({ success: false, error: 'Erreur serveur.' });
    }
});

app.listen(port, () => {
    console.log(`Serveur démarré sur http://localhost:${port}`);
});
