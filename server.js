const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Remplace par tes vraies URLs sécurisées
const API_SEARCH = 'https://kaiz-apis.gleeze.com/api/ytsearch'; // Reste inchangé pour la recherche YouTube
const API_DOWNLOAD = 'https://haji-mix-api.gleeze.com/api/ytdl'; // Reste inchangé pour le téléchargement YouTube

// Nouvelle API pour les animes
const ANIME_API_BASE_URL = 'https://haji-mix-api.gleeze.com/api/anime';
const ANIME_API_KEY = 'e30864f5c326f6e3d70b032000ef5e2fa610cb5d9bc5759711d33036e303cef4';

// Clés et URL pour TMDb et SuperEmbed
const TMDB_API_KEY = "973515c7684f56d1472bba67b13d676b";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const SUPEREMBED_BASE_URL = "https://multiembed.mov"; // ou multiembed.mov/directstream.php

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));

// Proxy pour la recherche YouTube
app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  const apikey = '793fcf57-8820-40ea-b34e-7addd227e2e6';
  const url = `${API_SEARCH}?q=${encodeURIComponent(query)}&apikey=${apikey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Erreur API Recherche YouTube' });
  }
});

// Route pour obtenir les films populaires de TMDb
app.get('/api/movies/popular', async (req, res) => {
  const page = req.query.page || 1; // Permet la pagination si nécessaire plus tard
  const url = `${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&language=fr-FR&page=${page}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[TMDB POPULAR MOVIES ERROR] Erreur API externe ${response.status}: ${errorText}`);
      throw new Error(`Erreur API TMDb (${response.status})`);
    }
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('[TMDB POPULAR MOVIES API ERROR]', err.message);
    res.status(500).json({ error: 'Erreur lors de la récupération des films populaires sur TMDb.' });
  }
});

// --- Routes Proxy pour la nouvelle API Anime (haji-mix-api) ---

// Route pour les informations détaillées d'un anime
app.get('/api/anime/info/:animeId', async (req, res) => {
  const animeId = req.params.animeId;
  const targetUrl = `${ANIME_API_BASE_URL}/info?animeId=${animeId}&api_key=${ANIME_API_KEY}`;
  try {
    console.log(`[ANIME PROXY INFO] Appel de : ${targetUrl}`);
    const response = await fetch(targetUrl);
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[ANIME PROXY INFO for ${animeId}] Erreur API externe ${response.status}: ${errorText}`);
      throw new Error(`Erreur API externe (${response.status}): ${errorText.substring(0,100)}`);
    }
    const data = await response.json();
    console.log(`[ANIME PROXY INFO for ${animeId}] Données reçues et envoyées au client.`);
    res.json(data);
  } catch (err) {
    console.error(`[ANIME PROXY INFO ERROR for ${animeId}]`, err.message);
    res.status(500).json({ success: false, error: `Erreur récupération détails anime: ${err.message}` });
  }
});

// Route pour la liste des épisodes d'un anime
app.get('/api/anime/episodes/:animeId', async (req, res) => {
  const animeId = req.params.animeId; 
  const mode = req.query.mode || 'sub'; // Par défaut 'sub' si non fourni
  const targetUrl = `${ANIME_API_BASE_URL}/episodes?animeId=${animeId}&mode=${mode}&api_key=${ANIME_API_KEY}`;
  try {
    console.log(`[ANIME PROXY EPISODES] Appel de : ${targetUrl}`); // Logique de nom de console mise à jour
    const response = await fetch(targetUrl);
    if (!response.ok) { // Gestion d'erreur améliorée
        const errorText = await response.text();
        console.error(`[ANIME PROXY EPISODES for ${animeId}] Erreur API externe ${response.status}: ${errorText}`);
        throw new Error(`Erreur API externe (${response.status}) lors de la récupération des épisodes: ${errorText.substring(0,100)}`);
    }
    const data = await response.json();
    console.log(`[ANIME PROXY EPISODES for ${animeId}] Données reçues et envoyées au client.`);
    res.json(data);
  } catch (err) {
    console.error(`[ANIME PROXY EPISODES ERROR for ${animeId}]`, err.message); // animeId au lieu de id
    res.status(500).json({ success: false, error: `Erreur liste épisodes: ${err.message}` });
  }
});

// L'ancienne route /api/anime/servers/:episodeId a été supprimée car non nécessaire avec la nouvelle API.

