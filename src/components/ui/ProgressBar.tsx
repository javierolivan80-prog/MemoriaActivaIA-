export default function ProgressBar({
  step,
  totalSteps,
}: {
  step: number;
  totalSteps: number;
}) {
  const percent = Math.min(100, Math.max(0, (step / totalSteps) * 100));

  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-alt">
      <div
        className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
