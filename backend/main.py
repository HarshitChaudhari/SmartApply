from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.jobs import router as jobs_router

app = FastAPI(title="SmartApply API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(jobs_router, prefix="/jobs", tags=["Jobs"])

@app.get("/health")
def health():
    return {"status": "SmartApply backend is running"}