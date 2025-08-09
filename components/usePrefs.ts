"use client";

import { useEffect, useState } from "react";

export type Prefs = {
  autoRefreshSeconds: number;
  density: "comfortable" | "compact";
};

const DEFAULT_PREFS: Prefs = {
  autoRefreshSeconds: 30,
  density: "comfortable",
};

export function usePrefs() {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("prefs");
      if (raw) {
        const obj = JSON.parse(raw);
        setPrefs({ ...DEFAULT_PREFS, ...obj });
      }
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("prefs", JSON.stringify(prefs));
    } catch {}
  }, [prefs]);
  return { prefs, setPrefs } as const;
}

