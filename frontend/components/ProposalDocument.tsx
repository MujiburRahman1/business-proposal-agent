"use client";

import { useState } from "react";
import {
  copyToClipboard,
  downloadTextFile,
  formatProposalFilename,
  simplifyProposalText,
} from "@/lib/utils";

type ProposalDocumentProps = {
  proposal: string;
};

export default function ProposalDocument({ proposal }: ProposalDocumentProps) {
  const [copied, setCopied] = useState(false);
  const cleanProposal = simplifyProposalText(proposal);

  async function handleCopy() {
    const success = await copyToClipboard(cleanProposal);
    if (!success) return;

    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    downloadTextFile(formatProposalFilename(), cleanProposal);
  }

  return (
    <article className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-6 shadow-sm lg:col-span-2">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-zinc-900">
          Generated proposal
        </h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-full border border-emerald-300 bg-white px-4 py-2 text-sm font-medium text-emerald-800 transition hover:bg-emerald-100"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
          >
            Download
          </button>
        </div>
      </div>

      <div className="max-h-[32rem] overflow-y-auto rounded-xl border border-emerald-100 bg-white p-5">
        <div className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-800">
          {cleanProposal}
        </div>
      </div>
    </article>
  );
}
