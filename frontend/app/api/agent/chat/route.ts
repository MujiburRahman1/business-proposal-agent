import { NextRequest, NextResponse } from "next/server";

import {
  buildPipelinePrompt,
  isDiscoveryTranscript,
  parseAdkEventsToChatItems,
} from "@/lib/parse-adk-chat";
import { parseAdkEvents } from "@/lib/parse-adk-response";

const ADK_AGENT_URL = process.env.ADK_AGENT_URL ?? "http://127.0.0.1:8080";
const ADK_APP_NAME = process.env.ADK_APP_NAME ?? "dealpilot";
const BACKEND_URL = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";

type AdkSession = { id: string };

async function createSession(userId: string) {
  const response = await fetch(
    `${ADK_AGENT_URL}/apps/${ADK_APP_NAME}/users/${userId}/sessions`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    },
  );

  if (!response.ok) {
    throw new Error(
      `ADK session failed (${response.status}). Start agent: adk web --port 8080`,
    );
  }

  return (await response.json()) as AdkSession;
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

export async function POST(request: NextRequest) {
  let body: { message?: string; sessionId?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const message = body.message?.trim();
  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const userId = "frontend-chat-user";
  let sessionId = body.sessionId;

  try {
    if (!sessionId) {
      const session = await createSession(userId);
      sessionId = session.id;
    }

    const agentMessage = isDiscoveryTranscript(message)
      ? buildPipelinePrompt(message)
      : message;

    const runResponse = await fetch(`${ADK_AGENT_URL}/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        app_name: ADK_APP_NAME,
        user_id: userId,
        session_id: sessionId,
        new_message: {
          role: "user",
          parts: [{ text: agentMessage }],
        },
      }),
    });

    if (!runResponse.ok) {
      const detail = await runResponse.text();
      throw new Error(detail || `ADK agent run failed (${runResponse.status})`);
    }

    const events = await runResponse.json();
    const items = parseAdkEventsToChatItems(events);

    let proposalResult;
    let saved_to_mongodb = false;
    let mongodb_id: string | undefined;

    if (isDiscoveryTranscript(message)) {
      proposalResult = parseAdkEvents(events, message);
      const saveResult = await autoSaveToMongoDB(
        message,
        proposalResult.requirements as Record<string, unknown>,
        proposalResult.proposal,
      );
      saved_to_mongodb = saveResult.saved;
      mongodb_id = saveResult.proposal_id;
    }

    return NextResponse.json({
      sessionId,
      items,
      proposalResult,
      saved_to_mongodb,
      mongodb_id,
    });
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "Failed to reach DealPilot agent";

    return NextResponse.json({ error: detail }, { status: 503 });
  }
}
