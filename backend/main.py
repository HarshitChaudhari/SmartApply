from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.jobs import router as jobs_router
from routes.career import router as career_router

app = FastAPI(title="SmartApply API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://smart-apply-kohl.vercel.app",
        "https://*.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(jobs_router, prefix="/jobs", tags=["Jobs"])
app.include_router(career_router, prefix="/career", tags=["Career"])

@app.get("/health")
def health():
    return {"status": "SmartApply backend is running"}