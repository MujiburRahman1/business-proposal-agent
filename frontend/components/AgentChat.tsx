"use client";

import { useEffect, useRef, useState } from "react";

import { SAMPLE_TRANSCRIPT } from "@/lib/constants";
import type { AgentChatResponse, ChatItem } from "@/lib/types";
import type { ProposalResult } from "@/lib/types";
import ProposalOutput from "./ProposalOutput";
import RequirementsCard from "./RequirementsCard";
import SimilarProjectsCard from "./SimilarProjectsCard";

const QUICK_PROMPTS = [
  "Find logistics projects in the database",
  "Show me the 3 most recent saved proposals",
];

function ToolStep({ name, status }: { name: string; status: "running" | "complete" }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-800/80 px-4 py-3">
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-full text-sm ${
          status === "complete"
            ? "bg-emerald-500/20 text-emerald-400"
            : "bg-amber-500/20 text-amber-400"
        }`}
      >
        {status === "complete" ? "✓" : "⚡"}
      </span>
      <div>
        <p className="font-mono text-sm text-zinc-200">{name}</p>
        <p className="text-xs text-zinc-500">
          {status === "complete" ? "Tool completed" : "Running tool..."}
        </p>
      </div>
    </div>
  );
}

function AssistantMessage({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
          DP
        </span>
        <span className="text-sm font-medium text-zinc-300">DealPilot</span>
      </div>
      <div className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-100">
        {text}
      </div>
    </div>
  );
}

export default function AgentChat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatItem[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proposalResult, setProposalResult] = useState<ProposalResult | null>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, proposalResult]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setError(null);
    setSavedNotice(null);
    setProposalResult(null);
    setLoading(true);
    setMessages((current) => [...current, { type: "user", text: trimmed }]);
    setInput("");

    try {
      const response = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          sessionId,
        }),
      });

      const data = (await response.json()) as AgentChatResponse | { error: string };

      if (!response.ok) {
        throw new Error("error" in data ? data.error : "Agent request failed");
      }

      const result = data as AgentChatResponse;
      setSessionId(result.sessionId);
      setMessages((current) => [...current, ...result.items]);

      if (result.proposalResult) {
        setProposalResult(result.proposalResult);
      }

      if (result.saved_to_mongodb) {
        setSavedNotice(
          result.mongodb_id
            ? `Proposal automatically saved to MongoDB (ID: ${result.mongodb_id})`
            : "Proposal automatically saved to MongoDB",
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    void sendMessage(input);
  }

  function handleClear() {
    setInput("");
    setMessages([]);
    setSessionId(null);
    setProposalResult(null);
    setSavedNotice(null);
    setError(null);
  }

  return (
    <section
      id="workspace"
      className="mx-auto max-w-5xl scroll-mt-24 px-6 py-12 sm:px-10"
    >
      <div className="mb-6 space-y-2">
        <h2 className="text-2xl font-semibold text-zinc-900">DealPilot Agent</h2>
        <p className="text-zinc-600">
          Chat with your Google ADK agent. Tool calls and MongoDB MCP actions
          appear live — just like the ADK Dev UI.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            dealpilot · MongoDB MCP connected
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setInput(SAMPLE_TRANSCRIPT)}
              className="rounded-lg px-3 py-1.5 text-xs text-emerald-400 hover:bg-zinc-800"
            >
              Load sample
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="rounded-lg px-3 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800"
            >
              Clear chat
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-zinc-800 px-4 py-3">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => void sendMessage(prompt)}
              disabled={loading}
              className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300 transition hover:border-emerald-600 hover:text-emerald-400 disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>

        <div className="h-[28rem] space-y-4 overflow-y-auto px-4 py-4">
          {messages.length === 0 && !loading && (
            <div className="flex h-full items-center justify-center text-center text-sm text-zinc-500">
              Ask DealPilot to find projects, generate a proposal from a
              discovery call, or save results to MongoDB.
            </div>
          )}

          {messages.map((item, index) => {
            if (item.type === "user") {
              return (
                <div key={index} className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl bg-sky-600 px-4 py-3 text-sm text-white">
                    {item.text}
                  </div>
                </div>
              );
            }

            if (item.type === "tool") {
              return (
                <ToolStep
                  key={index}
                  name={item.name}
                  status={item.status}
                />
              );
            }

            return <AssistantMessage key={index} text={item.text} />;
          })}

          {loading && (
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              DealPilot is thinking...
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {error && (
          <div className="border-t border-red-900/50 bg-red-950/40 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-3 border-t border-zinc-800 px-4 py-4"
        >
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Type a message..."
            disabled={loading}
            className="flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>

      {savedNotice && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {savedNotice}
        </div>
      )}

      {proposalResult && (
        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <RequirementsCard requirements={proposalResult.requirements} />
          <SimilarProjectsCard projects={proposalResult.similar_projects} />
          <ProposalOutput
            proposal={proposalResult.proposal}
            title={
              proposalResult.requirements.industry
                ? `${proposalResult.requirements.industry} Proposal`
                : "DealPilot Business Proposal"
            }
          />
        </section>
      )}
    </section>
  );
}
