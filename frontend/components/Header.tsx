import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 sm:px-10">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white">
            BP
          </span>
          <span className="text-base font-semibold text-zinc-900">{APP_NAME}</span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-zinc-600 sm:flex">
          <a href="#workspace" className="transition hover:text-zinc-900">
            Workspace
          </a>
          <a href="#how-it-works" className="transition hover:text-zinc-900">
            How it works
          </a>
        </nav>
      </div>
    </header>
  );
}
