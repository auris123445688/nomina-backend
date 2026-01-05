import express from "express";
import cors from "cors";
import axios from "axios";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config(); // ✅ Lee las variables de .env

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const GEMINI_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_KEY) {
  console.error("❌ GEMINI_API_KEY no definida en .env");
  process.exit(1);
}

// ================= RUTA DEL ASISTENTE =================
app.post("/assistant", async (req, res) => {
  const { action } = req.body;

  if (!action || action.trim() === "") {
    return res.json({ answer: "Consulta vacía." });
  }

  try {
    // === LLAMADO A GEMINI ===
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: `Actúa como experto en nómina y leyes laborales de la República Dominicana.\n\n${action}`,
              },
            ],
          },
        ],
      }
    );

    const answer =
      response?.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No se pudo generar respuesta de Gemini.";

    let fileUrl = null;

    // === GENERAR PDF SI SE SOLICITA ===
    if (action.toLowerCase().includes("pdf")) {
      const doc = new PDFDocument();
      const fileName = `documento_${Date.now()}.pdf`;
      const filePath = path.join(".", fileName);

      doc.pipe(fs.createWriteStream(filePath));
      doc.fontSize(12).text(answer);
      doc.end();

      // URL accesible desde frontend
      fileUrl = `${req.protocol}://${req.get("host")}/${fileName}`;
    }

    res.json({ answer, file_url: fileUrl });
  } catch (error) {
    console.error("Error al conectar con Gemini:", error.message);
    res.status(500).json({ answer: "❌ Error al conectar con Gemini." });
  }
});

// ===== Servir archivos estáticos (PDFs) =====
app.use(express.static("."));

// ===== INICIO DEL SERVIDOR =====
app.listen(PORT, () =>
  console.log(`Backend IA activo en puerto ${PORT}`)
);
