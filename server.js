const express = require('express');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');
const multer = require('multer'); // For handling file uploads
const fs = require('fs'); // For file system operations like deleting files

// Configure Multer for disk storage

// Original UPLOAD_PATH for existing Gemini Vision and GPT-4o Vision
const LEGACY_GEMINI_UPLOAD_PATH = 'public/uploads/gemini_temp/';
// New UPLOAD_PATH for the "Gemini All Model" feature
const GEMINI_ALL_MODEL_TEMP_UPLOAD_PATH = 'public/uploads/gemini_all_model_temp/';

// Ensure upload directories exist
[LEGACY_GEMINI_UPLOAD_PATH, GEMINI_ALL_MODEL_TEMP_UPLOAD_PATH].forEach(dir => {
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Storage configuration for legacy Gemini Vision and GPT-4o Vision
const legacyGeminiStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, LEGACY_GEMINI_UPLOAD_PATH);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Multer instance for legacy uploads (original Gemini Vision, GPT-4o Vision)
const uploadLegacyVision = multer({
    storage: legacyGeminiStorage,
    limits: { fileSize: 10 * 1024 * 1024 } // Original limit 10MB
});

// Storage configuration for the new "Gemini All Model" feature
const geminiAllModelStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, GEMINI_ALL_MODEL_TEMP_UPLOAD_PATH);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Multer instance for "Gemini All Model" uploads
const uploadGeminiAllModel = multer({
    storage: geminiAllModelStorage,
    limits: { fileSize: 20 * 1024 * 1024 } // Limit file size to 20MB for this feature
});


const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
// Serve static files from the upload directories
app.use('/uploads/gemini_temp', express.static(path.join(__dirname, LEGACY_GEMINI_UPLOAD_PATH)));
app.use('/uploads/gemini_all_model_temp', express.static(path.join(__dirname, GEMINI_ALL_MODEL_TEMP_UPLOAD_PATH)));
// Serve main public files
app.use(express.static(path.join(__dirname, 'public')));
// JSON parsing middleware
app.use(express.json());


// API Keys
const WEATHER_API_KEY = '793fcf57-8820-40ea-b34e-7addd227e2e6';
const CHAT_API_KEY = '793fcf57-8820-40ea-b34e-7addd227e2e6';
const IMAGE_API_KEY = '793fcf57-8820-40ea-b34e-7addd227e2e6';
const GEMINI_API_URL = 'https://kaiz-apis.gleeze.com/api/gemini-vision';
const GEMINI_API_KEY = '793fcf57-8820-40ea-b34e-7addd227e2e6';
const GPT4O_LATEST_API_URL = 'https://kaiz-apis.gleeze.com/api/gpt4o-latest';
const GPT4O_LATEST_API_KEY = '793fcf57-8820-40ea-b34e-7addd227e2e6';

// New AI Model API Keys
const BLACKBOX_API_KEY = '793fcf57-8820-40ea-b34e-7addd227e2e6';
const DEEPSEEK_API_KEY = '793fcf57-8820-40ea-b34e-7addd227e2e6';
const CLAUDE_HAIKU_API_KEY = '793fcf57-8820-40ea-b34e-7addd227e2e6';
const HAJI_MIX_GEMINI_API_KEY = 'e30864f5c326f6e3d70b032000ef5e2fa610cb5d9bc5759711d33036e303cef4';
const HAJI_MIX_ANTHROPIC_API_KEY = 'e30864f5c326f6e3d70b032000ef5e2fa610cb5d9bc5759711d33036e303cef4'; // Added for Claude


// TMDB API Configuration
const TMDB_API_KEY = '973515c7684f56d1472bba67b13d676b';
const TMDB_ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI5NzM1MTVjNzY4NGY1NmQxNDcyYmJhNjdiMTNkNjc2YiIsIm5iZiI6MTc1MDc1NDgwNy41OTksInN1YiI6IjY4NWE2NWY3OWM3M2UyMWMzYWU2NGJmNSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.qofUiAxiL4ed8ONCxljkTqbsddbvFyVB4_Jwp_HyDnM';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// MongoDB Connection
const mongoUri = "mongodb+srv://rtmtafita:tafitaniaina1206@rtmchat.pzebpqh.mongodb.net/?retryWrites=true&w=majority&appName=rtmchat";
const client = new MongoClient(mongoUri);

let portfolioDb;
let commentsCollection;
let userActivitiesCollection;
let usersCollection;

async function connectDB() {
    try {
        await client.connect();
        portfolioDb = client.db("portfolioDb");
        commentsCollection = portfolioDb.collection("comments");
        userActivitiesCollection = portfolioDb.collection("userActivities");
        usersCollection = portfolioDb.collection("users");
        console.log("Successfully connected to MongoDB Atlas!");

        await commentsCollection.createIndex({ createdAt: -1 });
        await userActivitiesCollection.createIndex({ uid: 1 });
        await userActivitiesCollection.createIndex({ timestamp: -1 });
        await userActivitiesCollection.createIndex({ activityType: 1 });
        await usersCollection.createIndex({ uid: 1 }, { unique: true });
        await usersCollection.createIndex({ name: 1 }, { unique: true });
        console.log("Indexes ensured for collections.");

    } catch (err) {
        console.error("Failed to connect to MongoDB Atlas or ensure indexes", err);
    }
}

// Admin Code
const ADMIN_VERIFICATION_CODE = '2201018280';

// --- ROUTES ---

app.post('/api/verify-admin', (req, res) => {
    const { adminCode } = req.body;
    if (!adminCode) return res.status(400).json({ success: false, message: "Admin code is required" });
    if (adminCode === ADMIN_VERIFICATION_CODE) return res.json({ success: true });
    return res.status(401).json({ success: false, message: "Invalid admin code" });
});

