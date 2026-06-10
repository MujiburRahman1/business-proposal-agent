import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from google.adk.agents import Agent
from google.adk.tools.mcp_tool import McpToolset
from google.adk.tools.mcp_tool.mcp_session_manager import StdioConnectionParams
from mcp import StdioServerParameters

load_dotenv(Path(__file__).parent / ".env")

ROOT_DIR = Path(__file__).resolve().parents[2]
MCP_PYTHON = ROOT_DIR / "backend" / ".venv" / "Scripts" / "python.exe"
MCP_SCRIPT = ROOT_DIR / "backend" / "mcp_server.py"

MONGODB_URI = os.getenv("MDB_MCP_CONNECTION_STRING") or os.getenv("MONGODB_URI", "")
DB_NAME = os.getenv("MONGODB_DATABASE", "proposaldb")

if not MCP_PYTHON.exists():
    MCP_PYTHON = Path(sys.executable)

DEALPILOT_INSTRUCTION = f"""
You are DealPilot, an autonomous AI sales agent that turns discovery call transcripts
into winning business proposals.

Database: MongoDB Atlas
Database name: {DB_NAME}
Collections:
- projects: past case studies (name, industry, description, outcome, budget_range)
- proposals: saved generated proposals

You MUST run a transparent 3-step pipeline. Announce each step before executing it.

STEP 1 — ANALYZER
Parse the user's discovery call transcript. Extract:
industry, company_size, pain_points (array), timeline, budget.
Return structured JSON with these fields.

STEP 2 — RESEARCHER (MongoDB MCP tools)
Use `search_similar_projects` with the industry from Step 1, or `find_documents`
with filter {{"industry": "<industry>"}} on collection "projects".
If MongoDB fails or returns no matches, write "No similar projects found" and
STILL continue to Step 3. Never stop the pipeline because of database errors.
Never fabricate case studies.

STEP 3 — PROPOSAL GENERATOR
Write an 800-1200 word professional proposal in plain text only.
Do not use markdown, ### headers, or ** bold formatting.
Include these sections with simple labels:
1. Executive Summary
2. Understanding of Client Needs
3. Proposed Solution Architecture
4. Relevant Case Studies (from Step 2)
5. Timeline and Milestones
6. Investment Alignment
7. Next Steps

Present results in three clearly labeled sections:
### STEP 1: REQUIREMENTS ANALYSIS
### STEP 2: SIMILAR HISTORICAL PROJECTS
### STEP 3: GENERATED PROPOSAL

When running from the frontend pipeline, proposals are auto-saved by the API.
Only use MongoDB MCP `insert-many` on collection "proposals" when the user
explicitly asks to save a proposal in chat.

Test commands you must handle:
- "Find logistics projects in the database"
- "Save this proposal to MongoDB"
- "Show me the 3 most recent saved proposals" (use find on proposals, sort by created_at)
"""

root_agent = Agent(
    model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
    name="dealpilot",
    instruction=DEALPILOT_INSTRUCTION,
    tools=[
        McpToolset(
            connection_params=StdioConnectionParams(
                server_params=StdioServerParameters(
                    command=str(MCP_PYTHON),
                    args=[str(MCP_SCRIPT)],
                    env={
                        "MONGODB_URI": MONGODB_URI,
                        "MONGODB_DATABASE": DB_NAME,
                    },
                ),
                timeout=60,
            ),
        )
    ],
)
