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
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
        theme === "light" 
          ? "text-gray-600 hover:bg-gray-100" 
          : "text-yellow-400 bg-gray-800 hover:bg-gray-700 border border-gray-600"
      }`}
      title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
    >
      {theme === "light" ? (
        <>
          <Moon size={16} />
          <span className="text-sm font-medium">Dark</span>
        </>
      ) : (
        <>
          <Sun size={16} className="text-yellow-400" />
          <span className="text-sm font-medium text-gray-200">Light</span>
        </>
      )}
    </button>
  );
}
