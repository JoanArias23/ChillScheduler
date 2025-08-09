"use client";

import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { TEMPLATES } from "@/components/templates";
import { useRouter } from "next/navigation";

export default function TemplatesPage() {
  const router = useRouter();
  return (
    <main className="max-w-[960px] mx-auto px-4 py-6 grid gap-4">
      <h1 className="text-2xl font-bold text-[var(--foreground)]">Job Templates</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TEMPLATES.map((t) => (
          <Card key={t.id} className="p-4 flex flex-col gap-2">
            <div className="text-lg font-semibold text-[var(--foreground)]">{t.name}</div>
            <div className="text-sm text-[var(--muted-foreground)]">{t.description}</div>
            <div className="text-xs text-[var(--muted-foreground)]">Default schedule: <span className="font-mono">{t.schedule}</span></div>
            <div className="mt-2">
              <Button onClick={() => router.push(`/?template=${t.id}`)}>Use Template</Button>
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}

