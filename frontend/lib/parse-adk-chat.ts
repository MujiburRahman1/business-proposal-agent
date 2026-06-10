import type { ChatItem } from "./types";

type AdkPart = {
  text?: string;
  functionCall?: { name: string };
  functionResponse?: { name: string };
};

type AdkEvent = {
  author?: string;
  content?: { parts?: AdkPart[] };
};

export function parseAdkEventsToChatItems(events: AdkEvent[]): ChatItem[] {
  const items: ChatItem[] = [];

  for (const event of events) {
    if (event.author !== "dealpilot") continue;

    for (const part of event.content?.parts ?? []) {
      if (part.functionCall?.name) {
        items.push({
          type: "tool",
          name: part.functionCall.name,
          status: "running",
        });
      }

      if (part.functionResponse?.name) {
        const existing = [...items]
          .reverse()
          .find(
            (item) =>
              item.type === "tool" &&
              item.name === part.functionResponse?.name &&
              item.status === "running",
          );

        if (existing && existing.type === "tool") {
          existing.status = "complete";
        } else {
          items.push({
            type: "tool",
            name: part.functionResponse.name,
            status: "complete",
          });
        }
      }

      if (part.text?.trim()) {
        items.push({
          type: "assistant",
          text: part.text.trim(),
        });
      }
    }
  }

  return items;
}

export function isDiscoveryTranscript(message: string): boolean {
  const text = message.trim();
  if (text.length < 120) return false;
  if (/^(save|show|find|list|get)\b/i.test(text) && text.length < 250) {
    return false;
  }
  return true;
}

export function buildPipelinePrompt(transcript: string): string {
  return `Run your full 3-step DealPilot pipeline on this discovery call transcript.

Return clearly labeled sections:
- STEP 1: REQUIREMENTS ANALYSIS (include JSON with industry, company_size, pain_points, timeline, budget)
- STEP 2: SIMILAR HISTORICAL PROJECTS (use search_similar_projects MCP tool with the industry)
- STEP 3: GENERATED PROPOSAL (800-1200 words, plain text only — no markdown)

IMPORTANT: Always complete STEP 3 even if MongoDB returns no results or errors.
Use simple section labels, not ### or ** formatting.

TRANSCRIPT:
"""${transcript}"""`;
}
