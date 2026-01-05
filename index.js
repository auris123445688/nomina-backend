import express from "express";
import cors from "cors";
import axios from "axios";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const GEMINI_KEY = process.env.GEMINI_API_KEY; // ✅ Solo desde variables de entorno

if (!GEMINI_KEY) {
  console.error("❌ Error: GEMINI_API_KEY no definido en variables de entorno");
  process.exit(1);
}

// ================= IA GEMINI =================
app.post("/assistant", async (req, res) => {
  const { question } = req.body;

  if (!question) {
    return res.json({ answer: "Pregunta vacía." });
  }

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: `
Actúa como experto en nómina y leyes laborales de la República Dominicana.
Responde de manera clara, profesional y concreta.

Pregunta del usuario:
"${question}"
`
              }
            ]
          }
        ]
      }
    );

    const answer =
      response.data.candidates[0].content.parts[0].text || 
      "No se pudo generar una respuesta.";

    // ===== PDF SI SE SOLICITA =====
    let fileUrl = null;
    if (question.toLowerCase().includes("pdf")) {
      const doc = new PDFDocument();
      const fileName = `documento_${Date.now()}.pdf`;
      const filePath = path.join(process.cwd(), fileName);

      doc.pipe(fs.createWriteStream(filePath));
      doc.fontSize(12).text(answer);
      doc.end();

      fileUrl = `${req.protocol}://${req.get("host")}/${fileName}`;
    }

    res.json({ answer, file_url: fileUrl });
  } catch (error) {
    console.error("Error Gemini:", error.message);
    res.json({ answer: "❌ Error al conectar con Gemini." });
  }
});

// ===== SERVIR ARCHIVOS =====
app.use(express.static(process.cwd()));

app.listen(PORT, () => {
  console.log(`✅ Backend IA activo en puerto ${PORT}`);
});
