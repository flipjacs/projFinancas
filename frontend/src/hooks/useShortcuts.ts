import { useEffect } from "react";

interface Shortcut {
  /** Plain key (e.g. "k", "?"). Combine with `meta`/`shift` flags. */
  key: string;
  meta?: boolean;
  shift?: boolean;
  /** Triggered when the binding matches. Receives the original event so the
   *  handler can call preventDefault when it actually consumes the input. */
  handler: (event: KeyboardEvent) => void;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

/**
 * Lightweight global key-binding hook. Skips handlers when an editable
 * element is focused unless `meta` (⌘/Ctrl) is required — that's the usual
 * "command palette" / "save" pattern that should still fire from inputs.
 */
export function useShortcuts(shortcuts: Shortcut[]) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      for (const sc of shortcuts) {
        const needsMeta = sc.meta === true;
        const metaMatches = needsMeta
          ? event.metaKey || event.ctrlKey
          : !event.metaKey && !event.ctrlKey;
        const shiftMatches = sc.shift ? event.shiftKey : !event.shiftKey;
        const keyMatches = event.key.toLowerCase() === sc.key.toLowerCase();

        if (!keyMatches || !metaMatches || !shiftMatches) continue;
        if (!needsMeta && isEditableTarget(event.target)) continue;
        sc.handler(event);
        return;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shortcuts]);
}
