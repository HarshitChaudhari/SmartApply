from langchain_tavily import TavilySearch
from langchain_groq import ChatGroq
from langgraph.prebuilt import create_react_agent
import os
from dotenv import load_dotenv

load_dotenv()

def get_llm():
    return ChatGroq(
        model="llama-3.3-70b-versatile",
        api_key=os.getenv("GROQ_API_KEY"),
    )

def get_job_finder_agent():
    llm = get_llm()
    tools = [TavilySearch(max_results=5)]
    agent = create_react_agent(llm, tools)
    return agent