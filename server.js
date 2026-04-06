import express from "express";
import axios from "axios";
import cors from "cors";
import multer from "multer";
import fs from "fs";

const app = express();
app.use(cors());

const upload = multer({ dest: "uploads/" });

// ⚠️ IP de ton PC qui tourne AUTOMATIC1111
const SD_API_URL = "http://127.0.0.1:7860/sdapi/v1/img2img";

function toBase64(path) {
  const file = fs.readFileSync(path);
  return file.toString("base64");
}

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

    fs.unlinkSync(imagePath); // supprimer fichier

    const result = response.data.images[0];

    res.json({
      image: `data:image/png;base64,${result}`
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Erreur IA" });
  }
});

app.listen(3000, "0.0.0.0", () => {
  console.log("🚀 Server running on http://localhost:3000");
});
