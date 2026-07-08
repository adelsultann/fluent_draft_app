interface ProgressProps {
  value: number;
  max?: number;
  label?: string;
  className?: string;
}

export default function Progress({
  value,
  max = 100,
  label = "Progress",
  className = "",
}: ProgressProps) {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
      className={`h-2 w-full overflow-hidden rounded-full bg-border ${className}`}
    >
      <div
        className="h-full rounded-full bg-action transition-all duration-300"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
