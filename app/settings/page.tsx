"use client";

import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import ThemeToggle from "@/components/ThemeToggle";
import { useEffect, useState } from "react";

type Prefs = {
  autoRefreshSeconds: number;
  density: "comfortable" | "compact";
  emailOnFailure: boolean;
  slackOnSuccess: boolean;
};

export default function SettingsPage() {
  const [prefs, setPrefs] = useState<Prefs>({
    autoRefreshSeconds: 30,
    density: "comfortable",
    emailOnFailure: true,
    slackOnSuccess: false,
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem("prefs");
      if (stored) {
        const parsed = JSON.parse(stored);
        setPrefs((prev) => ({ ...prev, ...parsed }));
      }
    } catch {}
  }, []);

  function save() {
    try {
      localStorage.setItem("prefs", JSON.stringify(prefs));
      alert("Preferences saved");
    } catch {}
  }

  return (
    <main className="max-w-[960px] mx-auto px-4 py-6 grid gap-4">
      <h1 className="text-2xl font-bold text-[var(--foreground)]">Settings</h1>

      <Card>
        <div className="p-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Appearance</h2>
          <p className="text-sm text-[var(--muted-foreground)]">Theme and density</p>
        </div>
        <div className="p-4 grid gap-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-[var(--foreground)]">Theme</div>
              <div className="text-xs text-[var(--muted-foreground)]">Switch between light and dark modes</div>
            </div>
            <ThemeToggle />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-[var(--foreground)]">Density</div>
              <div className="text-xs text-[var(--muted-foreground)]">Controls spacing in lists and cards</div>
            </div>
            <div className="flex gap-2">
              {(["comfortable", "compact"] as const).map((d) => (
                <button
                  key={d}
                  className={`px-2.5 py-1.5 text-xs rounded-md border ${
                    prefs.density === d
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-[var(--surface)] text-[var(--foreground)] border-[var(--border)] hover:bg-[var(--muted)]"
                  }`}
                  onClick={() => setPrefs((p) => ({ ...p, density: d }))}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Notifications</h2>
          <p className="text-sm text-[var(--muted-foreground)]">Control success/failure alerts</p>
        </div>
        <div className="p-4 grid gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!prefs.emailOnFailure}
              onChange={(e) => setPrefs((p) => ({ ...p, emailOnFailure: e.target.checked }))}
            />
            Email on failure
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!prefs.slackOnSuccess}
              onChange={(e) => setPrefs((p) => ({ ...p, slackOnSuccess: e.target.checked }))}
            />
            Slack on success
          </label>
        </div>
      </Card>

      <Card>
        <div className="p-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">General</h2>
          <p className="text-sm text-[var(--muted-foreground)]">Auto-refresh and other preferences</p>
        </div>
        <div className="p-4 grid gap-3">
          <label className="text-sm">Auto-refresh interval (seconds)</label>
          <input
            type="number"
            min={10}
            value={prefs.autoRefreshSeconds}
            onChange={(e) => setPrefs((p) => ({ ...p, autoRefreshSeconds: Math.max(10, Number(e.target.value) || 10) }))}
            className="w-32 bg-[var(--surface)] border border-[var(--border)] rounded px-2 py-1"
          />
          <div>
            <Button variant="outline" onClick={save}>Save Preferences</Button>
          </div>
        </div>
      </Card>
    </main>
  );
}
