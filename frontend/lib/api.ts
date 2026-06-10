import type { ApiError, ProposalResult } from "./types";

export async function generateProposal(
  transcript: string,
): Promise<ProposalResult> {
  const response = await fetch("/api/proposal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transcript }),
  });

  const data = (await response.json()) as ProposalResult | ApiError;

  if (!response.ok) {
    throw new Error("error" in data ? data.error : "Failed to generate proposal");
  }

  return data as ProposalResult;
}
