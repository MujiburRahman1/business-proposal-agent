import { PIPELINE_STEPS } from "@/lib/constants";

export default function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-6 pt-14 sm:px-10 sm:pt-20">
      <div className="max-w-3xl space-y-5">
        <p className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-700">
          AI Sales Copilot
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">
          Turn discovery calls into winning proposals
        </h1>
        <p className="text-lg leading-relaxed text-zinc-600">
          Chat with DealPilot to analyze discovery calls, query MongoDB via MCP,
          and generate client-ready proposals — powered by Google ADK.
        </p>
      </div>
    </section>
  );
}

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="mx-auto max-w-6xl scroll-mt-24 px-6 py-16 sm:px-10"
    >
      <div className="mb-10 space-y-2">
        <h2 className="text-2xl font-semibold text-zinc-900">How it works</h2>
        <p className="text-zinc-600">
          Google Cloud ADK agent with MongoDB MCP powers every proposal.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {PIPELINE_STEPS.map((step, index) => (
          <article
            key={step.id}
            className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
          >
            <span className="mb-4 inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-sm font-semibold text-white">
              {index + 1}
            </span>
            <h3 className="mb-2 text-lg font-semibold text-zinc-900">
              {step.label}
            </h3>
            <p className="text-sm leading-relaxed text-zinc-600">
              {step.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