app.get('/api/weather', async (req, res) => {
    const location = req.query.location;
    if (!location) { return res.status(400).json({ error: 'Location query parameter is required' }); }
    const weatherApiUrl = `https://kaiz-apis.gleeze.com/api/weather?q=${encodeURIComponent(location)}&apikey=${WEATHER_API_KEY}`;
    try {
        const apiResponse = await fetch(weatherApiUrl);
        if (!apiResponse.ok) {
            let errorText = `External API Error: ${apiResponse.status} ${apiResponse.statusText}`;
            try { const errorBody = await apiResponse.json(); if (errorBody && errorBody.message) errorText = `External API Error: ${errorBody.message}`; else if (typeof errorBody === 'string' && errorBody.length > 0) errorText = `External API Error: ${errorBody}`; } catch (e) { /* ignore */ }
            return res.status(apiResponse.status).json({ error: errorText, details: `Failed to fetch weather for ${location}` });
        }
        const data = await apiResponse.json();
        if (data && data["0"]) { res.json(data["0"]); }
        else { return res.status(500).json({ error: 'Unexpected response structure from weather API.' }); }
    } catch (error) {
        console.error('Server error while fetching weather:', error);
        return res.status(500).json({ error: 'Failed to fetch weather data due to server error.' });
    }
});

app.get('/api/activities', async (req, res) => {
    if (!userActivitiesCollection) return res.status(503).json({ error: "Database service not available." });
    try {
        const { uid, limit = 50, page = 1 } = req.query;
        const query = uid ? { uid } : {};
        const nLimit = parseInt(limit);
        const nPage = parseInt(page);
        const options = { sort: { timestamp: -1 }, limit: nLimit, skip: (nPage - 1) * nLimit };
        const activities = await userActivitiesCollection.find(query, options).toArray();
        const totalActivities = await userActivitiesCollection.countDocuments(query);
        let uniqueVisitors = uid ? undefined : (await userActivitiesCollection.distinct('uid', {})).length;
        res.status(200).json({ activities, totalActivities, currentPage: nPage, totalPages: Math.ceil(totalActivities / nLimit), uniqueVisitors });
    } catch (error) {
        console.error("Error fetching activities:", error);
        res.status(500).json({ error: "Failed to fetch activities due to server error." });
    }
});

app.post('/api/comments/:commentId/reply', async (req, res) => {
    if (!commentsCollection) return res.status(503).json({ error: "Database not connected." });
    try {
        const { commentId } = req.params;
        const { replyText } = req.body;
        if (!ObjectId.isValid(commentId)) return res.status(400).json({ error: "Invalid comment ID format." });
        if (replyText === undefined || typeof replyText !== 'string') return res.status(400).json({ error: 'Reply text must be a string.' });
        const updateResult = await commentsCollection.updateOne({ _id: new ObjectId(commentId) }, { $set: { adminReplyText: replyText.trim(), adminReplyTimestamp: new Date() } });
        if (updateResult.matchedCount === 0) return res.status(404).json({ error: "Comment not found." });
        const updatedComment = await commentsCollection.findOne({ _id: new ObjectId(commentId) });
        res.status(200).json(updatedComment);
    } catch (error) {
        console.error("Error posting admin reply:", error);
        res.status(500).json({ error: "Failed to post admin reply due to server error." });
    }
});

app.post('/api/chat', async (req, res) => {
    const { ask, uid, webSearch, isStoryRequestFlag } = req.body;
    if (!ask || !uid) return res.status(400).json({ error: 'Parameters "ask" and "uid" are required.' });
    const storyKeywords = ["create a short story about", "generate a story about", "write a story about", "tell me a story about", "story about"];
    const isStoryRequest = isStoryRequestFlag || storyKeywords.some(keyword => ask.toLowerCase().startsWith(keyword));
    const apiTargetUrl = isStoryRequest ?
        `https://kaiz-apis.gleeze.com/api/gpt4o-latest?ask=${encodeURIComponent(ask)}&uid=${encodeURIComponent(uid)}&imageUrl=&apikey=${CHAT_API_KEY}` :
        `https://kaiz-apis.gleeze.com/api/gpt-4o?ask=${encodeURIComponent(ask)}&uid=${encodeURIComponent(uid)}&webSearch=${(webSearch === true || String(webSearch).toLowerCase() === 'on') ? 'on' : 'off'}&apikey=${CHAT_API_KEY}`;
    const errorSource = isStoryRequest ? "Story API" : "Chat API";
    try {
        const apiResponse = await fetch(apiTargetUrl);
        const responseText = await apiResponse.text();
        if (!apiResponse.ok) {
            let errorJson = { error: `External ${errorSource} Error: ${apiResponse.status} ${apiResponse.statusText}`, details: responseText };
            try { errorJson = JSON.parse(responseText); if(!errorJson.error && !errorJson.message) { errorJson.error = `External ${errorSource} Error: ${apiResponse.status} ${apiResponse.statusText}`; } } catch (e) { /* Not JSON */ }
            return res.status(apiResponse.status).json(errorJson);
        }
        let data;
        try { data = JSON.parse(responseText); } catch (e) { return res.status(500).json({ error: `Failed to parse response from ${errorSource}.`, details: responseText }); }
        if (data && data.response) res.json({ author: data.author || "Kaizenji", response: data.response });
        else return res.status(500).json({ error: `Unexpected response structure from ${errorSource}.`, details: data });
    } catch (error) {
        console.error(`Server error while calling ${errorSource}:`, error);
        return res.status(500).json({ error: `Server error while processing ${isStoryRequest ? 'story generation' : 'chat'} request.` });
    }
});

app.post('/api/gemini-chat', uploadLegacyVision.single('imageFile'), async (req, res) => {
    const { q, uid } = req.body;
    let tempImagePath = null;
    let publicImageUrl = null;
    if (req.file) {
        tempImagePath = req.file.path;
        const APP_BASE_URL = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
        publicImageUrl = new URL(`/uploads/gemini_temp/${req.file.filename}`, APP_BASE_URL).toString();
    }
    if (!uid) {
        if (tempImagePath) fs.unlinkSync(tempImagePath);
        return res.status(400).json({ error: 'Parameter "uid" is required.' });
    }
    const questionText = q ? q.trim() : "";
    if (questionText === "" && !publicImageUrl) {
        if (tempImagePath) fs.unlinkSync(tempImagePath);
        return res.status(400).json({ error: 'Either a question ("q") or an image file is required.' });
    }
    let fullApiUrl = `${GEMINI_API_URL}?uid=${encodeURIComponent(uid)}&apikey=${GEMINI_API_KEY}`;
    if (questionText) fullApiUrl += `&q=${encodeURIComponent(questionText)}`;
    if (publicImageUrl) fullApiUrl += `&imageUrl=${encodeURIComponent(publicImageUrl)}`;
    try {
        const apiResponse = await fetch(fullApiUrl);
        const responseText = await apiResponse.text();
        if (tempImagePath) fs.unlink(tempImagePath, (err) => { if (err) console.error("Error deleting temp image for Gemini Vision:", err); });
        if (!apiResponse.ok) {
            let errorJson = { error: `External Gemini API Error: ${apiResponse.status} ${apiResponse.statusText}`, details: responseText };
            try { errorJson = JSON.parse(responseText); if(!errorJson.error && !errorJson.message) { errorJson.error = `External Gemini API Error: ${apiResponse.status} ${apiResponse.statusText}`; } } catch (e) { /* Not JSON */ }
            return res.status(apiResponse.status).json(errorJson);
        }
        let data;
        try { data = JSON.parse(responseText); }
        catch (e) { return res.status(500).json({ error: 'Failed to parse response from Gemini API.', details: responseText }); }
        if (data && data.response) res.json({ author: data.author || "Gemini (Kaizenji)", response: data.response });
        else return res.status(500).json({ error: 'Unexpected response structure from Gemini API.', details: data });
    } catch (error) {
        console.error('Server error while calling Gemini API:', error);
        if (tempImagePath && fs.existsSync(tempImagePath)) fs.unlink(tempImagePath, (err) => { if (err) console.error("Error deleting temp image for Gemini Vision on error:", err); });
        return res.status(500).json({ error: 'Server error while processing Gemini chat request.' });
    }
});