// Route pour obtenir les liens de streaming d'un épisode
app.get('/api/anime/stream', async (req, res) => {
  const { animeId, episodeNumber } = req.query;
  const mode = req.query.mode || 'sub'; 

  if (!animeId || !episodeNumber) {
    return res.status(400).json({ success: false, error: "Paramètres 'animeId' et 'episodeNumber' requis." });
  }
  const targetUrl = `${ANIME_API_BASE_URL}/streams?animeId=${animeId}&episodeNumber=${episodeNumber}&mode=${mode}&api_key=${ANIME_API_KEY}`;
  
  try {
    console.log(`[ANIME PROXY STREAM] Appel de : ${targetUrl}`);
    const response = await fetch(targetUrl);
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[ANIME PROXY STREAM for Anime: ${animeId}, Ep: ${episodeNumber}] Erreur API externe ${response.status}: ${errorText}`);
      throw new Error(`Erreur API externe (${response.status}): ${errorText.substring(0,100)}`);
    }
    const data = await response.json();
    console.log(`[ANIME PROXY STREAM for Anime: ${animeId}, Ep: ${episodeNumber}] Données reçues et envoyées au client.`);
    res.json(data);
  } catch (err) {
    console.error(`[ANIME PROXY STREAM ERROR for Anime: ${animeId}, Ep: ${episodeNumber}]`, err.message);
    res.status(500).json({ success: false, error: `Erreur récupération liens streaming: ${err.message}` });
  }
});

// Ancienne Route pour la recherche d'animes (commentée proprement)
// À VÉRIFIER SI LA NOUVELLE API SUPPORTE UNE RECHERCHE SIMILAIRE ET ADAPTER SI BESOIN.
// Pour l'instant, cette fonctionnalité de recherche d'anime est désactivée côté serveur.
// Décommentons et adaptons pour la nouvelle API haji-mix
app.get('/api/anime/search', async (req, res) => {
  const query = req.query.q; // Le frontend enverra 'q' comme nom de paramètre pour la requête
  if (!query) {
    return res.status(400).json({ success: false, error: "Paramètre 'q' (query) requis pour la recherche d'anime." });
  }
  // L'API haji-mix attend 'query' comme nom de paramètre, pas 'q'.
  const targetUrl = `${ANIME_API_BASE_URL}/search?query=${encodeURIComponent(query)}&api_key=${ANIME_API_KEY}`;

  try {
    console.log(`[ANIME PROXY SEARCH] Appel de : ${targetUrl}`);
    const response = await fetch(targetUrl);
    if (!response.ok) {
        const errorText = await response.text();
        console.error(`[ANIME PROXY SEARCH for "${query}"] Erreur API externe ${response.status}: ${errorText}`);
        throw new Error(`Erreur API externe (${response.status}) pour recherche: ${errorText.substring(0,100)}`);
    }
    const data = await response.json();
    // La réponse de l'API est { results: [...] }, ce qui est bien.
    console.log(`[ANIME PROXY SEARCH for "${query}"] Données reçues et envoyées au client.`);
    res.json(data);
  } catch (err) {
    console.error(`[ANIME PROXY SEARCH ERROR for "${query}"]`, err.message);
    res.status(500).json({ success: false, error: `Erreur recherche anime: ${err.message}` });
  }
});

// Route pour les animes populaires
app.get('/api/anime/popular', async (req, res) => {
  const targetUrl = `${ANIME_API_BASE_URL}/popular?api_key=${ANIME_API_KEY}`;
  try {
    console.log(`[ANIME PROXY POPULAR] Appel de : ${targetUrl}`);
    const response = await fetch(targetUrl);
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[ANIME PROXY POPULAR] Erreur API externe ${response.status}: ${errorText}`);
      throw new Error(`Erreur API externe (${response.status}) pour populaires: ${errorText.substring(0,100)}`);
    }
    const data = await response.json();
    // La réponse de l'API est { recommendations: [ {anyCard: ...}, ...] }
    console.log(`[ANIME PROXY POPULAR] Données reçues et envoyées au client.`);
    res.json(data);
  } catch (err) {
    console.error('[ANIME PROXY POPULAR ERROR]', err.message);
    res.status(500).json({ success: false, error: `Erreur récupération animes populaires: ${err.message}` });
  }
});

