import { formatDistanceToNow, format } from "date-fns";

/** Used everywhere a timestamp is shown in a list/summary context (D035 - one formatting
 * convention, not each page picking its own). */
export function formatRelativeTime(isoString: string): string {
  return formatDistanceToNow(new Date(isoString), { addSuffix: true });
}

/** Used for exact timestamps in detail views (e.g. a specific chat message's send time). */
export function formatDateTime(isoString: string): string {
  return format(new Date(isoString), "MMM d, yyyy 'at' h:mm a");
}
