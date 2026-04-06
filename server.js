import express from "express";
import axios from "axios";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(cors());

// 📁 gestion des chemins (IMPORTANT pour Render)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 📂 servir les fichiers statiques (index.html)
app.use(express.static(__dirname));

// 📦 upload config
const upload = multer({ dest: "uploads/" });

// ⚠️ METS ICI TON URL NGROK OU TON PC
const SD_API_URL = "http://127.0.0.1:7860/sdapi/v1/img2img";

// 🔁 convertir image → base64
function toBase64(pathFile) {
  const file = fs.readFileSync(pathFile);
  return file.toString("base64");
}

// 🧠 ROUTE IA
app.post("/edit", upload.single("image"), async (req, res) => {
  try {
    const prompt = req.body.prompt;
    const imagePath = req.file.path;

    const base64Image = toBase64(imagePath);

    const response = await axios.post(SD_API_URL, {
      init_images: [base64Image],
      prompt: prompt,
      denoising_strength: 0.7,
      steps: 20
    });

    // 🧹 supprimer fichier temporaire
    fs.unlinkSync(imagePath);

    const result = response.data.images[0];

    res.json({
      image: `data:image/png;base64,${result}`
    });

  } catch (err) {
    console.error("❌ ERREUR:", err.message);
    res.status(500).json({
      error: "Erreur IA",
      details: err.message
    });
  }
});

// 🔥 PORT dynamique (Render obligatoire)
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
