import express from "express";
import cors from "cors";
import axios from "axios";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

const app = express();
app.use(cors());
app.use(express.json());

// Puerto
const PORT = process.env.PORT || 3000;

// Gemini API Key desde variable de entorno
const GEMINI_KEY = process.env.GEMINI_API_KEY;

// Endpoint del asistente
app.post("/assistant", async (req, res) => {
  console.log("Request body:", req.body);

  const { question, user_id } = req.body;

  if (!question) {
    return res.json({ answer: "Pregunta vacía." });
  }

  try {
    // Llamada a Gemini
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: `
Actúa como un asistente profesional de nómina y RRHH
especializado EXCLUSIVAMENTE en la República Dominicana.

Usuario (${user_id}):
${question}
`
              }
            ]
          }
        ]
      }
    );

    const answer = response.data.candidates[0].content.parts[0].text;

    // ===== Generar PDF si se solicita =====
    let fileUrl = null;
    if (question.toLowerCase().includes("pdf")) {
      const doc = new PDFDocument();
      const fileName = `documento_${Date.now()}.pdf`;
      const filePath = path.join(__dirname, fileName);

      doc.pipe(fs.createWriteStream(filePath));
      doc.fontSize(12).text(answer);
      doc.end();

      fileUrl = `${req.protocol}://${req.get("host")}/${fileName}`;
    }

    res.json({ answer, file_url: fileUrl });
  } catch (e) {
    console.error("Error Gemini:", e.message);
    res.json({ answer: "❌ Error al conectar con Gemini." });
  }
});

// Servir archivos estáticos (PDFs)
app.use(express.static(__dirname));

app.listen(PORT, () => console.log(`Backend IA activo en puerto ${PORT}`));
