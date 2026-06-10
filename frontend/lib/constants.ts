import type { PipelineStep } from "./types";

export const SAMPLE_TRANSCRIPT = `Client: We're a mid-size logistics company struggling with manual route planning.
Rep: How many drivers do you manage?
Client: About 120 across three regions. Our ops team spends 6+ hours daily on spreadsheets.
Rep: What's your timeline?
Client: We need something live before Q3. Budget is roughly $80-100k for phase one.
Rep: What systems are you using today?
Client: Mostly Excel and a legacy TMS that doesn't integrate with our CRM.`;

export const PIPELINE_STEPS: PipelineStep[] = [
  {
    id: "analyze",
    label: "Analyzer",
    description: "Extract industry, pain points, timeline, and budget from the transcript.",
  },
  {
    id: "research",
    label: "Researcher",
    description: "Search past projects in MongoDB via MCP for relevant case studies.",
  },
  {
    id: "proposal",
    label: "Proposal Generator",
    description: "Draft a tailored business proposal using Google ADK + Gemini.",
  },
];

export const APP_NAME = "DealPilot";
