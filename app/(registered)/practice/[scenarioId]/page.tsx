/**
 * Practice — placeholder (full feature in Tasks 26–31).
 * Shows the dynamic `scenarioId` from the URL.
 */
interface PracticePageProps {
  params: Promise<{ scenarioId: string }>;
}

export default async function PracticePage({ params }: PracticePageProps) {
  const { scenarioId } = await params;

  return (
    <div className="py-8 text-center">
      <h1 className="text-xl font-semibold text-primary">Practice</h1>
      <p className="mt-2 text-sm text-text-muted">
        Scenario: <span className="font-medium text-text">{scenarioId}</span>
      </p>
      <p className="mt-1 text-sm text-text-muted">
        The full practice engine will be built in Tasks 26–31.
      </p>
    </div>
  );
}
