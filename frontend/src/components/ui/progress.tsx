import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number;
  className?: string;
  indicatorClassName?: string;
  /** When true, the indicator animates from 0 to its target width on mount. */
  animated?: boolean;
  ariaLabel?: string;
}

export function Progress({
  value,
  className,
  indicatorClassName,
  animated = true,
  ariaLabel,
}: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      aria-label={ariaLabel}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-muted",
        className,
      )}
    >
      <div
        className={cn(
          "h-full rounded-full bg-primary transition-[width] duration-700 ease-out",
          animated && "animate-progress-grow",
          indicatorClassName,
        )}
        style={
          {
            width: `${clamped}%`,
            ["--progress-target" as string]: `${clamped}%`,
          } as React.CSSProperties
        }
      />
    </div>
  );
}
