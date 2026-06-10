import json
import urllib.request

TRANSCRIPT = """Client: We are a mid-size logistics company struggling with manual route planning.
Rep: How many drivers do you manage?
Client: About 120 across three regions. Budget is roughly 80-100k for phase one."""

req = urllib.request.Request(
    "http://127.0.0.1:8080/apps/dealpilot/users/web-user/sessions",
    data=b"{}",
    headers={"Content-Type": "application/json"},
    method="POST",
)
session = json.load(urllib.request.urlopen(req))
sid = session["id"]

prompt = f"""Run your full 3-step DealPilot pipeline on this discovery call transcript.
Return clearly labeled sections: STEP 1 REQUIREMENTS (as JSON), STEP 2 SIMILAR PROJECTS, STEP 3 PROPOSAL.

TRANSCRIPT:
{TRANSCRIPT}"""

body = json.dumps(
    {
        "app_name": "dealpilot",
        "user_id": "web-user",
        "session_id": sid,
        "new_message": {"role": "user", "parts": [{"text": prompt}]},
    }
).encode()

req2 = urllib.request.Request(
    "http://127.0.0.1:8080/run",
    data=body,
    headers={"Content-Type": "application/json"},
    method="POST",
)
events = json.load(urllib.request.urlopen(req2, timeout=300))
print("events:", len(events))
for i, ev in enumerate(events):
    author = ev.get("author", "?")
    parts = ev.get("content", {}).get("parts", [])
    for part in parts:
        if "text" in part:
            text = part["text"]
            print(f"--- event {i} {author} text len={len(text)} ---")
            print(text[:1200])
        if "functionCall" in part:
            print(f"--- event {i} tool call: {part['functionCall']['name']} ---")
        if "functionResponse" in part:
            print(f"--- event {i} tool response: {part['functionResponse']['name']} ---")
