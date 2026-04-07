const express = require("express");
const cors = require("cors");
const puppeteer = require("puppeteer");

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

// ══════════════════════════════════════════════════════════════════════════════
//  BROWSER POOL — un seul navigateur réutilisé
// ══════════════════════════════════════════════════════════════════════════════
let browser = null;

async function getBrowser() {
  if (!browser || !browser.isConnected()) {
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-first-run",
        "--no-zygote",
        "--single-process",
      ],
    });
    console.log("🌐 Browser lancé");
  }
  return browser;
}

// ══════════════════════════════════════════════════════════════════════════════
//  EDIT IMAGE — via Puppeteer qui exécute le vrai WASM de easemate
// ══════════════════════════════════════════════════════════════════════════════
async function editImage(imageUrl, prompt, ratio = "Auto") {
  const br = await getBrowser();
  const page = await br.newPage();

  try {
    // Résultat capturé via interception
    let resolveResult, rejectResult;
    const resultPromise = new Promise((res, rej) => {
      resolveResult = res;
      rejectResult = rej;
      setTimeout(() => rej(new Error("Timeout 120s")), 120000);
    });

    // Intercepter les réponses de query_generate_image
    page.on("response", async (response) => {
      const url = response.url();
      if (url.includes("query_generate_image")) {
        try {
          const json = await response.json();
          if (json?.data?.status === "SUCCESS" && json?.data?.url) {
            resolveResult({
              imageUrl: json.data.url,
              thumbnailUrl: json.data.thumbnail_url,
              taskId: json.data.taskId,
            });
          }
          if (json?.data?.status === "FAILED") {
            rejectResult(new Error("Génération échouée: " + (json.data.msg || "")));
          }
        } catch (e) {}
      }
    });

    // Aller sur la page
    await page.goto("https://www.easemate.ai/nano-banana-ai-image-generator", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    // Fermer le popup de connexion s'il existe
    await page.evaluate(() => {
      const btns = [...document.querySelectorAll("button, [class*='close'], [class*='modal']")];
      btns.forEach(b => {
        if (b.textContent.includes("×") || b.textContent.includes("Close") || 
            b.getAttribute("aria-label")?.includes("close")) {
          b.click();
        }
      });
    });

    await page.waitForTimeout(1000);

    // Injecter l'image via URL dans le champ approprié et exécuter via l'API interne
    const result = await page.evaluate(async ({ imageUrl, prompt, ratio }) => {
      // Utiliser directement les fonctions internes de easemate
      // qui ont déjà le WASM chargé et les vrais headers/sign
      
      // Étape 1: obtenir l'URL d'upload S3
      const uploadRes = await fetch("https://api.easemate.ai/api2/async/query_upload_url", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_type: "jpg", source: "image_generation" })
      }).then(r => r.json()).catch(() => null);

      if (!uploadRes?.data?.upload_url) {
        // Essayer directement avec l'URL externe
        return { step: "upload_failed", raw: uploadRes };
      }

      // Étape 2: upload l'image
      const imgResponse = await fetch(imageUrl);
      const imgBlob = await imgResponse.blob();
      
      await fetch(uploadRes.data.upload_url, {
        method: "PUT",
        body: imgBlob,
        headers: { "Content-Type": "image/jpeg" }
      });

      const s3Key = uploadRes.data.s3_key;

      // Étape 3: créer la tâche
      const createRes = await fetch("https://api.easemate.ai/api2/async/create_generate_image", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model_id: 10041,
          operation_info: { id: 419, operation: "IMAGE_GENERATION" },
          object_info: [{ img_info: { s3_name: s3Key } }],
          parameters: JSON.stringify({ prompt, aspectRatio: ratio, outputFormat: "jpeg" })
        })
      }).then(r => r.json()).catch(e => ({ error: e.message }));

      return { step: "created", taskId: createRes?.data?.taskId, raw: createRes };
    }, { imageUrl, prompt, ratio });

    console.log("[puppeteer] step result:", JSON.stringify(result));

    if (result?.step === "created" && result?.taskId) {
      // Attendre la réponse via l'intercepteur
      return await resultPromise;
    } else {
      throw new Error("Échec: " + JSON.stringify(result));
    }

  } finally {
    await page.close();
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  ENDPOINT /api/img
// ══════════════════════════════════════════════════════════════════════════════
app.all("/api/img", async (req, res) => {
  try {
    const p = req.method === "GET" ? req.query : req.body;
    const { url: imageUrl, prompt, ratio = "Auto" } = p;

    if (!prompt) return res.status(400).json({ error: "Paramètre 'prompt' requis" });
    if (!imageUrl) return res.status(400).json({ error: "Paramètre 'url' requis" });

    console.log(`[request] prompt="${prompt}" url="${imageUrl}"`);
    const result = await editImage(imageUrl, prompt, ratio);

    return res.json({ success: true, ...result });

  } catch (err) {
    console.error("[error]", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
//  INTERFACE DE TEST
// ══════════════════════════════════════════════════════════════════════════════
app.get("/", (req, res) => {
  const host = req.headers.host || "localhost";
  res.send(`<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Nano Banana Image Editor</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:system-ui,sans-serif;background:#0f0f0f;color:#eee;padding:20px}
  h1{text-align:center;font-size:1.8rem;margin-bottom:4px}
  .sub{text-align:center;color:#888;margin-bottom:28px;font-size:.9rem}
  .card{background:#1a1a1a;border-radius:14px;padding:22px;max-width:700px;margin:0 auto 20px}
  label{display:block;margin-bottom:5px;color:#bbb;font-size:.82rem;font-weight:600;text-transform:uppercase;letter-spacing:.5px}
  input,textarea,select{width:100%;padding:10px 13px;border-radius:8px;border:1px solid #2a2a2a;background:#111;color:#eee;font-size:.93rem;margin-bottom:14px;outline:none}
  input:focus,textarea:focus{border-color:#f5c518}
  textarea{resize:vertical;min-height:75px}
  button{width:100%;padding:13px;border-radius:9px;border:none;background:linear-gradient(135deg,#f5c518,#d4a017);color:#000;font-size:1rem;font-weight:700;cursor:pointer}
  button:disabled{opacity:.45;cursor:not-allowed}
  .loading{text-align:center;color:#f5c518;margin-top:14px;display:none}
  .result img{width:100%;border-radius:10px;margin-top:16px;border:2px solid #2a2a2a}
  .dl{display:block;margin-top:10px;text-align:center;color:#f5c518;font-weight:600;text-decoration:none}
  .error{color:#ff6b6b;background:#1e0808;padding:12px;border-radius:8px;margin-top:12px;font-size:.88rem;word-break:break-all}
  .code{background:#111;border:1px solid #2a2a2a;border-radius:8px;padding:13px;font-family:monospace;font-size:.78rem;color:#7ec8e3;word-break:break-all;margin-bottom:12px;line-height:1.7;white-space:pre-wrap}
  .tag{font-size:.75rem;color:#666;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px}
</style>
</head>
<body>
<h1>🍌 Nano Banana</h1>
<p class="sub">Éditeur d'images IA · Sans compte · Sans clé API</p>
<div class="card">
  <p class="tag">🖼 Tester</p>
  <label>URL image source</label>
  <input id="imgUrl" type="url" value="https://iili.io/BAHlZTx.jpg">
  <label>Prompt</label>
  <textarea id="prompt">change the background to a sunny beach, keep the subject intact</textarea>
  <label>Ratio</label>
  <select id="ratio">
    <option value="Auto">Auto</option>
    <option value="1:1">1:1</option>
    <option value="16:9">16:9</option>
    <option value="9:16">9:16</option>
    <option value="3:2">3:2</option>
  </select>
  <button id="btn" onclick="generate()">⚡ Éditer l'image</button>
  <div class="loading" id="loading">⏳ En cours... (15–90s)</div>
  <div id="result"></div>
</div>
<div class="card">
  <p class="tag">📡 API</p>
  <label>GET</label>
  <div class="code">GET https://${host}/api/img?url=https://image.jpg&prompt=change background&ratio=Auto</div>
  <label>POST</label>
  <div class="code">POST https://${host}/api/img
{"url":"https://image.jpg","prompt":"change background","ratio":"Auto"}</div>
  <label>Réponse</label>
  <div class="code">{"success":true,"imageUrl":"https://d1ptb5b3fy36g3.cloudfront.net/..."}</div>
</div>
<script>
async function generate(){
  const url=document.getElementById('imgUrl').value.trim();
  const prompt=document.getElementById('prompt').value.trim();
  const ratio=document.getElementById('ratio').value;
  const btn=document.getElementById('btn');
  const loading=document.getElementById('loading');
  const result=document.getElementById('result');
  if(!url||!prompt){alert('URL et prompt requis!');return;}
  btn.disabled=true;loading.style.display='block';result.innerHTML='';
  try{
    const r=await fetch('/api/img',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url,prompt,ratio})});
    const data=await r.json();
    if(data.success&&data.imageUrl){
      result.innerHTML='<img src="'+data.imageUrl+'"><a class="dl" href="'+data.imageUrl+'" target="_blank">⬇ Télécharger</a>';
    }else{
      result.innerHTML='<div class="error">❌ '+(data.error||JSON.stringify(data))+'</div>';
    }
  }catch(e){result.innerHTML='<div class="error">❌ '+e.message+'</div>';}
  finally{btn.disabled=false;loading.style.display='none';}
}
</script>
</body>
</html>`);
});

// Initialiser le browser au démarrage
getBrowser().then(() => {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log("🍌 Nano Banana API — port " + PORT));
}).catch(err => {
  console.error("Erreur lancement browser:", err);
  process.exit(1);
});
