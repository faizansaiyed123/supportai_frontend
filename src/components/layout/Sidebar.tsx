"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Inbox, LayoutDashboard, LogOut, Ticket, Users, UsersRound } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/lib/auth/AuthContext";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/conversations", label: "Conversations", icon: Inbox },
  { href: "/tickets", label: "Tickets", icon: Ticket },
  { href: "/documents", label: "Knowledge base", icon: FileText },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/team", label: "Team", icon: UsersRound },
];

/** The one navigation surface for the whole authenticated app - every page lives under this
 * shell (D035 - consistent navigation, not per-page reinvention). Highlights the active route
 * via usePathname rather than requiring each page to know it's "active." */
export function Sidebar() {
  const pathname = usePathname();
  const { logout, role } = useAuth();

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-neutral-200 bg-white">
      <div className="flex h-14 items-center border-b border-neutral-200 px-4">
        <span className="text-base font-semibold text-neutral-900">SupportAI</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-brand-50 text-brand-700"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900",
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-neutral-200 p-3">
        {role && <p className="mb-2 px-3 text-xs capitalize text-neutral-400">Signed in as {role}</p>}
        <button
          onClick={() => void logout()}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Log out
        </button>
      </div>
    </aside>
  );
}
