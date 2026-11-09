import { cn } from "@/presentation/lib/utils";

export function Sparkline({
  points,
  color,
  className,
}: {
  points: number[];
  color: string;
  className?: string;
}) {
  if (points.length < 2) return null;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const width = 120;
  const height = 36;
  const pad = 2;

  const coords = points.map((value, index) => {
    const x = pad + (index / (points.length - 1)) * (width - pad * 2);
    const y = height - pad - ((value - min) / range) * (height - pad * 2);
    return [x, y] as const;
  });

  const line = coords
    .map(
      ([x, y], index) =>
        `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`,
    )
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn("h-9 w-[7.5rem]", className)}
      fill="none"
      aria-hidden
    >
      <path
        d={line}
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