// Proxy pour le téléchargement YouTube
app.get('/api/download', async (req, res) => {
  const videoUrl = req.query.url;
  const api_key = 'e30864f5c326f6e3d70b032000ef5e2fa610cb5d9bc5759711d33036e303cef4'; // Cette clé semble être pour l'API ytdl de haji-mix
  const url = `${API_DOWNLOAD}?url=${encodeURIComponent(videoUrl)}&api_key=${api_key}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('[YOUTUBE DOWNLOAD API ERROR]', err.message); // Log plus spécifique
    res.status(500).json({ error: 'Erreur API Téléchargement YouTube' });
  }
});

// Route pour la page d'accueil des animes (utilisant haji-mix-api)
app.get('/api/anime/home', async (req, res) => {
  const targetUrl = `${ANIME_API_BASE_URL}/home?api_key=${ANIME_API_KEY}`;
  try {
    console.log(`[ANIME PROXY HOME] Appel de : ${targetUrl}`);
    const response = await fetch(targetUrl);
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[ANIME PROXY HOME] Erreur API externe ${response.status}: ${errorText}`);
      throw new Error(`Erreur API externe (${response.status}): ${errorText.substring(0,100)}`);
    }
    const data = await response.json();
    console.log(`[ANIME PROXY HOME] Données reçues et envoyées au client.`);
    res.json(data);
  } catch (err) {
    console.error('[ANIME PROXY HOME ERROR]', err.message);
    res.status(500).json({ success: false, error: `Erreur récupération données d'accueil animes: ${err.message}` });
  }
});

// --- Routes pour TMDb et SuperEmbed ---

// Route pour rechercher des films sur TMDb
app.get('/api/movies/search', async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ error: "Le paramètre 'q' (requête) est manquant." });
  }
  const url = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=fr-FR`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('[TMDB SEARCH API ERROR]', err.message);
    res.status(500).json({ error: 'Erreur lors de la recherche de films sur TMDb.' });
  }
});

// Route pour obtenir les détails d'un film de TMDb et générer le lien SuperEmbed
app.get('/api/movies/details/:movieId', async (req, res) => {
  const movieId = req.params.movieId;
  const tmdbUrl = `${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&language=fr-FR&append_to_response=videos,external_ids`;

  try {
    const tmdbResponse = await fetch(tmdbUrl);
    if (!tmdbResponse.ok) {
      const errorText = await tmdbResponse.text();
      console.error(`[TMDB MOVIE DETAILS ERROR for ${movieId}] Erreur API externe ${tmdbResponse.status}: ${errorText}`);
      throw new Error(`Erreur API TMDb (${tmdbResponse.status})`);
    }
    const movieData = await tmdbResponse.json();

    // Construire le lien SuperEmbed
    // Priorité au VIP direct stream si possible, sinon le lien standard
    // On utilise l'ID TMDB directement car SuperEmbed le supporte
    const imdbId = movieData.external_ids && movieData.external_ids.imdb_id;
    let streamUrl;
    let vipStreamUrl;

    if (imdbId) { // SuperEmbed préfère parfois IMDB ID pour plus de fiabilité, mais TMDB ID est aussi supporté
        vipStreamUrl = `${SUPEREMBED_BASE_URL}/directstream.php?video_id=${imdbId}`;
        streamUrl = `${SUPEREMBED_BASE_URL}/?video_id=${imdbId}`;
    } else { // Fallback sur TMDB ID si IMDB ID n'est pas dispo (moins courant pour les films populaires)
        vipStreamUrl = `${SUPEREMBED_BASE_URL}/directstream.php?video_id=${movieId}&tmdb=1`;
        streamUrl = `${SUPEREMBED_BASE_URL}/?video_id=${movieId}&tmdb=1`;
    }
    
    // Pour les séries, il faudrait &s=SEASON_NUMBER&e=EPISODE_NUMBER
    // Pour les films, ces paramètres ne sont pas nécessaires.

    // Extraire le trailer YouTube si disponible (clé 'site' doit être 'YouTube' et 'type' doit être 'Trailer')
    let youtubeTrailerUrl = null;
    if (movieData.videos && movieData.videos.results) {
      const trailer = movieData.videos.results.find(video => video.site === 'YouTube' && video.type === 'Trailer');
      if (trailer) {
        youtubeTrailerUrl = `https://www.youtube.com/watch?v=${trailer.key}`;
      }
    }

    res.json({
      ...movieData,
      stream_url: streamUrl, // Lien standard
      vip_stream_url: vipStreamUrl, // Lien VIP
      youtube_trailer_url: youtubeTrailerUrl
    });

  } catch (err) {
    console.error(`[MOVIE DETAILS ERROR for ${movieId}]`, err.message);
    res.status(500).json({ error: `Erreur lors de la récupération des détails du film : ${err.message}` });
  }
});


app.listen(PORT, () => {
  console.log(`Serveur lancé sur le port ${PORT}`);
});