app.post('/api/gpt4o-chat', uploadLegacyVision.single('imageFile'), async (req, res) => {
    const { q, uid } = req.body;
    let tempImagePath = null;
    let publicImageUrl = null;
    if (req.file) {
        tempImagePath = req.file.path;
        const APP_BASE_URL = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
        publicImageUrl = new URL(`/uploads/gemini_temp/${req.file.filename}`, APP_BASE_URL).toString();
    }
    if (!uid) {
        if (tempImagePath) fs.unlinkSync(tempImagePath);
        return res.status(400).json({ error: 'Parameter "uid" is required.' });
    }
    const questionText = q ? q.trim() : "";
    if (questionText === "" && !publicImageUrl) {
        if (tempImagePath) fs.unlinkSync(tempImagePath);
        return res.status(400).json({ error: 'Either a question ("q") or an image file is required for GPT-4o chat.' });
    }
    let fullApiUrl = `${GPT4O_LATEST_API_URL}?uid=${encodeURIComponent(uid)}&apikey=${GPT4O_LATEST_API_KEY}`;
    if (questionText) fullApiUrl += `&ask=${encodeURIComponent(questionText)}`;
    if (publicImageUrl) fullApiUrl += `&imageUrl=${encodeURIComponent(publicImageUrl)}`;
    try {
        const apiResponse = await fetch(fullApiUrl);
        const responseText = await apiResponse.text();
        if (tempImagePath) fs.unlink(tempImagePath, (err) => { if (err) console.error("Error deleting temp image for GPT-4o Vision:", err); });
        if (!apiResponse.ok) {
            let errorJson = { error: `External GPT-4o API Error: ${apiResponse.status} ${apiResponse.statusText}`, details: responseText };
            try { errorJson = JSON.parse(responseText); if(!errorJson.error && !errorJson.message) { errorJson.error = `External GPT-4o API Error: ${apiResponse.status} ${apiResponse.statusText}`; } } catch (e) { /* Not JSON */ }
            return res.status(apiResponse.status).json(errorJson);
        }
        let data;
        try { data = JSON.parse(responseText); }
        catch (e) { return res.status(500).json({ error: 'Failed to parse response from GPT-4o API.', details: responseText }); }
        if (data && data.response) res.json({ author: data.author || "GPT-4o (Kaizenji)", response: data.response });
        else return res.status(500).json({ error: 'Unexpected response structure from GPT-4o API.', details: data });
    } catch (error) {
        console.error('Server error while calling GPT-4o API:', error);
        if (tempImagePath && fs.existsSync(tempImagePath)) fs.unlink(tempImagePath, (err) => { if (err) console.error("Error deleting temp image for GPT-4o Vision on error:", err); });
        return res.status(500).json({ error: 'Server error while processing GPT-4o chat request.' });
    }
});

app.post('/api/generate-image', async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) { return res.status(400).json({ error: 'Parameter "prompt" is required.' }); }
    const imageApiUrl = `https://kaiz-apis.gleeze.com/api/flux?prompt=${encodeURIComponent(prompt)}&apikey=${IMAGE_API_KEY}`;
    try {
        const apiResponse = await fetch(imageApiUrl);
        if (!apiResponse.ok) {
            const errorText = await apiResponse.text();
            try { const errorJson = JSON.parse(errorText); return res.status(apiResponse.status).json(errorJson); }
            catch (e) { return res.status(apiResponse.status).json({ error: `Image API Error: ${apiResponse.statusText}`, details: errorText }); }
        }
        const contentType = apiResponse.headers.get('content-type') || 'image/jpeg';
        res.setHeader('Content-Type', contentType);
        const imageBuffer = await apiResponse.buffer();
        res.send(imageBuffer);
    } catch (error) {
        console.error('Server error while calling Image API:', error);
        return res.status(500).json({ error: 'Server error while processing image generation request.' });
    }
});

app.delete('/api/comments/:commentId', async (req, res) => {
    if (!commentsCollection) return res.status(503).json({ error: "Database not connected." });
    try {
        const { commentId } = req.params;
        if (!ObjectId.isValid(commentId)) return res.status(400).json({ error: "Invalid comment ID format." });
        const result = await commentsCollection.deleteOne({ _id: new ObjectId(commentId) });
        if (result.deletedCount === 0) return res.status(404).json({ error: "Comment not found." });
        res.status(200).json({ message: "Comment deleted successfully.", deletedCount: result.deletedCount });
    } catch (error) {
        console.error("Error deleting comment:", error);
        res.status(500).json({ error: "Failed to delete comment due to server error." });
    }
});

