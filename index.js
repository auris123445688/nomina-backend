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
const GEMINI_KEY = process.env.GEMINI_KEY; // Usa variable de entorno

// ================= IA GEMINI =================
app.post("/assistant", async (req, res) => {
  const { question } = req.body;

  // Validación de entrada
  if (!question || question.trim().length === 0) {
    return res.status(400).json({
      success: false,
      answer: "Por favor escribe una pregunta válida.",
    });
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

    // Extraer respuesta segura
    const answer =
      response?.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No se pudo generar una respuesta en este momento.";

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

    res.json({ success: true, answer, file_url: fileUrl });
  } catch (error) {
    console.error("Error al conectar con Gemini:", error.message);
    res.status(500).json({
      success: false,
      answer:
        "Hubo un problema al procesar tu solicitud. Intenta nuevamente más tarde.",
    });
  }
});

// ===== SERVIR ARCHIVOS ESTÁTICOS (PDFs) =====
app.use(express.static("."));

// ===== LEVANTAR EL SERVIDOR =====
app.listen(PORT, () => {
  console.log(`✅ Backend IA activo en http://localhost:${PORT}`);
});
