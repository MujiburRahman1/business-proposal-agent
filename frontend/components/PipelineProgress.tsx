import type { PipelineStep } from "@/lib/types";

type PipelineProgressProps = {
  steps: PipelineStep[];
  activeStep: PipelineStep["id"] | null;
  completedSteps: PipelineStep["id"][];
};

export default function PipelineProgress({
  steps,
  activeStep,
  completedSteps,
}: PipelineProgressProps) {
  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6">
      <p className="mb-4 text-sm font-medium text-emerald-800">
        Running agent pipeline...
      </p>
      <ol className="space-y-4">
        {steps.map((step) => {
          const isComplete = completedSteps.includes(step.id);
          const isActive = activeStep === step.id;

          return (
            <li key={step.id} className="flex items-start gap-3">
              <span
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  isComplete
                    ? "bg-emerald-600 text-white"
                    : isActive
                      ? "border-2 border-emerald-600 text-emerald-700"
                      : "border border-zinc-300 text-zinc-400"
                }`}
              >
                {isComplete ? "✓" : "•"}
              </span>
              <div>
                <p
                  className={`text-sm font-medium ${
                    isActive || isComplete ? "text-zinc-900" : "text-zinc-400"
                  }`}
                >
                  {step.label}
                </p>
                <p className="text-xs text-zinc-500">{step.description}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
