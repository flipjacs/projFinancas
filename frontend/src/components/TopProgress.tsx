import { useEffect, useState } from "react";
import { useIsFetching, useIsMutating } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

/**
 * Slim progress bar pinned to the top of the viewport that tracks
 * in-flight React Query fetches/mutations. Stays visible while any
 * request is pending and fades out shortly after the last one resolves.
 */
export function TopProgress() {
  const fetching = useIsFetching();
  const mutating = useIsMutating();
  const active = fetching + mutating > 0;

  // Hold the bar visible for a beat after work ends so quick requests
  // still register, and so the fade-out doesn't look glitchy.
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (active) {
      setVisible(true);
      return;
    }
    const t = window.setTimeout(() => setVisible(false), 200);
    return () => window.clearTimeout(t);
  }, [active]);

  return (
    <div
      aria-hidden
      className={cn(
        "fixed inset-x-0 top-0 z-[60] h-0.5 overflow-hidden transition-opacity duration-200",
        visible ? "opacity-100" : "opacity-0",
      )}
    >
      <div
        className={cn(
          "h-full w-full bg-gradient-to-r from-primary/0 via-primary to-primary/0",
          active && "animate-[topbar_1.2s_linear_infinite]",
        )}
        style={{ backgroundSize: "200% 100%" }}
      />
      <style>
        {`@keyframes topbar { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}
      </style>
    </div>
  );
}