app.post('/api/comments', async (req, res) => {
    if (!commentsCollection) return res.status(503).json({ error: "Database not connected." });
    try {
        const { name: clientProvidedName, text, uid } = req.body;
        if (!uid) return res.status(400).json({ error: 'User ID (uid) is required to post a comment.' });
        if (!text || typeof text !== 'string' || text.trim() === '') return res.status(400).json({ error: 'Text is required.' });
        if (!clientProvidedName || typeof clientProvidedName !== 'string' || clientProvidedName.trim() === '') return res.status(400).json({ error: 'Name is required.' });
        let finalName = clientProvidedName.trim();
        if (usersCollection) {
            const user = await usersCollection.findOne({ uid: uid });
            if (user && user.name) finalName = user.name;
        }
        const newComment = { uid, name: finalName, text: text.trim(), createdAt: new Date(), likes: { count: 0, users: [] }, dislikes: { count: 0, users: [] }, adminReplyText: "", adminReplyTimestamp: null };
        const result = await commentsCollection.insertOne(newComment);
        res.status(201).json({ _id: result.insertedId, ...newComment });
    } catch (error) {
        console.error("Error posting comment:", error);
        res.status(500).json({ error: "Failed to post comment due to server error." });
    }
});

app.post('/api/comments/:commentId/like', async (req, res) => {
    if (!commentsCollection) return res.status(503).json({ error: "Database not connected." });
    try {
        const { commentId } = req.params;
        const { uid } = req.body;
        if (!ObjectId.isValid(commentId)) return res.status(400).json({ error: "Invalid comment ID." });
        if (!uid) return res.status(400).json({ error: "User ID is required." });
        const comment = await commentsCollection.findOne({ _id: new ObjectId(commentId) });
        if (!comment) return res.status(404).json({ error: "Comment not found." });
        comment.likes = comment.likes || { count: 0, users: [] };
        comment.dislikes = comment.dislikes || { count: 0, users: [] };
        const hasLiked = comment.likes.users.includes(uid);
        const hasDisliked = comment.dislikes.users.includes(uid);
        if (hasLiked) {
            comment.likes.users = comment.likes.users.filter(userId => userId !== uid);
        } else {
            comment.likes.users.push(uid);
            if (hasDisliked) comment.dislikes.users = comment.dislikes.users.filter(userId => userId !== uid);
        }
        comment.likes.count = comment.likes.users.length;
        comment.dislikes.count = comment.dislikes.users.length;
        await commentsCollection.updateOne({ _id: new ObjectId(commentId) }, { $set: { likes: comment.likes, dislikes: comment.dislikes } });
        res.status(200).json(comment);
    } catch (error) {
        console.error("Error liking comment:", error);
        res.status(500).json({ error: "Server error while liking comment." });
    }
});

app.post('/api/comments/:commentId/dislike', async (req, res) => {
    if (!commentsCollection) return res.status(503).json({ error: "Database not connected." });
    try {
        const { commentId } = req.params;
        const { uid } = req.body;
        if (!ObjectId.isValid(commentId)) return res.status(400).json({ error: "Invalid comment ID." });
        if (!uid) return res.status(400).json({ error: "User ID is required." });
        const comment = await commentsCollection.findOne({ _id: new ObjectId(commentId) });
        if (!comment) return res.status(404).json({ error: "Comment not found." });
        comment.likes = comment.likes || { count: 0, users: [] };
        comment.dislikes = comment.dislikes || { count: 0, users: [] };
        const hasLiked = comment.likes.users.includes(uid);
        const hasDisliked = comment.dislikes.users.includes(uid);
        if (hasDisliked) {
            comment.dislikes.users = comment.dislikes.users.filter(userId => userId !== uid);
        } else {
            comment.dislikes.users.push(uid);
            if (hasLiked) comment.likes.users = comment.likes.users.filter(userId => userId !== uid);
        }
        comment.likes.count = comment.likes.users.length;
        comment.dislikes.count = comment.dislikes.users.length;
        await commentsCollection.updateOne({ _id: new ObjectId(commentId) }, { $set: { likes: comment.likes, dislikes: comment.dislikes } });
        res.status(200).json(comment);
    } catch (error) {
        console.error("Error disliking comment:", error);
        res.status(500).json({ error: "Server error while disliking comment." });
    }
});

app.post('/api/users/register', async (req, res) => {
    if (!usersCollection) return res.status(503).json({ message: "User service not available." });
    try {
        const { uid, name } = req.body;
        if (!uid || typeof uid !== 'string' || uid.trim() === '') return res.status(400).json({ message: 'User ID (uid) is required.' });
        if (!name || typeof name !== 'string' || name.trim() === '') return res.status(400).json({ message: 'Name is required.' });
        const trimmedName = name.trim();
        if (trimmedName.length < 3) return res.status(400).json({ message: 'Name must be at least 3 characters long.' });
        const existingUserByUID = await usersCollection.findOne({ uid: uid });
        if (existingUserByUID) {
            if (existingUserByUID.name === trimmedName) return res.status(200).json({ uid: existingUserByUID.uid, name: existingUserByUID.name, message: "Welcome back!" });
            return res.status(409).json({ message: "This User ID is already associated with a different name." });
        }
        const existingUserByName = await usersCollection.findOne({ name: trimmedName });
        if (existingUserByName) return res.status(409).json({ message: "This name is already taken." });
        const newUser = { uid: uid, name: trimmedName, createdAt: new Date() };
        await usersCollection.insertOne(newUser);
        res.status(201).json({ uid: newUser.uid, name: newUser.name, message: "User registered successfully." });
    } catch (error) {
        console.error("Error during user registration:", error);
        if (error.code === 11000) {
            if (error.message.includes('index: name_1')) return res.status(409).json({ message: "This name is already taken." });
            if (error.message.includes('index: uid_1')) return res.status(409).json({ message: "This User ID is already registered." });
        }
        res.status(500).json({ message: "Server error during user registration." });
    }
});

app.get('/api/users/check/:uid', async (req, res) => {
    if (!usersCollection) return res.status(503).json({ message: "User service not available." });
    try {
        const { uid } = req.params;
        if (!uid) return res.status(400).json({ message: 'User ID (uid) is required in path.' });
        const user = await usersCollection.findOne({ uid: uid });
        if (user) res.status(200).json({ uid: user.uid, name: user.name });
        else res.status(404).json({ message: "User not found or name not registered yet." });
    } catch (error) {
        console.error("Error checking user:", error);
        res.status(500).json({ message: "Server error while checking user." });
    }
});

