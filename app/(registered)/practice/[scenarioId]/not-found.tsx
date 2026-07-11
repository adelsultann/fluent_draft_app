/**
 * Practice route — not found
 *
 * Shown when a scenario slug does not match any seeded lesson.
 */
export default function PracticeNotFound() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-xl font-semibold text-primary">Lesson not found</h1>
      <p className="mt-2 text-sm text-text-muted">
        The lesson you are looking for does not exist or is not available yet.
      </p>
      <a
        href="/packs"
        className="mt-4 inline-block rounded-md bg-action px-4 py-2 text-sm font-medium text-white hover:bg-action/90 transition-colors"
      >
        Browse lesson packs
      </a>
    </div>
  );
}
