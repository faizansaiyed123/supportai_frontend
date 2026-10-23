import { cn } from "@/lib/utils/cn";

/** Used for loading states everywhere (Sec. 22) instead of a bare spinner for list/table
 * content - a skeleton communicates approximate shape/layout while data loads, which reduces
 * perceived layout shift once it arrives. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-neutral-200", className)} />;
}

export function TableRowSkeleton({ columns }: { columns: number }) {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full max-w-40" />
        </td>
      ))}
    </tr>
  );
}