async function fetchTMDB(endpoint, queryParams = {}) {
    const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
    url.searchParams.append('api_key', TMDB_API_KEY);
    for (const key in queryParams) url.searchParams.append(key, queryParams[key]);
    try {
        const response = await fetch(url.toString(), { method: 'GET', headers: { 'Authorization': `Bearer ${TMDB_ACCESS_TOKEN}`, 'Content-Type': 'application/json;charset=utf-8' } });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ status_message: `TMDB API error: ${response.statusText}` }));
            throw { status: response.status, message: errorData.status_message || `Failed to fetch from TMDB: ${endpoint}` };
        }
        return await response.json();
    } catch (error) {
        console.error(`Error in fetchTMDB for ${endpoint}:`, error);
        throw error;
    }
}
app.get('/api/movies/popular', async (req, res) => { try { const data = await fetchTMDB('/movie/popular', { page: req.query.page || '1' }); res.json(data); } catch (e) { res.status(e.status || 500).json({m: e.message}); }});
app.get('/api/movies/search', async (req, res) => { const {query, page} = req.query; if(!query) return res.status(400).json({m:'Query required.'}); try {const d = await fetchTMDB('/search/movie', {query, page:page||'1'});res.json(d);}catch(e){res.status(e.status||500).json({m:e.message});}});
app.get('/api/movies/details/:id', async (req, res) => { const {id}=req.params; if(!id) return res.status(400).json({m:'ID required.'}); try {const d=await fetchTMDB(`/movie/${id}`); res.json(d);}catch(e){res.status(e.status||500).json({m:e.message});}});
app.get('/api/movies/details/:id/videos', async (req, res) => { const {id}=req.params; if(!id) return res.status(400).json({m:'ID required.'}); try {const d=await fetchTMDB(`/movie/${id}/videos`);res.json(d);}catch(e){res.status(e.status||500).json({m:e.message});}});

app.post('/api/activity', async (req, res) => {
    if (!userActivitiesCollection) return res.status(503).json({ error: "Database service not available." });
    try {
        const { uid, activityType, details, timestamp, url } = req.body;
        if (!uid || !activityType || !timestamp) return res.status(400).json({ error: 'UID, activityType, and timestamp are required.' });
        let userName = "Unknown";
        if (usersCollection) {
            const user = await usersCollection.findOne({ uid: uid });
            if (user && user.name) userName = user.name;
        }
        await userActivitiesCollection.insertOne({ uid, name: userName, activityType, details: details || {}, timestamp: new Date(timestamp), url: url || '' });
        res.status(201).json({ message: 'Activity tracked successfully.' });
    } catch (error) {
        console.error("Error tracking activity:", error);
        res.status(500).json({ error: "Failed to track activity due to server error." });
    }
});

app.get('/api/comments', async (req, res) => {
    if (!commentsCollection) return res.status(503).json({ error: "Database not connected." });
    try {
        const comments = await commentsCollection.find({}).sort({ createdAt: -1 }).toArray();
        res.status(200).json(comments);
    } catch (error) {
        console.error("Error fetching comments:", error);
        res.status(500).json({ error: "Failed to fetch comments due to server error." });
    }
});

const TEMPMAIL_API_KEY_CONST = '793fcf57-8820-40ea-b34e-7addd227e2e6'; // Renamed to avoid conflict
app.get('/api/tempmail/create', async (req, res) => {
    const apiUrl = `https://kaiz-apis.gleeze.com/api/tempmail-create?apikey=${TEMPMAIL_API_KEY_CONST}`;
    try {
        const r = await fetch(apiUrl); const t = await r.text(); if(!r.ok){let e={e:`API (tempmail-create) Err: ${r.status} ${r.statusText}`,d:t};try{e=JSON.parse(t);if(!e.e&&!e.m)e.e=`API (tempmail-create) Err: ${r.status} ${r.statusText}`; }catch(c){} return res.status(r.status).json(e);} res.json(JSON.parse(t));
    } catch (e) { console.error('Tempmail-create err:', e); res.status(500).json({e:'Server error creating temp mail.'});}
});
app.get('/api/tempmail/inbox', async (req, res) => {
    const { token } = req.query; if(!token)return res.status(400).json({e:'Token required.'});
    const apiUrl = `https://kaiz-apis.gleeze.com/api/tempmail-inbox?token=${encodeURIComponent(token)}&apikey=${TEMPMAIL_API_KEY_CONST}`;
    try {
        const r = await fetch(apiUrl); const t = await r.text(); if(!r.ok){let e={e:`API (tempmail-inbox) Err: ${r.status} ${r.statusText}`,d:t};try{e=JSON.parse(t);if(!e.e&&!e.m)e.e=`API (tempmail-inbox) Err: ${r.status} ${r.statusText}`; }catch(c){} return res.status(r.status).json(e);} res.json(JSON.parse(t));
    } catch (e) { console.error('Tempmail-inbox err:', e); res.status(500).json({e:'Server error fetching inbox.'});}
});

app.post('/api/blackbox-ai', async (req, res) => {
    const { ask, uid, webSearch } = req.body;
    if (!ask || !uid) return res.status(400).json({ error: 'Parameters "ask" and "uid" are required for Blackbox AI.' });
    const webSearchParam = (webSearch === true || String(webSearch).toLowerCase() === 'on') ? 'on' : 'off';
    const apiUrl = `https://kaiz-apis.gleeze.com/api/blackbox?ask=${encodeURIComponent(ask)}&uid=${encodeURIComponent(uid)}&webSearch=${webSearchParam}&apikey=${BLACKBOX_API_KEY}`;
    try {
        const r = await fetch(apiUrl); const t = await r.text(); if(!r.ok){let e={e:`Blackbox API Err: ${r.status} ${r.statusText}`,d:t};try{e=JSON.parse(t);if(!e.e&&!e.m)e.e=`Blackbox API Err: ${r.status} ${r.statusText}`;}catch(c){} return res.status(r.status).json(e);} const d=JSON.parse(t); if(d&&d.response)res.json({author:d.author||"Blackbox AI",response:d.response}); else return res.status(500).json({e:'Unexpected Blackbox API response.',d});
    } catch (e) { console.error('Blackbox API server err:', e); return res.status(500).json({ error: 'Server error (Blackbox AI).' }); }
});

app.post('/api/deepseek-ai', async (req, res) => {
    const { ask } = req.body; if (!ask) return res.status(400).json({ error: '"ask" required for Deepseek AI.' });
    const apiUrl = `https://kaiz-apis.gleeze.com/api/deepseek-v3?ask=${encodeURIComponent(ask)}&apikey=${DEEPSEEK_API_KEY}`;
    try {
        const r = await fetch(apiUrl); const t = await r.text(); if(!r.ok){let e={e:`Deepseek API Err: ${r.status} ${r.statusText}`,d:t};try{e=JSON.parse(t);if(!e.e&&!e.m)e.e=`Deepseek API Err: ${r.status} ${r.statusText}`;}catch(c){} return res.status(r.status).json(e);} const d=JSON.parse(t); if(d&&d.response)res.json({author:d.author||"Deepseek AI",response:d.response}); else return res.status(500).json({e:'Unexpected Deepseek API response.',d});
    } catch (e) { console.error('Deepseek API server err:', e); return res.status(500).json({ error: 'Server error (Deepseek AI).' }); }
});

