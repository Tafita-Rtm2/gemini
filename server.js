const express = require("express");
const axios = require("axios");
const cors = require("cors");
const crypto = require("crypto");

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

const API_BASE = "https://api.easemate.ai";
const MODEL_ID = 10041;
const OPERATION_ID = 419;

// ══════════════════════════════════════════════════════════════════════════════
//  SIGN — formule extraite du JS de easemate
//  qd(body, secret) = MD5(sort({...body_keys, key:secret}).join("name=value"))
//  Le secret vient du WASM — on l'extrait via la Console Kiwi
//  Pour l'API image, le sign est calculé sur le body
// ══════════════════════════════════════════════════════════════════════════════

// Génère un nonce aléatoire (20 chars)
function randomNonce(len = 20) {
  return crypto.randomBytes(len).toString("base64").replace(/[^a-z0-9]/gi, "").substring(0, len);
}

// Génère un Device-ID aléatoire (hex 32 chars) — rend chaque appel unique
function randomDeviceId() {
  return crypto.randomBytes(16).toString("hex");
}

// Génère un Identity-Id aléatoire (hex 64 chars)
function randomIdentityId() {
  return crypto.randomBytes(32).toString("hex");
}

// Formule Sign extraite du JS easemate :
// sort tous les champs du body + "key"=secret, join "k=v", MD5
function makeSign(bodyObj, timestamp) {
  // Le WASM reçoit le body et produit sign+timestamp
  // On reconstitue la formule : params du body + timestamp + key
  const entries = [];

  // Aplatir le body en paires clé=valeur simples (1 niveau)
  for (const [k, v] of Object.entries(bodyObj || {})) {
    const val = typeof v === "object" ? JSON.stringify(v) : String(v);
    entries.push({ name: k, value: val });
  }

  // Ajouter timestamp et la clé secrète trouvée dans le JS
  entries.push({ name: "timestamp", value: String(timestamp) });
  entries.push({ name: "key", value: "e84yr70o0a5n08f5" });

  // Trier par nom, joindre, MD5
  const str = entries
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(e => `${e.name}=${e.value}`)
    .join("");

  return crypto.createHash("md5").update(str).digest("hex");
}

// ══════════════════════════════════════════════════════════════════════════════
//  HEADERS — randomisés à chaque appel pour rester illimité
// ══════════════════════════════════════════════════════════════════════════════
function buildHeaders(bodyObj) {
  const timestamp = Math.floor(Date.now() / 1000); // secondes comme dans le JS
  const deviceId = randomDeviceId();
  const identityId = randomIdentityId();
  const sign = makeSign(bodyObj, timestamp);

  return {
    headers: {
      "Accept":             "application/json",
      "Accept-Encoding":    "gzip, deflate, br",
      "Accept-Language":    "en-US,en;q=0.9",
      "Client-Name":        "chatpdf",
      "Client-Type":        "web",
      "Content-Type":       "application/json;charset=UTF-8",
      "Device-Identifier":  deviceId,
      "Device-Platform":    "Android,Chrome",
      "Device-Type":        "web",
      "Device-Uuid":        deviceId,
      "Identity-Id":        identityId,
      "Lang":               "en",
      "Language":           "en-US",
      "Origin":             "https://www.easemate.ai",
      "Product-Code":       "888",
      "Referer":            "https://www.easemate.ai/",
      "Sec-Ch-Ua":          '"Chromium";v="139", "Not;A=Brand";v="99"',
      "Sec-Ch-Ua-Mobile":   "?1",
      "Sec-Ch-Ua-Platform": '"Android"',
      "Sec-Fetch-Dest":     "empty",
      "Sec-Fetch-Mode":     "cors",
      "Sec-Fetch-Site":     "same-site",
      "Sign":               sign,
      "Site":               "www.easemate.ai",
      "Timestamp":          String(timestamp),
      "User-Agent":         "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36",
    },
    meta: { deviceId, identityId, sign, timestamp }
  };
}

