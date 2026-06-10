"use client";

import { useEffect, useRef, useState } from "react";
import { generateProposal } from "@/lib/api";
import { PIPELINE_STEPS, SAMPLE_TRANSCRIPT } from "@/lib/constants";
import { parseRequirements } from "@/lib/utils";
import type { PipelineStep, ProposalResult } from "@/lib/types";
import PipelineProgress from "./PipelineProgress";
import ProposalOutput from "./ProposalOutput";
import RequirementsCard from "./RequirementsCard";
import SimilarProjectsCard from "./SimilarProjectsCard";

const STEP_DELAYS_MS = [0, 3500, 7000];

export default function ProposalWorkspace() {
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ProposalResult | null>(null);
  const [activeStep, setActiveStep] = useState<PipelineStep["id"] | null>(null);
  const [completedSteps, setCompletedSteps] = useState<PipelineStep["id"][]>([]);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  function clearTimers() {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  }

  function startPipelineAnimation() {
    clearTimers();
    setActiveStep("analyze");
    setCompletedSteps([]);

    STEP_DELAYS_MS.forEach((delay, index) => {
      const timer = window.setTimeout(() => {
        const step = PIPELINE_STEPS[index];
        if (!step) return;

        setActiveStep(step.id);

        if (index > 0) {
          const previous = PIPELINE_STEPS[index - 1];
          if (previous) {
            setCompletedSteps((current) =>
              current.includes(previous.id) ? current : [...current, previous.id],
            );
          }
        }
      }, delay);

      timersRef.current.push(timer);
    });
  }

  function finishPipelineAnimation() {
    clearTimers();
    setCompletedSteps(PIPELINE_STEPS.map((step) => step.id));
    setActiveStep(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    startPipelineAnimation();

    try {
      const data = await generateProposal(transcript);
      const parsedRequirements = parseRequirements(data.requirements.raw_analysis);

      setResult({
        ...data,
        requirements: {
          ...data.requirements,
          ...parsedRequirements,
        },
      });
      finishPipelineAnimation();
    } catch (err) {
      clearTimers();
      setActiveStep(null);
      setCompletedSteps([]);
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    setTranscript("");
    setResult(null);
    setError(null);
  }

  const wordCount = transcript.trim() ? transcript.trim().split(/\s+/).length : 0;

  return (
    <section
      id="workspace"
      className="mx-auto max-w-6xl scroll-mt-24 px-6 py-12 sm:px-10"
    >
      <div className="mb-8 space-y-2">
        <h2 className="text-2xl font-semibold text-zinc-900">Proposal workspace</h2>
        <p className="text-zinc-600">
          Drop in a discovery call transcript to kick off the agent pipeline.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label htmlFor="transcript" className="text-sm font-medium text-zinc-800">
              Discovery call transcript
            </label>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-zinc-500">{wordCount} words</span>
              <button
                type="button"
                onClick={() => setTranscript(SAMPLE_TRANSCRIPT)}
                className="font-medium text-emerald-700 hover:text-emerald-900"
              >
                Load sample
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="text-zinc-500 hover:text-zinc-800"
              >
                Clear
              </button>
            </div>
          </div>

          <textarea
            id="transcript"
            value={transcript}
            onChange={(event) => setTranscript(event.target.value)}
            rows={16}
            placeholder="Paste your sales discovery call transcript here..."
            className="w-full resize-y rounded-2xl border border-zinc-200 bg-white px-4 py-4 font-mono text-sm leading-relaxed text-zinc-800 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10"
            required
          />

          <button
            type="submit"
            disabled={loading || !transcript.trim()}
            className="inline-flex h-12 items-center justify-center rounded-full bg-emerald-600 px-8 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Generating proposal..." : "Generate proposal"}
          </button>
        </form>

        <div className="space-y-4">
          {loading ? (
            <PipelineProgress
              steps={PIPELINE_STEPS}
              activeStep={activeStep}
              completedSteps={completedSteps}
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/80 p-6">
              <h3 className="mb-2 text-sm font-semibold text-zinc-900">
                Ready when you are
              </h3>
              <p className="text-sm leading-relaxed text-zinc-600">
                Your transcript runs through the DealPilot ADK agent (Analyzer,
                MongoDB MCP Researcher, Proposal Generator). Results appear here
                once complete.
              </p>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            >
              {error}
            </div>
          )}
        </div>
      </div>

      {result && (
        <section className="mt-10 space-y-4">
          {result.saved_to_mongodb && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Proposal automatically saved to MongoDB
              {result.mongodb_id ? ` (ID: ${result.mongodb_id})` : ""}.
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <RequirementsCard requirements={result.requirements} />
            <SimilarProjectsCard projects={result.similar_projects} />
            <ProposalOutput proposal={result.proposal} />
          </div>
        </section>
      )}
    </section>
  );
}
