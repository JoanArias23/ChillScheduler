"use client";

import Modal from "@/components/ui/Modal";
import Tabs, { TabItem } from "@/components/Tabs";
import Card from "@/components/ui/Card";
import { useMemo, useState } from "react";
import type { Schema } from "@/amplify/data/resource";

type Job = Schema["Job"]["type"];
type JobExecution = Schema["JobExecution"]["type"];

export default function JobDetailModal({
  open,
  onClose,
  job,
  executions = [],
}: {
  open: boolean;
  onClose: () => void;
  job: Job | null;
  executions?: JobExecution[];
}) {
  const [tab, setTab] = useState("overview");
  const tabs: TabItem[] = [
    { key: "overview", label: "Overview" },
    { key: "recent", label: "Recent Executions" },
    { key: "schedule", label: "Schedule Preview" },
  ];

  const upcoming = useMemo(() => {
    // mock next 10 times
    return Array.from({ length: 10 }).map((_, i) =>
      new Date(Date.now() + (i + 1) * 60 * 60 * 1000).toLocaleString()
    );
  }, [job?.id]);

  if (!job) return null;
  return (
    <Modal open={open} onClose={onClose} title={job.name}>
      <Tabs items={tabs} activeKey={tab} onChange={setTab} />
      {tab === "overview" && (
        <div className="grid gap-3">
          <Card className="p-3">
            <div className="text-sm text-[var(--muted-foreground)]">Prompt</div>
            <div className="text-sm whitespace-pre-wrap">{job.prompt}</div>
          </Card>
          <Card className="p-3">
            <div className="text-sm text-[var(--muted-foreground)]">Schedule</div>
            <div className="text-sm font-mono">{job.schedule}</div>
          </Card>
        </div>
      )}
      {tab === "recent" && (
        <div className="grid gap-2">
          {executions.length === 0 ? (
            <div className="text-sm text-[var(--muted-foreground)]">No executions yet.</div>
          ) : (
            executions.slice(0, 10).map((e) => (
              <Card key={String(e.id)} className="p-3">
                <div className="text-sm">
                  <span className="font-medium">{String(e.status).toUpperCase()}</span>
                  <span className="text-[var(--muted-foreground)]"> · {new Date(String(e.startedAt)).toLocaleString()}</span>
                </div>
                <div className="text-xs text-[var(--muted-foreground)] mt-1">{JSON.stringify(e.response ?? {})}</div>
              </Card>
            ))
          )}
        </div>
      )}
      {tab === "schedule" && (
        <Card className="p-3">
          <div className="text-sm text-[var(--muted-foreground)] mb-2">Next 10 scheduled runs</div>
          <ul className="list-disc pl-5 text-sm">
            {upcoming.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </Card>
      )}
    </Modal>
  );
}

