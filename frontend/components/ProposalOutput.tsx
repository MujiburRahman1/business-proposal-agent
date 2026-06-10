"use client";

import { useEffect, useState } from "react";

import { simplifyProposalText } from "@/lib/utils";
import ProposalDocument from "./ProposalDocument";

type ProposalOutputProps = {
  proposal: string;
  title?: string;
};

type OutputMode = "text" | "pdf";

export default function ProposalOutput({ proposal, title }: ProposalOutputProps) {
  const [mode, setMode] = useState<OutputMode>("text");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const cleanProposal = simplifyProposalText(proposal);
  const pdfTitle = title || "DealPilot Business Proposal";

  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  async function generatePdf() {
    setPdfLoading(true);
    setPdfError(null);

    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }

    try {
      const response = await fetch("/api/anvil/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposal: cleanProposal,
          title: pdfTitle,
        }),
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type") ?? "";
        if (contentType.includes("application/json")) {
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error || "Failed to generate PDF");
        }
        throw new Error("Failed to generate PDF");
      }

      const blob = await response.blob();
      setPdfUrl(URL.createObjectURL(blob));
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : "PDF generation failed");
    } finally {
      setPdfLoading(false);
    }
  }

  return (
    <article className="lg:col-span-2 space-y-4">
      <div className="flex flex-wrap gap-2 rounded-2xl border border-zinc-200 bg-white p-2 shadow-sm">
        <button
          type="button"
          onClick={() => setMode("text")}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
            mode === "text"
              ? "bg-emerald-600 text-white"
              : "text-zinc-600 hover:bg-zinc-100"
          }`}
        >
          Text Proposal
        </button>
        <button
          type="button"
          onClick={() => setMode("pdf")}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
            mode === "pdf"
              ? "bg-sky-600 text-white"
              : "text-zinc-600 hover:bg-zinc-100"
          }`}
        >
          PDF (Anvil)
        </button>
      </div>

      {mode === "text" ? (
        <ProposalDocument proposal={proposal} />
      ) : (
        <div className="rounded-2xl border border-sky-200 bg-sky-50/40 p-6 shadow-sm">
          <div className="mb-4 space-y-2">
            <h2 className="text-lg font-semibold text-zinc-900">
              PDF via Anvil
            </h2>
            <p className="text-sm text-zinc-600">
              Turn your proposal into a downloadable PDF using the Anvil API.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void generatePdf()}
            disabled={pdfLoading}
            className="rounded-full bg-sky-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pdfLoading ? "Generating PDF..." : "Generate PDF with Anvil"}
          </button>

          {pdfLoading && (
            <p className="mt-4 text-sm text-sky-700">
              Anvil is building your PDF. This usually takes a few seconds.
            </p>
          )}

          {pdfError && (
            <div
              role="alert"
              className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            >
              {pdfError}
            </div>
          )}

          {pdfUrl && (
            <div className="mt-4">
              <a
                href={pdfUrl}
                download={`${pdfTitle.replace(/[^a-z0-9-_ ]/gi, "").trim() || "proposal"}.pdf`}
                className="inline-flex rounded-full bg-sky-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-sky-700"
              >
                Download PDF
              </a>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
