import { clsx, type ClassValue } from "clsx";

/** Thin wrapper around clsx - kept as its own module (not just importing clsx everywhere)
 * so a real project could later swap in tailwind-merge for proper class-conflict resolution
 * (e.g. "px-2 px-4" -> "px-4") without touching every call site. */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
