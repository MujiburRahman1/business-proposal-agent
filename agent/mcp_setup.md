# MongoDB MCP — DealPilot Setup Guide

## Connected: Official MongoDB MCP + Google ADK Agent

The hackathon-compliant setup lives in `agent/dealpilot/`:

- **Agent:** Google ADK (`google-adk`) — Agent Builder compatible
- **MCP:** Official `mongodb-mcp-server` via `npx` (MongoDB Partner Track)
- **Database:** MongoDB Atlas `proposaldb`

### Start the agent (web UI)

```powershell
cd agent
.\scripts\start_agent.ps1
```

Open http://127.0.0.1:8080 → select **dealpilot** → test:
1. `Find logistics projects in the database`
2. `Save this proposal to MongoDB`
3. `Show me the 3 most recent saved proposals`

### Environment (`agent/dealpilot/.env`)

```env
GOOGLE_GENAI_USE_VERTEXAI=FALSE
GOOGLE_API_KEY=your_key
MDB_MCP_CONNECTION_STRING=mongodb+srv://...
MONGODB_DATABASE=proposaldb
```

---

## Local MCP Server (backend — API wrapper)

The backend also runs a FastMCP server at `backend/mcp_server.py` with these tools:

| Hackathon tool name | MCP function | Purpose |
|---------------------|--------------|---------|
| `find_documents` | `find_documents` | Search `projects` by industry filter |
| `insert_document` | `insert_document` | Save proposal to `proposals` collection |
| `aggregate_documents` | `aggregate_documents` | Project stats and match counts |
| — | `search_similar_projects` | Shortcut: search by industry string |
| — | `save_proposal` | Shortcut: save full proposal |
| — | `list_recent_proposals` | List recent saved proposals |

## Environment variables (`backend/.env`)

```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/proposaldb?appName=Cluster0
MONGODB_DATABASE=proposaldb
```

## Google Cloud Agent Builder — connect MCP

1. Open [Google Cloud Console](https://console.cloud.google.com/) → **Vertex AI** → **Agent Builder**
2. Open your **DealPilot** agent
3. Go to **Tools** → **Add tool** → **MCP Server**
4. Configure:
   - **Partner:** MongoDB
   - **Server name:** DealPilot-MongoDB-MCP
   - **Connection:** Use your deployed MCP endpoint OR MongoDB official MCP from hackathon resources
   - **Auth:** MongoDB Atlas connection string (same as `MONGODB_URI`)

5. Register tools (map to agent):
   - `find_documents` — filter: `{ "industry": "<industry>" }`, limit: 3, collection: `projects`
   - `insert_document` — collection: `proposals`
   - `aggregate_documents` — collection: `projects`

6. Paste system prompt from `agent/system_prompt.md`

## Seed database (first time)

```powershell
cd backend
.\.venv\Scripts\python seed_db.py
```

## Test commands (Agent Builder chat)

1. `Find logistics projects in the database`
2. `Save this proposal to MongoDB`
3. `Show me the 3 most recent saved proposals`

## Test locally (Python)

```powershell
cd backend
.\.venv\Scripts\python scripts\test_mcp.py
```

## Run MCP server standalone (optional)

```powershell
cd backend
.\.venv\Scripts\python mcp_server.py
```
