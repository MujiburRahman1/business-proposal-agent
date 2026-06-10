import type { ProposalResult, Requirements, SimilarProject } from "./types";
import { simplifyProposalText } from "./utils";

type AdkPart = {
  text?: string;
  functionCall?: { name: string; args?: Record<string, unknown> };
  functionResponse?: {
    name: string;
    response?: { result?: unknown; content?: { text?: string }[] };
  };
};

type AdkEvent = {
  author?: string;
  content?: { parts?: AdkPart[] };
};

function extractJsonObject(text: string): Record<string, unknown> | null {
  const match = text.match(/```json\s*([\s\S]*?)\s*```/) ?? text.match(/\{[\s\S]*\}/);
  if (!match) return null;

  const raw = match[1] ?? match[0];
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function parseRequirementsFromJson(data: Record<string, unknown>): Requirements {
  const painPoints = Array.isArray(data.pain_points)
    ? data.pain_points.filter((item): item is string => typeof item === "string")
    : undefined;

  return {
    raw_analysis:
      typeof data.raw_analysis_summary === "string"
        ? data.raw_analysis_summary
        : JSON.stringify(data, null, 2),
    industry: typeof data.industry === "string" ? data.industry : undefined,
    company_size: typeof data.company_size === "string" ? data.company_size : undefined,
    timeline: typeof data.timeline === "string" ? data.timeline : undefined,
    budget: typeof data.budget === "string" ? data.budget : undefined,
    pain_points: painPoints,
  };
}

function parseSimilarProjects(events: AdkEvent[]): SimilarProject[] {
  const projects: SimilarProject[] = [];

  for (const event of events) {
    for (const part of event.content?.parts ?? []) {
      const response = part.functionResponse;
      if (
        !response ||
        !["find", "search_similar_projects", "find_documents"].includes(
          response.name,
        )
      ) {
        continue;
      }

      const result = response.response?.result ?? response.response;
      const docs = Array.isArray(result) ? result : [];

      for (const doc of docs) {
        if (!doc || typeof doc !== "object") continue;
        const record = doc as Record<string, unknown>;
        if (typeof record.name !== "string") continue;
        projects.push({
          name: record.name,
          industry: typeof record.industry === "string" ? record.industry : "Unknown",
        });
      }
    }
  }

  return projects.slice(0, 3);
}

function extractProposalText(fullText: string): string {
  const markers = [
    /###\s*STEP\s*3[:\s]*GENERATED\s*PROPOSAL\s*/i,
    /###\s*STEP\s*3[:\s]*GENERATED\s*PROPOSAL/i,
    /STEP\s*3[:\s]*GENERATED\s*PROPOSAL/i,
  ];

  for (const marker of markers) {
    const match = fullText.match(marker);
    if (match?.index !== undefined) {
      return fullText.slice(match.index + match[0].length).trim();
    }
  }

  return fullText.trim();
}

export function parseAdkEvents(
  events: AdkEvent[],
  transcript: string,
): ProposalResult {
  const agentTexts: string[] = [];

  for (const event of events) {
    if (event.author !== "dealpilot") continue;
    for (const part of event.content?.parts ?? []) {
      if (part.text) agentTexts.push(part.text);
    }
  }

  const fullText = agentTexts.join("\n");
  const json = extractJsonObject(fullText);
  const requirements = json
    ? parseRequirementsFromJson(json)
    : { raw_analysis: fullText || "Analysis completed." };

  const similar_projects = parseSimilarProjects(events);
  const rawProposal =
    extractProposalText(fullText) || fullText || "No proposal generated.";
  const proposal = simplifyProposalText(rawProposal);

  return {
    transcript,
    requirements,
    similar_projects,
    proposal,
  };
}
