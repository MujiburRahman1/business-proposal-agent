import type { Requirements } from "./types";

export function parseRequirements(raw: string): Requirements {
  const requirements: Requirements = { raw_analysis: raw };

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return requirements;

  try {
    const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;

    if (typeof parsed.industry === "string") {
      requirements.industry = parsed.industry;
    }
    if (typeof parsed.company_size === "string") {
      requirements.company_size = parsed.company_size;
    }
    if (typeof parsed.timeline === "string") {
      requirements.timeline = parsed.timeline;
    }
    if (typeof parsed.budget === "string") {
      requirements.budget = parsed.budget;
    }
    if (Array.isArray(parsed.pain_points)) {
      requirements.pain_points = parsed.pain_points.filter(
        (item): item is string => typeof item === "string",
      );
    }
  } catch {
    return requirements;
  }

  return requirements;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function downloadTextFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function formatProposalFilename(): string {
  const date = new Date().toISOString().slice(0, 10);
  return `proposal-${date}.txt`;
}

export function simplifyProposalText(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^---+\s*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
