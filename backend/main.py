import json
import os
from typing import Any

import google.generativeai as genai
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from mcp_server import save_proposal, search_similar_projects

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

app = FastAPI(title="DealPilot Production API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TranscriptPayload(BaseModel):
    transcript: str = Field(..., description="Raw discovery call transcript.")


class RequirementsAnalysis(BaseModel):
    raw_analysis: str
    industry: str
    company_size: str
    pain_points: list[str]
    timeline: str
    budget: str


class ProjectReference(BaseModel):
    name: str
    industry: str
    description: str | None = None
    outcome: str | None = None
    budget_range: str | None = None


class DealPilotResponse(BaseModel):
    requirements: RequirementsAnalysis
    similar_projects: list[ProjectReference]
    proposal: str


def _get_model():
    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="Missing GEMINI_API_KEY environment variable.",
        )
    return genai.GenerativeModel(GEMINI_MODEL)


async def run_pipeline(transcript: str) -> DealPilotResponse:
    if not transcript.strip():
        raise HTTPException(status_code=400, detail="Transcript is required")

    analysis_prompt = f"""
    You are an expert business analyst. Analyze this sales discovery call transcript and extract:
    - Industry (e.g., "Logistics", "Retail", "Financial Services")
    - Company Size (e.g., "Mid-market", "Enterprise", "SMB")
    - Pain Points (List of main challenges discussed)
    - Expected Project Timeline
    - Target Budget Information

    TRANSCRIPT:
    \"\"\"{transcript}\"\"\"

    Format your response STRICTLY as a valid JSON object matching this schema:
    {{
       "industry": "string",
       "company_size": "string",
       "pain_points": ["string"],
       "timeline": "string",
       "budget": "string",
       "raw_analysis_summary": "string describing the context"
    }}
    """

    try:
        model = _get_model()
        response = model.generate_content(
            analysis_prompt,
            generation_config={"response_mime_type": "application/json"},
        )
        analysis_data = json.loads(response.text.strip())
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini Analyzer step failed: {str(e)}")

    extracted_industry = analysis_data.get("industry", "Unknown")
    similar_projects: list[ProjectReference] = []

    try:
        mcp_results = search_similar_projects(industry=extracted_industry)
        for proj in mcp_results:
            similar_projects.append(
                ProjectReference(
                    name=proj.get("name", "Unknown"),
                    industry=proj.get("industry", "Unknown"),
                    description=proj.get("description"),
                    outcome=proj.get("outcome"),
                    budget_range=proj.get("budget_range"),
                )
            )
    except Exception as e:
        print(f"[Warning] MongoDB MCP tool connection failed: {e}")

    if similar_projects:
        projects_context = ""
        for idx, project in enumerate(similar_projects):
            projects_context += (
                f"\nCase Study {idx + 1}: {project.name} ({project.industry})\n"
                f"- Description: {project.description}\n"
                f"- Outcome: {project.outcome}\n"
                f"- Budget Range: {project.budget_range}\n"
            )
    else:
        projects_context = "No similar historical projects found."

    proposal_prompt = f"""
    You are an elite enterprise Sales Director. Write a professional, client-ready business proposal.

    CLIENT INSIGHTS:
    - Industry: {analysis_data.get("industry")}
    - Company Size: {analysis_data.get("company_size")}
    - Key Pain Points: {", ".join(analysis_data.get("pain_points", []))}
    - Expected Timeline: {analysis_data.get("timeline")}
    - Allocated Budget: {analysis_data.get("budget")}

    RELEVANT HISTORICAL PERFORMANCE:
    {projects_context}

    Generate a complete business proposal between 800 and 1200 words.
    Use plain text only — no markdown, no ### headers, no ** bold.
    Include these sections with simple labels:
    1. Executive Summary
    2. Deep Dive: Understanding Your Needs
    3. Proposed Solutions Architecture
    4. Relevant Success References
    5. Proposed Project Timeline & Phased Milestones
    6. Alignment on Investment
    7. Next Steps & Actionable Roadmap
    """

    try:
        proposal_response = model.generate_content(proposal_prompt)
        proposal_text = proposal_response.text
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Gemini Proposal Generator failed: {str(e)}"
        )

    return DealPilotResponse(
        requirements=RequirementsAnalysis(
            raw_analysis=analysis_data.get(
                "raw_analysis_summary", "Completed analysis extraction."
            ),
            industry=extracted_industry,
            company_size=analysis_data.get("company_size", "Unknown"),
            pain_points=analysis_data.get("pain_points", []),
            timeline=analysis_data.get("timeline", "Unknown"),
            budget=analysis_data.get("budget", "Unknown"),
        ),
        similar_projects=similar_projects,
        proposal=proposal_text,
    )


@app.get("/health")
async def health():
    return {"status": "ok", "service": "DealPilot"}


@app.post("/proposal")
async def create_proposal_legacy(data: dict):
    """Frontend-compatible endpoint used by Next.js /api/proposal proxy."""
    transcript = data.get("transcript", "")
    result = await run_pipeline(transcript)
    save_result = save_proposal(
        transcript,
        result.requirements.model_dump(),
        result.proposal,
    )
    return {
        "proposal": result.proposal,
        "requirements": result.requirements.model_dump(),
        "similar_projects": [p.model_dump() for p in result.similar_projects],
        "saved_to_mongodb": save_result.get("success", False),
        "mongodb_id": save_result.get("proposal_id"),
    }


@app.post("/api/v1/proposal/generate", response_model=DealPilotResponse)
async def generate_proposal_pipeline(payload: TranscriptPayload):
    return await run_pipeline(payload.transcript)


@app.post("/api/v1/proposal/save")
async def save_proposal_to_db(payload: dict[str, Any]):
    transcript = payload.get("transcript", "")
    requirements = payload.get("requirements", {})
    proposal_text = payload.get("proposal", "")

    if not proposal_text:
        raise HTTPException(status_code=400, detail="Proposal text cannot be empty.")

    result = save_proposal(transcript, requirements, proposal_text)
    if not result.get("success"):
        raise HTTPException(
            status_code=500, detail=result.get("error", "Failed to save proposal")
        )

    return result
