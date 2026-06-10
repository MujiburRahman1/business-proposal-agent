import { NextRequest, NextResponse } from "next/server";

import { parseAdkEvents } from "@/lib/parse-adk-response";

const ADK_AGENT_URL = process.env.ADK_AGENT_URL ?? "http://127.0.0.1:8080";
const ADK_APP_NAME = process.env.ADK_APP_NAME ?? "dealpilot";
const BACKEND_URL = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";
const USE_ADK_AGENT = process.env.USE_ADK_AGENT !== "false";

type AdkSession = { id: string };

function isValidDiscoveryTranscript(transcript: string): string | null {
  const text = transcript.trim();

  if (text.length < 80) {
    return "Please paste a full discovery call transcript (at least a few sentences).";
  }

  const commandOnly =
    /^(save|show|find|list|get)\b/i.test(text) && text.length < 250;
  if (commandOnly) {
    return 'That looks like a command, not a discovery call. Click "Load sample" or paste a real Client/Rep conversation.';
  }

  return null;
}

async function autoSaveToMongoDB(
  transcript: string,
  requirements: Record<string, unknown>,
  proposal: string,
) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/proposal/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript, requirements, proposal }),
    });

    if (!response.ok) return { saved: false as const };

    const data = (await response.json()) as {
      success?: boolean;
      proposal_id?: string;
    };

    return {
      saved: Boolean(data.success),
      proposal_id: data.proposal_id,
    };
  } catch {
    return { saved: false as const };
  }
}

async function runDealPilotAgent(transcript: string) {
  const userId = "frontend-user";

  const sessionResponse = await fetch(
    `${ADK_AGENT_URL}/apps/${ADK_APP_NAME}/users/${userId}/sessions`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    },
  );

  if (!sessionResponse.ok) {
    throw new Error(
      `ADK session failed (${sessionResponse.status}). Is the agent running at ${ADK_AGENT_URL}?`,
    );
  }

  const session = (await sessionResponse.json()) as AdkSession;

  const prompt = `Run your full 3-step DealPilot pipeline on this discovery call transcript.

Return clearly labeled sections:
- STEP 1: REQUIREMENTS ANALYSIS (include JSON with industry, company_size, pain_points, timeline, budget)
- STEP 2: SIMILAR HISTORICAL PROJECTS (use search_similar_projects MCP tool with the industry)
- STEP 3: GENERATED PROPOSAL (800-1200 words, plain text — no markdown)

IMPORTANT: Always complete STEP 3 even if MongoDB returns no results or errors.
If database lookup fails, note "No similar projects found" and still generate the full proposal.

TRANSCRIPT:
"""${transcript}"""`;

  const runResponse = await fetch(`${ADK_AGENT_URL}/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      app_name: ADK_APP_NAME,
      user_id: userId,
      session_id: session.id,
      new_message: {
        role: "user",
        parts: [{ text: prompt }],
      },
    }),
  });

  if (!runResponse.ok) {
    const detail = await runResponse.text();
    throw new Error(detail || `ADK agent run failed (${runResponse.status})`);
  }

  const events = await runResponse.json();
  return parseAdkEvents(events, transcript);
}

async function runFastApiBackend(transcript: string) {
  const response = await fetch(`${BACKEND_URL}/proposal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transcript }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || "Backend request failed");
  }

  return response.json();
}

export async function POST(request: NextRequest) {
  let body: { transcript?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.transcript?.trim()) {
    return NextResponse.json(
      { error: "Transcript is required" },
      { status: 400 },
    );
  }

  const validationError = isValidDiscoveryTranscript(body.transcript);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  try {
    const result = USE_ADK_AGENT
      ? await runDealPilotAgent(body.transcript)
      : await runFastApiBackend(body.transcript);

    const saveResult = await autoSaveToMongoDB(
      body.transcript,
      result.requirements as Record<string, unknown>,
      result.proposal as string,
    );

    return NextResponse.json({
      ...result,
      saved_to_mongodb: saveResult.saved,
      mongodb_id: saveResult.proposal_id,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate proposal";

    return NextResponse.json(
      {
        error: USE_ADK_AGENT
          ? `${message} Start agent: cd agent && .\\.venv\\Scripts\\adk.exe web --port 8080`
          : `${message} Start backend: uvicorn main:app --reload --app-dir backend`,
      },
      { status: 503 },
    );
  }
}
