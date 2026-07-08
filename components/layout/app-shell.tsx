import type { ReactNode } from "react";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="bg-primary text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-y-2 px-4 py-3">
          <span className="text-lg font-semibold tracking-tight">FluentDraft</span>
          <nav className="flex flex-wrap gap-x-6 gap-y-1 text-sm font-medium">
            <a href="/demo" className="transition-colors hover:text-phrase">
              Demo
            </a>
            <a href="/dashboard" className="transition-colors hover:text-phrase">
              Dashboard
            </a>
            <a href="/packs" className="transition-colors hover:text-phrase">
              Packs
            </a>
            <a href="/phrase-bank" className="transition-colors hover:text-phrase">
              Phrase Bank
            </a>
            <a href="/leaderboard" className="transition-colors hover:text-phrase">
              Leaderboard
            </a>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
