import type { SimilarProject } from "@/lib/types";

type SimilarProjectsCardProps = {
  projects: SimilarProject[];
};

export default function SimilarProjectsCard({
  projects,
}: SimilarProjectsCardProps) {
  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-zinc-900">
        Similar projects
      </h2>

      {projects.length === 0 ? (
        <p className="text-sm text-zinc-500">
          No similar projects found in the knowledge base.
        </p>
      ) : (
        <ul className="space-y-3">
          {projects.map((project) => (
            <li
              key={`${project.name}-${project.industry}`}
              className="rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-3"
            >
              <p className="font-medium text-zinc-900">{project.name}</p>
              <p className="text-sm text-zinc-600">{project.industry}</p>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