app.post('/api/claude-haiku-ai', async (req, res) => {
    const { ask } = req.body; if (!ask) return res.status(400).json({ error: '"ask" required for Claude Haiku AI.' });
    const apiUrl = `https://kaiz-apis.gleeze.com/api/claude3-haiku?ask=${encodeURIComponent(ask)}&apikey=${CLAUDE_HAIKU_API_KEY}`;
    try {
        const r = await fetch(apiUrl); const t = await r.text(); if(!r.ok){let e={e:`Claude API Err: ${r.status} ${r.statusText}`,d:t};try{e=JSON.parse(t);if(!e.e&&!e.m)e.e=`Claude API Err: ${r.status} ${r.statusText}`;}catch(c){} return res.status(r.status).json(e);} const d=JSON.parse(t); if(d&&d.response)res.json({author:d.author||"Claude Haiku AI",response:d.response}); else return res.status(500).json({e:'Unexpected Claude API response.',d});
    } catch (e) { console.error('Claude API server err:', e); return res.status(500).json({ error: 'Server error (Claude Haiku AI).' }); }
});

// Gemini All Model API Route
app.post('/api/gemini-all-model', uploadGeminiAllModel.single('file'), async (req, res) => {
    const { ask, model, uid, roleplay, max_tokens } = req.body;
    let clientUploadedFileUrl = req.body.file_url;
    let tempLocalPath = null;
    let publicFileUrl = null;

    if (!ask && !req.file && !clientUploadedFileUrl) return res.status(400).json({ error: '"ask" or file/file_url required.' });
    if (!uid) { if (req.file) fs.unlinkSync(req.file.path); return res.status(400).json({ error: '"uid" required.' }); }
    if (!model) { if (req.file) fs.unlinkSync(req.file.path); return res.status(400).json({ error: '"model" required.' }); }

    if (req.file) {
        tempLocalPath = req.file.path;
        const APP_BASE_URL = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
        publicFileUrl = new URL(`/uploads/gemini_all_model_temp/${req.file.filename}`, APP_BASE_URL).toString();
        console.log(`Gemini All Model: File temp saved at ${tempLocalPath}, public URL ${publicFileUrl}`);
    } else if (clientUploadedFileUrl) {
        try {
            const parsedUrl = new URL(clientUploadedFileUrl);
            if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") throw new Error("Invalid file URL protocol.");
            publicFileUrl = clientUploadedFileUrl;
        } catch (e) { return res.status(400).json({ error: `Invalid file_url: ${e.message}` }); }
    }

    let hajiApiUrl = `https://haji-mix-api.gleeze.com/api/gemini?uid=${encodeURIComponent(uid)}&model=${encodeURIComponent(model)}&google_api_key=&api_key=${HAJI_MIX_GEMINI_API_KEY}`; // Added google_api_key=
    if (ask) hajiApiUrl += `&ask=${encodeURIComponent(ask)}`;
    if (publicFileUrl) hajiApiUrl += `&file_url=${encodeURIComponent(publicFileUrl)}`;
    if (roleplay) hajiApiUrl += `&roleplay=${encodeURIComponent(roleplay)}`;
    if (max_tokens) hajiApiUrl += `&max_tokens=${encodeURIComponent(max_tokens)}`;

    try {
        const apiResponse = await fetch(hajiApiUrl);
        const responseText = await apiResponse.text();
        if (tempLocalPath) fs.unlink(tempLocalPath, (err) => { if (err) console.error("Error deleting temp file for Gemini All Model:", err); });

        if (!apiResponse.ok) {
            let eJson={error:`Haji Mix Gemini API Error: ${apiResponse.status} ${apiResponse.statusText}`,details:responseText};
            try{
                const parsedError = JSON.parse(responseText);
                // If parsedError has a more specific error message, use it.
                if(parsedError.error) eJson.error = parsedError.error;
                if(parsedError.message && !parsedError.error) eJson.error = parsedError.message; // Some APIs use 'message'
                if(parsedError.details) eJson.details = parsedError.details;

            }catch(c){ /* responseText was not JSON, keep original error */}
            console.error("Haji Mix Gemini API Error:", eJson);
            return res.status(apiResponse.status).json(eJson);
        }

        let data;
        try { data = JSON.parse(responseText); }
        catch (e) {
            console.warn('Haji Mix Gemini API response was not JSON, but status was OK. Response text:', responseText);
            return res.status(500).json({ error: 'Failed to parse response from Haji Mix Gemini API.', details: responseText });
        }

        const responsePayload = {
            author: data.model_used || model,
            response: data.answer,
            model_used: data.model_used,
            supported_models: Array.isArray(data.supported_models) ? data.supported_models : []
        };

        if (data.error && !data.answer) {
             console.warn("Haji Mix API returned an error in its payload:", data.error);
        }

        if (responsePayload.supported_models.length > 0) {
            console.log("Gemini All Model: Successfully retrieved/forwarding supported_models list.");
        } else {
            console.warn("Gemini All Model: Haji Mix API response did not include 'supported_models' or it was empty.");
        }

        res.json(responsePayload);

    } catch (error) {
        console.error('Server error (Haji Mix Gemini API):', error);
        if (tempLocalPath && fs.existsSync(tempLocalPath)) fs.unlink(tempLocalPath, (err) => { if (err) console.error("Error deleting temp file (Gemini All Model) on error:", err); });
        return res.status(500).json({ error: 'Server error processing Haji Mix Gemini API request.' });
    }
});

// New Route for All ChatGPT Models
const CHATGPT_HAJI_MIX_API_KEY = 'e30864f5c326f6e3d70b032000ef5e2fa610cb5d9bc5759711d33036e303cef4'; 
const CHATGPT_ALL_MODEL_TEMP_UPLOAD_PATH = 'public/uploads/chatgpt_temp/';

