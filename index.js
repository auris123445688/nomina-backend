import express from "express";
import cors from "cors";
import axios from "axios";
import PDFDocument from "pdfkit";
import fs from "fs";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const GEMINI_KEY = process.env.GEMINI_API_KEY;AIzaSyAxhN2UOxlLIxheggj3pwiInCNp0uBsWsU

// ================= IA GEMINI =================
app.post("/assistant", async (req, res) => {
  const { question } = req.body;

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${AIzaSyAxhN2UOxlLIxheggj3pwiInCNp0uBsWsU}`,
      {
        contents: [{
          parts: [{
            text: `
Actúa como experto en nómina y leyes laborales
de la República Dominicana. Sé profesional.

${question}
`
          }]
        }]
      }
    );

    const answer =
      response.data.candidates[0].content.parts[0].text;

    // ===== GENERAR PDF SI SE PIDE =====
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
  } catch {
    res.json({ answer: "Error con la IA." });
  }
});

// ===== SERVIR PDFs =====
app.use(express.static("."));

app.listen(PORT, () =>
  console.log("Backend IA activo")
);

