from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class JobSearchRequest(BaseModel):
    query: str

MOCK_JOBS = [
    {
        "title": "Computer Vision Intern",
        "company": "TCS Research",
        "location": "Pune, India",
        "type": "Internship",
        "link": "https://careers.tcs.com",
        "description": "Work on real-time object detection and image segmentation using PyTorch and OpenCV."
    },
    {
        "title": "ML Engineer Intern",
        "company": "Wipro AI Labs",
        "location": "Bangalore, India",
        "type": "Internship",
        "link": "https://careers.wipro.com",
        "description": "Build and deploy machine learning models for computer vision applications."
    },
    {
        "title": "AI Research Intern",
        "company": "Samsung R&D",
        "location": "Noida, India",
        "type": "Internship",
        "link": "https://samsung.com/careers",
        "description": "Research on deep learning models for image recognition and video analytics."
    },
    {
        "title": "Computer Vision Engineer Intern",
        "company": "Ola Electric",
        "location": "Bangalore, India",
        "type": "Internship",
        "link": "https://olaelectric.com/careers",
        "description": "Develop vision systems for autonomous vehicle perception pipeline."
    },
    {
        "title": "Deep Learning Intern",
        "company": "Mu Sigma",
        "location": "Bangalore, India",
        "type": "Internship",
        "link": "https://musigma.com/careers",
        "description": "Apply CNNs and transformers for visual data analysis and pattern recognition."
    }
]

@router.post("/search")
async def search_jobs(request: JobSearchRequest):
    return {"success": True, "jobs": MOCK_JOBS, "query": request.query}