if (!fs.existsSync(CHATGPT_ALL_MODEL_TEMP_UPLOAD_PATH)){
    fs.mkdirSync(CHATGPT_ALL_MODEL_TEMP_UPLOAD_PATH, { recursive: true });
}
app.use('/uploads/chatgpt_temp', express.static(path.join(__dirname, CHATGPT_ALL_MODEL_TEMP_UPLOAD_PATH)));

const chatGPTAllModelStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, CHATGPT_ALL_MODEL_TEMP_UPLOAD_PATH);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, "chatgptfile-" + uniqueSuffix + path.extname(file.originalname));
    }
});
const uploadChatGPTAllModel = multer({
    storage: chatGPTAllModelStorage,
    limits: { fileSize: 20 * 1024 * 1024 } // 20MB limit, same as Gemini All Model
});

// Multer configuration for Claude All Model (can reuse Gemini's or ChatGPT's if settings are identical)
// For clarity, let's define one, even if it's a copy, or ensure the existing one is suitable.
// Reusing 'uploadGeminiAllModel' as the settings (path, size limit) are likely to be similar.
// If distinct paths/limits are needed, a new multer instance should be created.
const CLAUDE_ALL_MODEL_TEMP_UPLOAD_PATH = 'public/uploads/claude_all_model_temp/';
if (!fs.existsSync(CLAUDE_ALL_MODEL_TEMP_UPLOAD_PATH)){
    fs.mkdirSync(CLAUDE_ALL_MODEL_TEMP_UPLOAD_PATH, { recursive: true });
}
app.use('/uploads/claude_all_model_temp', express.static(path.join(__dirname, CLAUDE_ALL_MODEL_TEMP_UPLOAD_PATH)));

const claudeAllModelStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, CLAUDE_ALL_MODEL_TEMP_UPLOAD_PATH);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, "claudefile-" + uniqueSuffix + path.extname(file.originalname));
    }
});
const uploadClaudeAllModel = multer({
    storage: claudeAllModelStorage,
    limits: { fileSize: 20 * 1024 * 1024 } // 20MB limit
});

app.post('/api/claude-all-model', uploadClaudeAllModel.single('file'), async (req, res) => {
    const { ask, model, uid, roleplay, max_tokens } = req.body;
    let clientUploadedFileUrl = req.body.img_url; 
    let tempLocalPath = null;
    let publicFileUrl = null; 

    if (!ask && !req.file && !clientUploadedFileUrl) return res.status(400).json({ error: '"ask" or a file/img_url is required for Claude.' });
    if (!uid) { if (req.file) fs.unlinkSync(req.file.path); return res.status(400).json({ error: '"uid" is required.' }); }
    if (!model) { if (req.file) fs.unlinkSync(req.file.path); return res.status(400).json({ error: '"model" is required.' }); }

    if (req.file) {
        tempLocalPath = req.file.path;
        const APP_BASE_URL = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
        publicFileUrl = new URL(`/uploads/claude_all_model_temp/${req.file.filename}`, APP_BASE_URL).toString();
        console.log(`Claude All Model: File temp saved at ${tempLocalPath}, public URL ${publicFileUrl}`);
    } else if (clientUploadedFileUrl) {
        try {
            const parsedUrl = new URL(clientUploadedFileUrl);
            if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") throw new Error("Invalid img_url protocol.");
            publicFileUrl = clientUploadedFileUrl;
        } catch (e) {
            return res.status(400).json({ error: `Invalid img_url: ${e.message}` });
        }
    }

    let hajiAnthropicApiUrl = `https://haji-mix-api.gleeze.com/api/anthropic?uid=${encodeURIComponent(uid)}&model=${encodeURIComponent(model)}&api_key=${HAJI_MIX_ANTHROPIC_API_KEY}`;
    
    if (ask) hajiAnthropicApiUrl += `&ask=${encodeURIComponent(ask)}`;
    if (publicFileUrl) hajiAnthropicApiUrl += `&img_url=${encodeURIComponent(publicFileUrl)}`;
    if (roleplay) hajiAnthropicApiUrl += `&roleplay=${encodeURIComponent(roleplay)}`;
    if (max_tokens) hajiAnthropicApiUrl += `&max_tokens=${encodeURIComponent(max_tokens)}`;
    hajiAnthropicApiUrl += `&stream=false`;

    try {
        const apiResponse = await fetch(hajiAnthropicApiUrl);
        const responseText = await apiResponse.text();
        if (tempLocalPath) fs.unlink(tempLocalPath, (err) => { if (err) console.error("Error deleting temp file for Claude All Model:", err); });

        if (!apiResponse.ok) {
            let eJson = { error: `Haji Mix Anthropic API Error: ${apiResponse.status} ${apiResponse.statusText}`, details: responseText };
            try {
                const parsedError = JSON.parse(responseText);
                if (parsedError.error) eJson.error = parsedError.error;
                else if (parsedError.message) eJson.error = parsedError.message;
                if (parsedError.details) eJson.details = parsedError.details;
            } catch (c) { /* responseText was not JSON */ }
            console.error("Haji Mix Anthropic API Error:", eJson);
            return res.status(apiResponse.status).json(eJson);
        }

        let data;
        try { data = JSON.parse(responseText); } 
        catch (e) {
            console.warn('Haji Mix Anthropic API response was not JSON, but status was OK. Response text:', responseText);
            if (typeof responseText === 'string' && responseText.trim().length > 0 && !responseText.toLowerCase().includes('error')) {
                 return res.json({
                    author: model, response: responseText, model_used: model,
                    supported_models: [model], user_ask: ask, images_processed: publicFileUrl ? 1 : 0
                });
            }
            return res.status(500).json({ error: 'Failed to parse response from Haji Mix Anthropic API.', details: responseText });
        }
        
        // Check if the essential 'answer' field is present
        if (data.answer === undefined || data.answer === null) {
            console.warn("Haji Mix Anthropic API response was OK but 'answer' field is missing or null. Data:", data);
            // Also check if there was a data.error field that might explain this
            if (data.error) {
                 return res.status(500).json({ error: `Anthropic API reported an error: ${data.error}`, details: data });
            }
            return res.status(500).json({ error: 'Anthropic API response is missing the "answer" field.', details: data });
        }

        const responsePayload = {
            user_ask: data.user_ask || ask, model_used: data.model_used || model,
            author: data.model_used || model, response: data.answer,
            supported_models: Array.isArray(data.supported_models) && data.supported_models.length > 0 ? data.supported_models : [model], // Ensure fallback and not empty
            images_processed: data.images_processed !== undefined ? data.images_processed : (publicFileUrl ? 1 : 0)
        };
        
        // This specific check might be redundant if the above check for data.answer handles it,
        // but keeping it if API might return both error and a (possibly empty) answer.
        if (data.error && !data.answer) { 
             console.warn("Haji Mix Anthropic API returned an error in its payload (and no answer):", data.error);
             // If we reached here, it implies data.answer was somehow present, which contradicts the check.
             // However, if data.error is present, it should probably take precedence.
             // For safety, if data.error is present, let's return it as an error to the client.
             return res.status(500).json({ error: `Anthropic API reported an error: ${data.error}`, details: data });
        }

        // Ensure supported_models is never sent as an empty array if the primary model is known.
        if (!responsePayload.supported_models || responsePayload.supported_models.length === 0) {
            console.warn("Anthropic API: 'supported_models' was empty after processing, ensuring current model is included.");
            responsePayload.supported_models = [model];
        }
        res.json(responsePayload);

    } catch (error) {
        console.error('Server error (Haji Mix Anthropic API):', error);
        if (tempLocalPath && fs.existsSync(tempLocalPath)) fs.unlink(tempLocalPath, (err) => { if (err) console.error("Error deleting temp file for Claude All Model on server error:", err); });
        return res.status(500).json({ error: 'Server error processing Haji Mix Anthropic API request.' });
    }
});

