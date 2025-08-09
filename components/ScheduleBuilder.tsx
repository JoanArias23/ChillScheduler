"use client";

import { useEffect, useMemo, useState } from "react";

type Mode = "interval" | "daily" | "weekly" | "monthly" | "cron";

export default function ScheduleBuilder({
  value,
  onChange,
}: {
  value: string;
  onChange: (cron: string) => void;
}) {
  const [mode, setMode] = useState<Mode>(() => inferMode(value));
  const [intervalHours, setIntervalHours] = useState(4);
  const [dailyTime, setDailyTime] = useState("09:00");
  const [weeklyDays, setWeeklyDays] = useState<number[]>([1]);
  const [monthlyDate, setMonthlyDate] = useState(1);
  const [advanced, setAdvanced] = useState(value);

  useEffect(() => {
    // Update cron when UI state changes
    if (mode === "interval") onChange(`0 */${intervalHours} * * *`);
    if (mode === "daily") {
      const [h, m] = dailyTime.split(":");
      onChange(`${Number(m)} ${Number(h)} * * *`);
    }
    if (mode === "weekly") {
      const [h, m] = dailyTime.split(":");
      const days = weeklyDays.sort().join(",");
      onChange(`${Number(m)} ${Number(h)} * * ${days}`);
    }
    if (mode === "monthly") {
      const [h, m] = dailyTime.split(":");
      onChange(`${Number(m)} ${Number(h)} ${monthlyDate} * *`);
    }
    if (mode === "cron") onChange(advanced);
  }, [mode, intervalHours, dailyTime, weeklyDays, monthlyDate, advanced]);

  useEffect(() => {
    // External value changed — try to sync UI
    setMode(inferMode(value));
  }, [value]);

  const preview = useMemo(() => describeCron(value), [value]);

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2">
        {(
          [
            { key: "interval", label: "Every X hours" },
            { key: "daily", label: "Daily" },
            { key: "weekly", label: "Weekly" },
            { key: "monthly", label: "Monthly" },
            { key: "cron", label: "Advanced" },
          ] as { key: Mode; label: string }[]
        ).map((o) => (
          <button
            key={o.key}
            className={`px-2.5 py-1.5 text-xs rounded-md border ${
              mode === o.key
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-[var(--surface)] text-[var(--foreground)] border-[var(--border)] hover:bg-[var(--muted)]"
            }`}
            onClick={() => setMode(o.key)}
          >
            {o.label}
          </button>
        ))}
      </div>

      {mode === "interval" && (
        <div className="flex items-center gap-2 text-sm">
          <span>Run every</span>
          <input
            type="number"
            min={1}
            value={intervalHours}
            onChange={(e) => setIntervalHours(Math.max(1, Number(e.target.value) || 1))}
            className="w-16 bg-[var(--surface)] border border-[var(--border)] rounded px-2 py-1"
          />
          <span>hours</span>
        </div>
      )}

      {(mode === "daily" || mode === "weekly" || mode === "monthly") && (
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <label htmlFor="time">Time</label>
          <input
            id="time"
            type="time"
            value={dailyTime}
            onChange={(e) => setDailyTime(e.target.value)}
            className="bg-[var(--surface)] border border-[var(--border)] rounded px-2 py-1"
          />
          {mode === "weekly" && (
            <div className="flex items-center gap-1">
              {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                <button
                  key={d}
                  type="button"
                  className={`w-8 h-8 text-xs rounded border ${
                    weeklyDays.includes(d)
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-[var(--surface)] text-[var(--foreground)] border-[var(--border)] hover:bg-[var(--muted)]"
                  }`}
                  onClick={() =>
                    setWeeklyDays((prev) =>
                      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
                    )
                  }
                >
                  {"SMTWTFS"[d]}
                </button>
              ))}
            </div>
          )}
          {mode === "monthly" && (
            <div className="flex items-center gap-2">
              <span>On day</span>
              <input
                type="number"
                min={1}
                max={28}
                value={monthlyDate}
                onChange={(e) => setMonthlyDate(Math.min(28, Math.max(1, Number(e.target.value) || 1)))}
                className="w-16 bg-[var(--surface)] border border-[var(--border)] rounded px-2 py-1"
              />
            </div>
          )}
        </div>
      )}

      {mode === "cron" && (
        <input
          value={advanced}
          onChange={(e) => setAdvanced(e.target.value)}
          placeholder="* * * * *"
          className="w-full bg-[var(--surface)] border border-[var(--border)] rounded px-2 py-2 font-mono text-sm"
        />
      )}

      <div className="text-xs text-[var(--muted-foreground)]">{preview}</div>
    </div>
  );
}

function inferMode(cron: string): Mode {
  if (/^0 \*\/[0-9]+ \* \* \*$/.test(cron)) return "interval";
  if (/^[0-9]+ [0-9]+ \* \* \*$/.test(cron)) return "daily";
  if (/^[0-9]+ [0-9]+ \* \* [0-6](,[0-6])*$/.test(cron)) return "weekly";
  if (/^[0-9]+ [0-9]+ [0-9]+ \* \*$/.test(cron)) return "monthly";
  return "cron";
}

function describeCron(cron: string): string {
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return "Invalid cron expression";
  const [min, hour, dom, mon, dow] = parts;
  if (min === "0" && hour.startsWith("*/")) {
    return `This job runs every ${hour.slice(2)} hours at minute 0.`;
  }
  if (dom === "*" && mon === "*" && dow === "*") {
    return `Daily at ${pad(hour)}:${pad(min)}.`;
  }
  if (dom === "*" && mon === "*" && /[0-6]/.test(dow)) {
    return `Weekly on ${dow}7 (0=Sun) at ${pad(hour)}:${pad(min)}.`;
  }
  if (mon === "*" && dow === "*") {
    return `Monthly on day ${dom} at ${pad(hour)}:${pad(min)}.`;
  }
  return `Cron: ${cron}`;
}

function pad(s: string) {
  const n = Number(s);
  return String(isNaN(n) ? s : n).padStart(2, "0");
}

