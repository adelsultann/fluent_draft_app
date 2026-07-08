import AppShell from "@/components/layout/app-shell";

export default function Home() {
  return (
    <AppShell>
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <p className="text-primary text-lg font-semibold">FluentDraft</p>
        <p className="text-text-muted text-center max-w-md">
          Practice real-world English writing. Build confidence through scenarios, typing, recall,
          and pronunciation.
        </p>
      </div>
    </AppShell>
  );
}
