from fastapi import APIRouter, UploadFile, File, Form

router = APIRouter()

MOCK_ANALYSIS = {
    "skills_found": ["Python", "React", "TensorFlow", "FastAPI", "LangChain"],
    "skills_missing": ["MLOps", "Docker", "Kubernetes", "AWS/GCP", "CI/CD"],
    "match_score": 72,
    "interview_questions": [
        "Explain the difference between supervised and unsupervised learning.",
        "How would you deploy a machine learning model to production?",
        "What is transfer learning and when would you use it?",
        "Describe a project where you used computer vision.",
        "How do you handle class imbalance in a dataset?"
    ],
    "roadmap": {
        "30_days": [
            "Learn Docker basics and containerize a Python app",
            "Complete AWS Free Tier - deploy a FastAPI app on EC2",
            "Build a simple MLOps pipeline with MLflow"
        ],
        "60_days": [
            "Learn Kubernetes fundamentals on KodeKloud",
            "Set up CI/CD pipeline with GitHub Actions",
            "Deploy a model on AWS SageMaker"
        ],
        "90_days": [
            "Build an end-to-end ML pipeline with full deployment",
            "Contribute to an open source MLOps project",
            "Add MLOps project to portfolio and LinkedIn"
        ]
    }
}

@router.post("/analyze")
async def analyze_resume(
    file: UploadFile = File(...),
    job_role: str = Form(...)
):
    return {"success": True, "job_role": job_role, "analysis": MOCK_ANALYSIS}