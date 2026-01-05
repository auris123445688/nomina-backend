import express from "express";
import cors from "cors";
import axios from "axios";
import PDFDocument from "pdfkit";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// ===============================
// ENDPOINT PRINCIPAL DEL ASISTENTE
// ===============================
app.post("/assistant", async (req, res) => {
  const { question } = req.body;

  if (!question) {
    return res.status(400).json({
      answer: "Pregunta vacía.",
    });
  }

  try {
    // 👉 RESPUESTA SIMULADA (LUEGO CONECTAMOS IA REAL)
    let answer = "";

    if (question.toLowerCase().includes("carta laboral")) {
      answer =
        "He generado tu carta laboral correctamente. Puedes descargarla abajo.";
      
      const pdf = new PDFDocument();
      const chunks = [];

      pdf.on("data", (chunk) => chunks.push(chunk));
      pdf.on("end", () => {
        const result = Buffer.concat(chunks);

        res.json({
          answer,
          file_url:
            "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        });
      });

      pdf.fontSize(18).text("CARTA LABORAL", { align: "center" });
      pdf.moveDown();
      pdf.fontSize(12).text(
        "Certificamos que el señor/a __________________ labora en nuestra empresa desde _______."
      );
      pdf.end();
    } else {
      answer =
        "Soy tu asistente de nómina y RRHH. Puedo ayudarte con cartas laborales, cálculos de nómina y consultas legales.";
      res.json({ answer });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      answer: "Error interno del servidor.",
    });
  }
});

// ===============================
// ENDPOINT DE PRUEBA
// ===============================
app.get("/", (req, res) => {
  res.send("Backend Nómina funcionando correctamente 🚀");
});

app.listen(PORT, () => {
  console.log(`Servidor activo en puerto ${PORT}`);
});
