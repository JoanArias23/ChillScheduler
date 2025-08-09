"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Tabs from "@/components/Tabs";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { ArrowLeft, Clock, Edit3, Pause, Play, Trash2 } from "lucide-react";

type Job = Schema["Job"]["type"];
type JobExecution = Schema["JobExecution"]["type"];

const client = generateClient<Schema>();

export default function JobPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { push } = useToast();
  const configured = typeof window !== "undefined" && !!window.__AMPLIFY_CONFIGURED__;

  const [job, setJob] = useState<Job | null>(null);
  const [execs, setExecs] = useState<JobExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        if (configured) {
          const j = await client.models.Job.get({ id });
          setJob(j.data as any);
          const e = await client.models.JobExecution.list({ filter: { jobId: { eq: id } } });
          setExecs(e.data ?? []);
        } else {
          // mock content
          setJob({
            id,
            name: "Bitcoin News Summary",
            prompt: "Fetch Bitcoin news and summarize top 3 stories.",
            schedule: "0 */4 * * *",
            enabled: true,
            lastRunAt: new Date(Date.now() - 3600_000).toISOString(),
            nextRunAt: new Date(Date.now() + 3600_000).toISOString(),
            lastRunStatus: "success",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          } as any);
          setExecs([
            {
              id: id + "-exec-1",
              jobId: id,
              status: "success",
              startedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
              completedAt: new Date(Date.now() - 4.7 * 60 * 1000).toISOString(),
              durationMs: 18000,
              response: { summary: "3 stories summarized" },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            } as any,
          ]);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, configured]);

  async function runNow() {
    if (!job) return;
    try {
      const res = await fetch("http://claude.chinchilla-ai.com:3000/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: job.prompt, system: (job as any).systemPrompt }),
      });
      if (!res.ok) throw new Error("Run failed");
      push({ message: "Run started", tone: "info" });
    } catch {
      push({ message: "Run failed", tone: "danger" });
    }
  }

  async function toggleEnabled() {
    if (!job) return;
    if (configured) {
      await client.models.Job.update({ id: job.id as string, enabled: !job.enabled });
      setJob({ ...(job as any), enabled: !job.enabled });
    } else {
      setJob({ ...(job as any), enabled: !job.enabled });
    }
    push({ message: job.enabled ? "Job paused" : "Job resumed", tone: "success" });
  }

  async function removeJob() {
    if (!job) return;
    if (!confirm("Delete this job?")) return;
    if (configured) await client.models.Job.delete({ id: job.id as string });
    push({ message: "Job deleted", tone: "success" });
    router.push("/");
  }

  const upcoming = useMemo(() => Array.from({ length: 10 }).map((_, i) => new Date(Date.now() + (i + 1) * 3600_000).toLocaleString()), [job?.id]);

  return (
    <main className="max-w-[960px] mx-auto px-4 py-6 grid gap-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push("/")}> <ArrowLeft size={16} /> Back</Button>
          <h1 className="text-xl font-bold text-[var(--foreground)]">{job?.name || "Job"}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={runNow}><Play size={14} /> Run Now</Button>
          <Button size="sm" variant="outline" onClick={toggleEnabled}><Pause size={14} /> {job?.enabled ? "Pause" : "Resume"}</Button>
          <Button size="sm" variant="outline" onClick={() => router.push(`/?edit=${id}`)}> <Edit3 size={14} /> Edit</Button>
          <Button size="sm" variant="outline" className="text-red-700 hover:bg-red-50 hover:border-red-200" onClick={removeJob}><Trash2 size={14} /> Delete</Button>
        </div>
      </div>

      {loading || !job ? (
        <div className="grid gap-3">
          <Skeleton className="h-8" />
          <Skeleton className="h-32" />
          <Skeleton className="h-48" />
        </div>
      ) : (
        <>
          <Card className="p-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="text-[var(--muted-foreground)]">Schedule</div>
              <div className="font-mono">{job.schedule}</div>
              <div className="text-[var(--muted-foreground)]">Next Run</div>
              <div className="flex items-center gap-1"><Clock size={14} className="opacity-60" /> {new Date(String(job.nextRunAt || Date.now())).toLocaleString()}</div>
              <div className="text-[var(--muted-foreground)]">Last Run</div>
              <div className="flex items-center gap-1"><Clock size={14} className="opacity-60" /> {new Date(String(job.lastRunAt || Date.now())).toLocaleString()}</div>
            </div>
          </Card>

          <Tabs
            items={[{ key: "overview", label: "Overview" }, { key: "recent", label: "Recent Executions" }, { key: "schedule", label: "Schedule Preview" }]}
            activeKey={tab}
            onChange={setTab}
          />

          {tab === "overview" && (
            <Card className="p-4">
              <div className="text-sm text-[var(--muted-foreground)] mb-1">Prompt</div>
              <div className="whitespace-pre-wrap text-sm">{job.prompt}</div>
            </Card>
          )}

          {tab === "recent" && (
            <div className="grid gap-2">
              {execs.length === 0 ? (
                <div className="text-sm text-[var(--muted-foreground)]">No executions yet.</div>
              ) : (
                execs.slice(0, 10).map((e) => (
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
            <Card className="p-4">
              <div className="text-sm text-[var(--muted-foreground)] mb-2">Next 10 scheduled runs</div>
              <ul className="list-disc pl-5 text-sm">
                {upcoming.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </Card>
          )}
        </>
      )}
    </main>
  );
}
