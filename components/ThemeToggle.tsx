"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function getStoredTheme(): Theme | null {
  try {
    const t = localStorage.getItem("theme");
    return t === "light" || t === "dark" ? t : null;
  } catch {
    return null;
  }
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const body = document.body;
  root.setAttribute("data-theme", theme);
  body.setAttribute("data-theme", theme);
  try {
    localStorage.setItem("theme", theme);
  } catch {}
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const stored = getStoredTheme();
    const systemDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial: Theme = stored ?? (systemDark ? "dark" : "light");
    setTheme(initial);
    // Defer to ensure DOM is ready
    requestAnimationFrame(() => applyTheme(initial));
  }, []);

  function toggle() {
    const next: Theme = theme === "light" ? "dark" : "light";
    setTheme(next);
    applyTheme(next);
  }

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={toggle}
      className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900 focus:outline-none"
      title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
    >
      {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
      <span className="hidden sm:inline">{theme === "light" ? "Dark" : "Light"}</span>
    </button>
  );
}
