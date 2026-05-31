"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { format, formatDistanceToNow, isPast } from "date-fns";
import {
  LayoutDashboard, Calendar, FileText, LogOut, Plus,
  Video, ChevronLeft, User, Users, BarChart2, Download,
  X, Bell, Loader2,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

interface UpcomingMeeting {
  _id: string;
  title: string;
  startTime: string;
  color?: string;
}

// ─── Nav items ────────────────────────────────────────────────────────────────

const NAV = [
  { href: "/dashboard",  label: "Dashboard",  Icon: LayoutDashboard },
  { href: "/meetings",   label: "Meetings",   Icon: Calendar        },
  { href: "/documents",  label: "Documents",  Icon: FileText        },
  { href: "/teams",      label: "Teams",      Icon: Users           },
  { href: "/analytics",  label: "Analytics",  Icon: BarChart2       },
  { href: "/profile",    label: "Profile",    Icon: User            },
];

// ─── Notification dropdown ────────────────────────────────────────────────────

function NotificationDropdown({ onClose }: { onClose: () => void }) {
  const [meetings, setMeetings] = useState<UpcomingMeeting[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    fetch("/api/meetings?status=scheduled")
      .then(r => r.json())
      .then((data: UpcomingMeeting[]) => {
        const upcoming = (Array.isArray(data) ? data : [])
          .filter(m => !isPast(new Date(m.startTime)))
          .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
          .slice(0, 5);
        setMeetings(upcoming);
      })
      .catch(() => setMeetings([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    // Positioned above the bell button
    <div className="absolute bottom-full left-0 mb-2 w-72 sm:w-80 bg-white rounded-2xl border
                    border-gray-100 shadow-xl z-50 overflow-hidden text-gray-900">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <p className="text-sm font-semibold">Upcoming Meetings</p>
        <Link href="/meetings" onClick={onClose} className="text-xs text-blue-600 hover:underline">
          View all
        </Link>
      </div>

      <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
          </div>
        )}
        {!loading && meetings.length === 0 && (
          <div className="py-8 text-center">
            <Bell className="h-8 w-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No upcoming meetings</p>
          </div>
        )}
        {!loading && meetings.map(m => (
          <Link
            key={m._id}
            href={`/meetings/${m._id}`}
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
          >
            <div
              className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${m.color ?? "#2563EB"}20` }}
            >
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: m.color ?? "#2563EB" }} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{m.title}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {format(new Date(m.startTime), "EEE, MMM d · h:mm a")}
              </p>
            </div>
            <span className="text-xs text-blue-500 font-medium flex-shrink-0">
              {formatDistanceToNow(new Date(m.startTime), { addSuffix: true })}
            </span>
          </Link>
        ))}
      </div>

      <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50">
        <Link
          href="/meetings/create"
          onClick={onClose}
          className="text-xs text-blue-600 hover:underline font-medium"
        >
          + Schedule a new meeting
        </Link>
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export default function Sidebar() {
  const pathname  = usePathname();
  const { data: session } = useSession();

  const sidebarOpen   = useAppStore(s => s.sidebarOpen);
  const toggleSidebar = useAppStore(s => s.toggleSidebar);
  const collapsed     = useAppStore(s => s.desktopCollapsed);
  const setCollapsed  = useAppStore(s => s.setDesktopCollapsed);

  const [notifOpen,    setNotifOpen]    = useState(false);
  const [exporting,    setExporting]    = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close notification dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node))
        setNotifOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close mobile sidebar on nav
  const handleNavClick = () => {
    if (sidebarOpen) toggleSidebar();
  };

  // Force-download the .ics as a local file so the OS opens it
  // in Calendar / Outlook — NOT in the mail app
  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const res = await fetch("/api/meetings/export");
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = "meetflow.ics";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch {
      alert("Could not export calendar. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  // User initials fallback
  const initials = (name = "") =>
    name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();

  return (
    <>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          "flex flex-col bg-white border-r border-gray-100 transition-all duration-300 flex-shrink-0 h-full",
          // Mobile: fixed overlay
          "fixed inset-y-0 left-0 z-50 w-72",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          // Desktop: in-flow, collapsible
          "md:static md:z-auto md:translate-x-0",
          collapsed ? "md:w-16" : "md:w-60",
        )}
      >
        {/* ── Brand row ───────────────────────────────────────────────── */}
        <div className="flex items-center h-16 px-4 border-b border-gray-100 flex-shrink-0 gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
            <Video className="h-4 w-4 text-white" />
          </div>

          <span className={cn("font-bold text-gray-900 text-lg", collapsed && "md:hidden")}>
            MeetFlow
          </span>

          {/* Mobile: close X */}
          <button
            onClick={toggleSidebar}
            className="ml-auto p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors md:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Desktop: collapse chevron */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors hidden md:flex",
              !collapsed && "ml-auto",
            )}
            aria-label="Toggle sidebar"
          >
            <ChevronLeft
              className={cn("h-4 w-4 transition-transform duration-200", collapsed && "rotate-180")}
            />
          </button>
        </div>

        {/* ── New meeting CTA ─────────────────────────────────────────── */}
        <div className={cn("flex-shrink-0 pt-4", collapsed ? "md:px-2 px-3" : "px-3")}>
          <Link
            href="/meetings/create"
            onClick={handleNavClick}
            title="New meeting"
            className={cn(
              "flex items-center gap-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors h-10",
              collapsed ? "md:w-10 md:justify-center md:px-0 px-3" : "px-3",
            )}
          >
            <Plus className="h-4 w-4 flex-shrink-0" />
            <span className={cn(collapsed && "md:hidden")}>New meeting</span>
          </Link>
        </div>

        {/* ── Nav links ───────────────────────────────────────────────── */}
        <nav className={cn("flex-1 py-4 space-y-0.5 overflow-y-auto", collapsed ? "md:px-2 px-3" : "px-3")}>
          {NAV.map(({ href, label, Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={handleNavClick}
                title={collapsed ? label : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg h-10 text-sm font-medium transition-all",
                  collapsed ? "md:justify-center md:px-0 px-3" : "px-3",
                  active
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                )}
              >
                <Icon className={cn("h-4 w-4 flex-shrink-0", active ? "text-blue-600" : "text-gray-400")} />
                <span className={cn("truncate", collapsed && "md:hidden")}>{label}</span>
                {!collapsed && active && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-600" />
                )}
              </Link>
            );
          })}

          {/* Export calendar — JS download, NOT a plain <a href> */}
          <button
            onClick={handleExport}
            disabled={exporting}
            title={collapsed ? "Export calendar (.ics)" : undefined}
            className={cn(
              "w-full flex items-center gap-3 rounded-lg h-10 text-sm font-medium",
              "text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              collapsed ? "md:justify-center md:px-0 px-3" : "px-3",
            )}
          >
            {exporting
              ? <Loader2 className="h-4 w-4 flex-shrink-0 text-gray-400 animate-spin" />
              : <Download className="h-4 w-4 flex-shrink-0 text-gray-400" />
            }
            <span className={cn("truncate", collapsed && "md:hidden")}>
              {exporting ? "Exporting…" : "Export calendar"}
            </span>
          </button>
        </nav>

        <div className="mx-3 border-t border-gray-100" />

        {/* ── Bottom: notifications + user ────────────────────────────── */}
        <div className={cn("p-3 space-y-1 flex-shrink-0", collapsed && "md:p-2")}>

          {/* Notification bell with dropdown */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => setNotifOpen(o => !o)}
              title={collapsed ? "Notifications" : undefined}
              className={cn(
                "w-full flex items-center gap-3 rounded-lg h-10 text-sm font-medium",
                "text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors relative",
                collapsed ? "md:justify-center md:px-0 px-3" : "px-3",
              )}
            >
              <Bell className="h-4 w-4 flex-shrink-0 text-gray-400" />
              <span className={cn("truncate", collapsed && "md:hidden")}>Notifications</span>
              {/* Unread dot */}
              <span className={cn(
                "h-2 w-2 rounded-full bg-blue-500 flex-shrink-0",
                collapsed ? "md:absolute md:top-1.5 md:right-1.5" : "ml-auto",
              )} />
            </button>
            {notifOpen && <NotificationDropdown onClose={() => setNotifOpen(false)} />}
          </div>

          {/* Collapsed desktop: just sign-out icon */}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className={cn(
              "h-10 w-10 items-center justify-center rounded-lg",
              "text-gray-400 hover:bg-gray-50 hover:text-red-500 transition-colors",
              collapsed ? "md:flex hidden" : "hidden",
            )}
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>

          {/* Full user card (mobile always, desktop when not collapsed) */}
          <div className={cn(
            "flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 group transition-colors",
            collapsed && "md:hidden",
          )}>
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center
                            text-xs font-semibold text-blue-700 flex-shrink-0 overflow-hidden">
              {session?.user?.image
                ? <img src={session.user.image} alt="" className="h-full w-full object-cover" />
                : initials(session?.user?.name ?? "U")
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{session?.user?.name}</p>
              <p className="text-xs text-gray-400 truncate">{session?.user?.email}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-400 hover:text-red-500 transition-all"
              title="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>

        </div>
      </aside>
    </>
  );
}