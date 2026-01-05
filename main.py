from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import os
import requests
import json
import datetime

app = FastAPI()

# Permitir peticiones desde cualquier origen (para desarrollo)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================= MODELO DE ENTRADA =================
class UserInput(BaseModel):
    user_id: int
    action: str  # o 'question' si quieres

# ================= VARIABLES DE ENTORNO ==============
GEMINI_KEY = os.environ.get("AIzaSyAxhN2UOxlLIxheggj3pwiInCNp0uBsWsU")  # 🌟 Desde Render o tu entorno local

# ================= ENDPOINT ==========================
@app.post("/assistant/")
async def assistant(input_data: UserInput):
    question = input_data.action
    if not question:
        return {"answer": "Pregunta vacía."}

    try:
        # Llamada a Gemini API
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={GEMINI_KEY}"
        payload = {
            "contents": [
                {
                    "parts": [
                        {
                            "text": f"""
Actúa como experto en nómina y leyes laborales
de la República Dominicana.

{question}
"""
                        }
                    ]
                }
            ]
        }

        response = requests.post(url, headers={"Content-Type": "application/json"}, data=json.dumps(payload))
        data = response.json()
        answer = data["candidates"][0]["content"]["parts"][0]["text"]

        # ===== Opcional: generar PDF si la pregunta menciona 'pdf' =====
        file_url = None
        if "pdf" in question.lower():
            from fpdf import FPDF
            pdf = FPDF()
            pdf.add_page()
            pdf.set_font("Arial", size=12)
            pdf.multi_cell(0, 10, answer)
            file_name = f"documento_{datetime.datetime.now().timestamp()}.pdf"
            pdf.output(file_name)
            file_url = f"/{file_name}"

        return {"answer": answer, "file_url": file_url}

    except Exception as e:
        print(e)
        return {"answer": "❌ Error al conectar con Gemini."}
