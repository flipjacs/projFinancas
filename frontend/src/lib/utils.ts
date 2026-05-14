import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Tailwind class merger used by every shadcn/ui component.
 * Resolves conflicting utility classes deterministically.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
