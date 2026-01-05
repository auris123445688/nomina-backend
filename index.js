// index.js
import express from "express";
import cors from "cors";
import axios from "axios";
import PDFDocument from "pdfkit";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config(); // Carga las variables de entorno desde .env

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const GEMINI_KEY ='AIzaSyAxhN2UOxlLIxheggj3pwiInCNp0uBsWsU'

// ================= IA GEMINI =================
app.post("/assistant", async (req, res) => {
  const { question } = req.body;

  if (!question) {
    return res.json({ answer: "❌ Pregunta vacía." });
  }

  try {
    // Llamada a la API de Gemini
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: `
Actúa como experto en nómina y leyes laborales
de la República Dominicana. Responde de manera clara y profesional.

Pregunta del usuario:
${question}
              `,
              },
            ],
          },
        ],
      }
    );

    const answer = response.data.candidates[0].content.parts[0].text;

    // ===== PDF opcional si el usuario lo solicita =====
    let fileUrl = null;
    if (question.toLowerCase().includes("pdf")) {
      const doc = new PDFDocument();
      const fileName = `documento_${Date.now()}.pdf`;
      const filePath = `./${fileName}`;

      doc.pipe(fs.createWriteStream(filePath));
      doc.fontSize(12).text(answer);
      doc.end();

      fileUrl = `${req.protocol}://${req.get("host")}/${fileName}`;
    }

    res.json({ answer, file_url: fileUrl });
  } catch (error) {
    console.error(error);
    res.json({ answer: "❌ Error al conectar con Gemini." });
  }
});

// ===== SERVIR ARCHIVOS ESTÁTICOS (PDFs) =====
app.use(express.static("."));

// ===== LEVANTAR EL SERVIDOR =====
app.listen(PORT, () => {
  console.log(`Backend IA activo en http://localhost:${PORT}`);
});
