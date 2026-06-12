from fastapi import APIRouter, UploadFile, File, Form
from langchain_groq import ChatGroq
import pymupdf
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

def get_llm():
    return ChatGroq(
        model="llama-3.3-70b-versatile",
        api_key=os.getenv("GROQ_API_KEY"),
    )

def extract_text(file_bytes: bytes) -> str:
    doc = pymupdf.open(stream=file_bytes, filetype="pdf")
    return " ".join(page.get_text() for page in doc)

@router.post("/analyze")
async def analyze_resume(
    file: UploadFile = File(...),
    job_role: str = Form(...)
):
    try:
        file_bytes = await file.read()
        resume_text = extract_text(file_bytes)

        llm = get_llm()

        prompt = f"""You are a career coach. Analyze this resume for the role: {job_role}

Resume:
{resume_text[:3000]}

Respond in this exact JSON format with no extra text:
{{
  "skills_found": ["skill1", "skill2", "skill3"],
  "skills_missing": ["skill1", "skill2", "skill3"],
  "skills_found and skills_missing must be SHORT skill names only (max 3 words each). Examples: Python, React, Docker, AWS. Never write sentences in skills.",
  "match_score": 75,
  "interview_questions": [
    "question 1",
    "question 2",
    "question 3",
    "question 4",
    "question 5"
  ],
  "roadmap": {{
    "30_days": ["task1", "task2", "task3"],
    "60_days": ["task1", "task2", "task3"],
    "90_days": ["task1", "task2", "task3"]
  }}
}}"""

        response = llm.invoke(prompt)
        import json
        text = response.content.strip()
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()

        analysis = json.loads(text)
        return {"success": True, "analysis": analysis}

    except Exception as e:
        return {"success": False, "error": str(e)}