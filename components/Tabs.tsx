"use client";

import { ReactNode } from "react";

export type TabItem = { key: string; label: string; icon?: ReactNode };

export default function Tabs({
  items,
  activeKey,
  onChange,
}: {
  items: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="border-b border-gray-200 mb-4">
      <nav className="-mb-px flex gap-2">
        {items.map((t) => {
          const active = t.key === activeKey;
          return (
            <button
              key={t.key}
              onClick={() => onChange(t.key)}
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                active
                  ? "border-blue-600 text-blue-700"
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
              }`}
            >
              <span className="inline-flex items-center gap-1">
                {t.icon}
                {t.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

