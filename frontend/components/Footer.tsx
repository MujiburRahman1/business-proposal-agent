import { APP_NAME } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-8 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between sm:px-10">
        <p>{APP_NAME} — Google ADK + Gemini + MongoDB MCP</p>
        <p>Built for sales teams who need proposals fast.</p>
      </div>
    </footer>
  );
}