// ══════════════════════════════════════════════════════════════════════════════
//  POLLING
// ══════════════════════════════════════════════════════════════════════════════
async function pollResult(taskId, maxTries = 30) {
  for (let i = 0; i < maxTries; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const queryBody = { taskId, task_type: MODEL_ID };
    const { headers } = buildHeaders(queryBody);
    try {
      const res = await axios.post(
        `${API_BASE}/api2/async/query_generate_image`,
        queryBody,
        { headers, timeout: 15000, decompress: true }
      );
      const d = res.data;
      console.log(`[poll ${i+1}] status:`, d?.data?.status);
      if (d?.code === 200 && d?.data?.status === "SUCCESS") return d.data;
      if (d?.data?.status === "FAILED") throw new Error("Génération échouée: " + (d?.data?.msg || ""));
    } catch (e) {
      if (e.message.includes("échouée")) throw e;
      console.log(`[poll ${i+1}] erreur:`, e.message);
    }
  }
  throw new Error("Timeout après 60s");
}

// ══════════════════════════════════════════════════════════════════════════════
//  ENDPOINT /api/img
//  GET  ?url=...&prompt=...&ratio=1:1
//  POST { url, prompt, ratio }
// ══════════════════════════════════════════════════════════════════════════════
app.all("/api/img", async (req, res) => {
  try {
    const p = req.method === "GET" ? req.query : req.body;
    const { url: imageUrl, prompt, ratio = "1:1" } = p;

    if (!prompt) return res.status(400).json({ error: "Paramètre 'prompt' requis" });
    if (!imageUrl) return res.status(400).json({ error: "Paramètre 'url' requis" });

    const body = {
      model_id: MODEL_ID,
      operation_info: { id: OPERATION_ID, operation: "IMAGE_GENERATION" },
      object_info: [{ url: imageUrl }],
      parameters: JSON.stringify({ prompt, aspectRatio: ratio, outputFormat: "jpeg" })
    };

    const { headers, meta } = buildHeaders(body);
    console.log(`[create] sign=${meta.sign} ts=${meta.timestamp} device=${meta.deviceId.substring(0,8)}...`);

    const createRes = await axios.post(
      `${API_BASE}/api2/async/create_generate_image`,
      body,
      { headers, timeout: 30000, decompress: true }
    );

    console.log(`[create] response:`, JSON.stringify(createRes.data));

    const taskId = createRes.data?.data?.taskId;
    if (!taskId) return res.status(500).json({ error: "Pas de taskId", raw: createRes.data });

    const result = await pollResult(taskId);

    return res.json({
      success: true,
      imageUrl: result.url,
      thumbnailUrl: result.thumbnail_url,
      taskId: result.taskId,
    });

  } catch (err) {
    console.error("[error]", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
//  INTERFACE DE TEST
// ══════════════════════════════════════════════════════════════════════════════
app.get("/", (req, res) => {
  const host = req.headers.host || "localhost:3000";
  res.send(`<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Nano Banana Image Editor</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:system-ui,sans-serif;background:#0f0f0f;color:#eee;padding:20px;min-height:100vh}
  h1{text-align:center;font-size:1.8rem;margin-bottom:4px}
  .sub{text-align:center;color:#888;margin-bottom:28px;font-size:.9rem}
  .card{background:#1a1a1a;border-radius:14px;padding:22px;max-width:700px;margin:0 auto 20px}
  label{display:block;margin-bottom:5px;color:#bbb;font-size:.82rem;font-weight:600;text-transform:uppercase;letter-spacing:.5px}
  input,textarea,select{width:100%;padding:10px 13px;border-radius:8px;border:1px solid #2a2a2a;background:#111;color:#eee;font-size:.93rem;margin-bottom:14px;outline:none;transition:border .2s}
  input:focus,textarea:focus{border-color:#f5c518}
  textarea{resize:vertical;min-height:75px}
  button{width:100%;padding:13px;border-radius:9px;border:none;background:linear-gradient(135deg,#f5c518,#d4a017);color:#000;font-size:1rem;font-weight:700;cursor:pointer;transition:opacity .2s}
  button:hover{opacity:.88} button:disabled{opacity:.45;cursor:not-allowed}
  .loading{text-align:center;color:#f5c518;margin-top:14px;font-size:.92rem;display:none}
  .result{margin-top:18px}
  .result img{width:100%;border-radius:10px;border:2px solid #2a2a2a}
  .dl{display:block;margin-top:10px;text-align:center;color:#f5c518;font-weight:600;text-decoration:none}
  .error{color:#ff6b6b;background:#1e0808;padding:12px;border-radius:8px;margin-top:12px;font-size:.88rem;word-break:break-all}
  .code{background:#111;border:1px solid #2a2a2a;border-radius:8px;padding:13px;font-family:monospace;font-size:.78rem;color:#7ec8e3;word-break:break-all;margin-bottom:12px;line-height:1.7;white-space:pre-wrap}
  .tag{font-size:.75rem;color:#666;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px}
  .badge{display:inline-block;background:#1e3a1e;color:#4caf50;font-size:.75rem;padding:3px 8px;border-radius:20px;margin-bottom:16px}
</style>
</head>
<body>
<h1>🍌 Nano Banana</h1>
<p class="sub">Éditeur d'images IA · Sans compte · Sans clé API · Illimité</p>

<div class="card">
  <span class="badge">✅ Chaque requête = identité unique</span>
  <p class="tag">🖼 Tester l'éditeur</p>
  <label>URL de l'image source</label>
  <input id="imgUrl" type="url" placeholder="https://exemple.com/photo.jpg" value="https://iili.io/BAHlZTx.jpg">
  <label>Prompt — instruction d'édition</label>
  <textarea id="prompt">change the background to a sunny beach, keep the subject intact</textarea>
  <label>Ratio de sortie</label>
  <select id="ratio">
    <option value="1:1">1:1 — Carré</option>
    <option value="16:9">16:9 — Paysage</option>
    <option value="9:16">9:16 — Portrait</option>
    <option value="3:2">3:2</option>
    <option value="2:3">2:3</option>
  </select>
  <button id="btn" onclick="generate()">⚡ Éditer l'image</button>
  <div class="loading" id="loading">⏳ En cours... peut prendre 15–60s</div>
  <div class="result" id="result"></div>
</div>

<div class="card">
  <p class="tag">📡 API — Intégration</p>
  <label>GET (simple)</label>
  <div class="code">GET https://${host}/api/img?url=https://votre-image.jpg&prompt=change background to beach&ratio=1:1</div>
  <label>POST (JSON)</label>
  <div class="code">POST https://${host}/api/img
Content-Type: application/json

{
  "url": "https://votre-image.jpg",
  "prompt": "change the background to a beach",
  "ratio": "1:1"
}</div>
  <label>Réponse JSON</label>
  <div class="code">{
  "success": true,
  "imageUrl": "https://d1ptb5b3fy36g3.cloudfront.net/...",
  "thumbnailUrl": "https://...",
  "taskId": "..."
}</div>
</div>

<script>
async function generate() {
  const url = document.getElementById('imgUrl').value.trim();
  const prompt = document.getElementById('prompt').value.trim();
  const ratio = document.getElementById('ratio').value;
  const btn = document.getElementById('btn');
  const loading = document.getElementById('loading');
  const result = document.getElementById('result');
  if (!url || !prompt) { alert('URL et prompt requis !'); return; }
  btn.disabled = true; loading.style.display = 'block'; result.innerHTML = '';
  try {
    const r = await fetch('/api/img', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ url, prompt, ratio })
    });
    const data = await r.json();
    if (data.success && data.imageUrl) {
      result.innerHTML = '<img src="'+data.imageUrl+'" alt="Résultat"><a class="dl" href="'+data.imageUrl+'" target="_blank" download>⬇ Télécharger</a>';
    } else {
      result.innerHTML = '<div class="error">❌ '+(data.error||JSON.stringify(data))+'</div>';
    }
  } catch(e) {
    result.innerHTML = '<div class="error">❌ Erreur : '+e.message+'</div>';
  } finally {
    btn.disabled = false; loading.style.display = 'none';
  }
}
</script>
</body>
</html>`);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("🍌 Nano Banana API — port " + PORT));
