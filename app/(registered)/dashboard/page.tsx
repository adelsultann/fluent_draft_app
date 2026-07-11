import DemoConversionGate from '@/domains/demo/components/demo-conversion-gate';

/**
 * Dashboard — placeholder (full feature in Task 43).
 */
export default function DashboardPage() {
  return (
    <div className="py-8 text-center">
      {/* Demo conversion gate — runs once after signup if demo progress exists */}
      <DemoConversionGate />

      <h1 className="text-xl font-semibold text-primary">Dashboard</h1>
      <p className="mt-2 text-sm text-text-muted">
        Your practice summary, streak, and recommendations will appear here.
      </p>
    </div>
  );
}
