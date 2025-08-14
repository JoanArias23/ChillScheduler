"use client";

import { CalendarDays, Cog, Wifi, WifiOff } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import Link from "next/link";
import { usePathname } from "next/navigation";

function useNow(refreshMs = 1000) {
  const [now, setNow] = useState<Date>(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), refreshMs);
    return () => clearInterval(id);
  }, [refreshMs]);
  return now;
}

export default function Header() {
  const now = useNow(1000);
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const configured = typeof window !== "undefined" && !!window.__AMPLIFY_CONFIGURED__;
  const timeStr = useMemo(
    () => now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    [now]
  );
  const pathname = usePathname();

  return (
    <header className="w-full sticky top-0 z-10 bg-gradient-to-b from-[var(--background)] to-[var(--surface)] border-b border-[var(--border)]/80 backdrop-blur supports-[backdrop-filter]:bg-[var(--background)]/70">
      <div className="max-w-[1280px] mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CalendarDays size={20} />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-gray-900">ChillScheduler</span>
            <span className="text-xs text-gray-500">Cron for AI Agents</span>
          </div>
          <nav className="ml-4 hidden sm:flex items-center gap-1">
            {[
              { href: "/", label: "Dashboard" },
              { href: "/templates", label: "Templates" },
              { href: "/settings", label: "Settings" },
              { href: "/profile", label: "Profile" },
            ].map((l) => {
              const active = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`px-2.5 py-1.5 text-sm rounded-md border ${
                    active
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-[var(--surface)] text-[var(--foreground)] border-[var(--border)] hover:bg-[var(--muted)]"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-gray-500">{timeStr}</span>
            <span className="text-gray-400">|</span>
            <span className="text-gray-500">{tz}</span>
          </div>

          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border shadow-sm ${
              configured
                ? "text-green-700 bg-green-50 border-green-200"
                : "text-red-700 bg-red-50 border-red-200"
            }`}
            title={configured ? "Connected to backend" : "Disconnected (mock mode)"}
          >
            {configured ? <Wifi size={14} /> : <WifiOff size={14} />}
            <span className="font-medium text-xs">
              {configured ? "Connected" : "Disconnected"}
            </span>
          </div>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
