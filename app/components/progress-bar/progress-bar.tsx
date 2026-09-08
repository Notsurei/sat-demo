export default function ProgressBar({
  label,
  progress,
  color,
  showLabel = true,
}: {
  label: string;
  progress: number;
  color: string;
  showLabel?: boolean;
}) {
  return (
    <div className="w-full space-y-2">
      {showLabel && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-default-500">{label}</span>
          <span className="font-semibold">{progress}%</span>
        </div>
      )}

      <div className="w-full h-2 overflow-hidden rounded-full bg-default-200">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}