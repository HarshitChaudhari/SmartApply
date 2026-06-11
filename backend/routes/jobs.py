from fastapi import APIRouter
from pydantic import BaseModel
from agents.job_finder import get_job_finder_agent

router = APIRouter()

class JobSearchRequest(BaseModel):
    query: str

@router.post("/search")
async def search_jobs(request: JobSearchRequest):
    try:
        agent = get_job_finder_agent()
        result = agent.invoke({
            "messages": [{
                "role": "user",
                "content": f"""Search for real job listings for: {request.query}
                
For each job found return exactly this format:
- Title: job title
- Company: company name  
- Location: city, country
- Type: Full-time/Internship/Contract
- Link: application URL
- Description: one sentence about the role

Find at least 4-5 real jobs."""
            }]
        })
        print("=== FULL RESULT ===")
        print(result)
        messages = result.get("messages", [])
        print(f"=== MESSAGE COUNT: {len(messages)} ===")
        for i, msg in enumerate(messages):
            print(f"MSG {i} type={type(msg).__name__} content={str(msg.content)[:300]}")
        
        final = messages[-1].content if messages else "No results found"
        print(f"=== FINAL: {final[:300]} ===")
        return {"success": True, "result": final}
    except Exception as e:
        print(f"=== ERROR: {e} ===")
        return {"success": False, "error": str(e)}