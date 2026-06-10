import type { Requirements } from "@/lib/types";

type RequirementsCardProps = {
  requirements: Requirements;
};

function Detail({ label, value }: { label: string; value?: string }) {
  if (!value) return null;

  return (
    <div className="rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <p className="mt-1 text-sm text-zinc-800">{value}</p>
    </div>
  );
}

export default function RequirementsCard({ requirements }: RequirementsCardProps) {
  const hasStructuredData =
    requirements.industry ||
    requirements.company_size ||
    requirements.timeline ||
    requirements.budget ||
    (requirements.pain_points?.length ?? 0) > 0;

  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-zinc-900">
        Requirements analysis
      </h2>

      {hasStructuredData ? (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Detail label="Industry" value={requirements.industry} />
            <Detail label="Company size" value={requirements.company_size} />
            <Detail label="Timeline" value={requirements.timeline} />
            <Detail label="Budget" value={requirements.budget} />
          </div>

          {requirements.pain_points && requirements.pain_points.length > 0 && (
            <div className="rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Pain points
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-zinc-800">
                {requirements.pain_points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <pre className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">
          {requirements.raw_analysis}
        </pre>
      )}
    </article>
  );
}
