"use client";

import Modal from "@/components/ui/Modal";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Command = { id: string; label: string; action: () => void; keywords?: string[] };

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && (e.key.toLowerCase() === "k")) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const commands: Command[] = useMemo(() => [
    { id: "dash", label: "Go to Dashboard", action: () => router.push("/") },
    { id: "create", label: "Create Job", action: () => router.push("/?template=") },
    { id: "settings", label: "Open Settings", action: () => router.push("/settings") },
    { id: "profile", label: "Open Profile", action: () => router.push("/profile") },
    { id: "templates", label: "Browse Templates", action: () => router.push("/templates") },
    { id: "theme", label: "Toggle Theme", action: () => {
      const next = (document.documentElement.getAttribute("data-theme") === "dark") ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      document.body.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch {}
    }},
  ], [router]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return commands.filter(c => c.label.toLowerCase().includes(q) || (c.keywords || []).some(k => k.includes(q)));
  }, [commands, query]);

  return (
    <Modal open={open} onClose={() => setOpen(false)} title="Command Palette (⌘K)">
      <div className="grid gap-2">
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type a command..."
          className="w-full bg-[var(--surface)] border border-[var(--border)] rounded px-3 py-2 text-sm"
        />
        <div className="grid">
          {filtered.length === 0 ? (
            <div className="text-sm text-[var(--muted-foreground)]">No results</div>
          ) : (
            filtered.map((c) => (
              <button
                key={c.id}
                className="text-left px-2 py-2 hover:bg-[var(--muted)] rounded"
                onClick={() => { c.action(); setOpen(false); }}
              >
                {c.label}
              </button>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}