app.post('/api/all-chatgpt', uploadChatGPTAllModel.single('file'), async (req, res) => {
    const { ask, model, uid, roleplay, max_tokens } = req.body;
    let clientUploadedFileUrl = req.body.img_url; // If client sends a URL directly
    let tempLocalPath = null;
    let publicFileUrl = null;

    if (!ask && !req.file && !clientUploadedFileUrl) return res.status(400).json({ error: '"ask" or file/img_url is required.' });
    if (!uid) return res.status(400).json({ error: '"uid" is required.' });
    if (!model) return res.status(400).json({ error: '"model" is required.' });

    let hajiOpenAiApiUrl = `https://haji-mix-api.gleeze.com/api/openai?uid=${encodeURIComponent(uid)}&model=${encodeURIComponent(model)}&api_key=${CHATGPT_HAJI_MIX_API_KEY}`;
    
    if (req.file) {
        tempLocalPath = req.file.path;
        const APP_BASE_URL = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
        publicFileUrl = new URL(`/uploads/chatgpt_temp/${req.file.filename}`, APP_BASE_URL).toString();
        console.log(`All ChatGPT Models: File temp saved at ${tempLocalPath}, public URL ${publicFileUrl}`);
    } else if (clientUploadedFileUrl) { // If user provided a URL directly
        try {
            const parsedUrl = new URL(clientUploadedFileUrl);
            if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") throw new Error("Invalid file URL protocol.");
            publicFileUrl = clientUploadedFileUrl;
        } catch (e) { 
            if (tempLocalPath) fs.unlinkSync(tempLocalPath); // Clean up if any file was partially processed
            return res.status(400).json({ error: `Invalid img_url: ${e.message}` }); 
        }
    }

    if (ask) hajiOpenAiApiUrl += `&ask=${encodeURIComponent(ask)}`;
    if (publicFileUrl) hajiOpenAiApiUrl += `&img_url=${encodeURIComponent(publicFileUrl)}`;
    if (roleplay) hajiOpenAiApiUrl += `&roleplay=${encodeURIComponent(roleplay)}`;
    if (max_tokens) hajiOpenAiApiUrl += `&max_tokens=${encodeURIComponent(max_tokens)}`;
    hajiOpenAiApiUrl += `&stream=false`;

    try {
        const apiResponse = await fetch(hajiOpenAiApiUrl);
        const responseText = await apiResponse.text();
        if (tempLocalPath) fs.unlink(tempLocalPath, (err) => { if (err) console.error("Error deleting temp file for All ChatGPT Models:", err); });

        if (!apiResponse.ok) {
            let eJson = { error: `Haji Mix OpenAI API Error: ${apiResponse.status} ${apiResponse.statusText}`, details: responseText };
            try {
                const parsedError = JSON.parse(responseText);
                if (parsedError.error) eJson.error = parsedError.error;
                else if (parsedError.message) eJson.error = parsedError.message;
                if (parsedError.details) eJson.details = parsedError.details;
            } catch (c) { /* responseText was not JSON */ }
            console.error("Haji Mix OpenAI API Error:", eJson);
            return res.status(apiResponse.status).json(eJson);
        }

        let data;
        try { data = JSON.parse(responseText); } 
        catch (e) {
            console.warn('Haji Mix OpenAI API response was not JSON, but status was OK. Response text:', responseText);
            // Attempt to send raw text if it seems like a direct answer and not an error structure
            if (typeof responseText === 'string' && responseText.trim().length > 0 && !responseText.toLowerCase().includes('error')) {
                 return res.json({
                    author: model, // Use selected model as author
                    response: responseText, // Send the raw text as response
                    model_used: model,
                    supported_models: [model] // Fallback, actual list might be missing
                });
            }
            return res.status(500).json({ error: 'Failed to parse response from Haji Mix OpenAI API.', details: responseText });
        }
        
        // Construct a consistent response payload
        const responsePayload = {
            user_ask: data.user_ask || ask, // from request if not in response
            model_used: data.model_used || model, // from request if not in response
            answer: data.answer,
            supported_models: Array.isArray(data.supported_models) ? data.supported_models : [],
            // images_processed: data.images_processed // if API returns this
        };
        
        if (data.error && !data.answer) {
             console.warn("Haji Mix OpenAI API returned an error in its payload:", data.error);
        }
        if (responsePayload.supported_models.length === 0) {
             // If API doesn't send back supported_models, we might populate it with the requested model
             // or have a predefined list for known ChatGPT models if the API is inconsistent.
             // For now, if it's empty, the frontend dropdown might just show the currently selected one.
            console.warn("Haji Mix OpenAI API response did not include 'supported_models' or it was empty.");
        }

        res.json(responsePayload);

    } catch (error) {
        console.error('Server error (Haji Mix OpenAI API):', error);
        return res.status(500).json({ error: 'Server error processing Haji Mix OpenAI API request.' });
    }
});


// Fallback to index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
async function startServer() {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

startServer();
