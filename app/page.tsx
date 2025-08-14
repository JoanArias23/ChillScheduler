"use client";

import Header from "@/components/Header";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { useEffect, useMemo, useState } from "react";
import {
  Clock,
  Edit3,
  History,
  Pause,
  Play,
  Search,
  Trash2,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Tabs from "@/components/Tabs";
import ScheduleBuilder from "@/components/ScheduleBuilder";
import Modal from "@/components/ui/Modal";
import JobDetailModal from "@/components/JobDetailModal";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { usePrefs } from "@/components/usePrefs";
import { useSearchParams } from "next/navigation";
import { TEMPLATES } from "@/components/templates";
import { useRouter } from "next/navigation";

type Job = Schema["Job"]["type"];
type JobExecution = Schema["JobExecution"]["type"];

const client = generateClient<Schema>();

function timeAgo(date?: string | Date | null) {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

function classNames(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(" ");
}

const TABS = ["Scheduled Jobs", "Create Job", "Execution History"] as const;
type Tab = (typeof TABS)[number];

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("Scheduled Jobs");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("next");
  const [selectedJobForEdit, setSelectedJobForEdit] = useState<Job | null>(null);
  const [detailJob, setDetailJob] = useState<Job | null>(null);
  const configured = typeof window !== "undefined" && !!window.__AMPLIFY_CONFIGURED__;
  const { prefs } = usePrefs();
  const { push } = useToast();
  const searchParams = useSearchParams();

  async function refreshJobs() {
    setLoadingJobs(true);
    try {
      if (configured) {
        const res = await client.models.Job.list({});
        setJobs(res.data ?? []);
      } else {
        // lightweight mock mode
        setJobs([
          {
            id: "mock-1",
            name: "Bitcoin News Summary",
            prompt: "Fetch Bitcoin news and summarize top 3 stories.",
            systemPrompt: undefined,
            schedule: "0 */4 * * *",
            enabled: true,
            maxTurns: 10,
            lastRunAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            nextRunAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
            lastRunStatus: "success",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          } as unknown as Job,
        ]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingJobs(false);
    }
  }

  useEffect(() => {
    refreshJobs();
    const id = setInterval(refreshJobs, Math.max(10, prefs.autoRefreshSeconds) * 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configured, prefs.autoRefreshSeconds]);

  // Support template deep-linking and edit routing
  useEffect(() => {
    const tplId = searchParams.get("template");
    const editId = searchParams.get("edit");
    if (tplId) {
      const tpl = TEMPLATES.find((t) => t.id === tplId);
      if (tpl) {
        setSelectedJobForEdit({ name: tpl.name, prompt: tpl.prompt, schedule: tpl.schedule } as any);
        setActiveTab("Create Job");
      }
    } else if (editId) {
      // In connected mode fetch real job; otherwise mock
      (async () => {
        try {
          if (configured) {
            const j = await client.models.Job.get({ id: editId });
            if (j.data) setSelectedJobForEdit(j.data as any);
          } else {
            setSelectedJobForEdit({ id: editId, name: "Mock Job", prompt: "Edit me", schedule: "0 */4 * * *" } as any);
          }
          setActiveTab("Create Job");
        } catch {}
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "/") {
        e.preventDefault();
        const el = document.getElementById("job-search");
        if (el) (el as HTMLInputElement).focus();
      } else if (e.key.toLowerCase() === "n") {
        setSelectedJobForEdit(null);
        setActiveTab("Create Job");
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const filteredJobs = useMemo(() => {
    let arr = jobs;
    if (statusFilter !== "all") {
      arr = arr.filter((j) => (j.lastRunStatus || "").toString() === statusFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      arr = arr.filter((j) => [j.name, j.prompt, j.schedule].some((s) => (s || "").toLowerCase().includes(q)));
    }
    switch (sortBy) {
      case "next":
        arr = [...arr].sort((a, b) => new Date(a.nextRunAt || 0).getTime() - new Date(b.nextRunAt || 0).getTime());
        break;
      case "last":
        arr = [...arr].sort((a, b) => new Date(b.lastRunAt || 0).getTime() - new Date(a.lastRunAt || 0).getTime());
        break;
      case "name":
        arr = [...arr].sort((a, b) => String(a.name).localeCompare(String(b.name)));
        break;
      default:
        break;
    }
    return arr;
  }, [jobs, search, statusFilter, sortBy]);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-[1280px] mx-auto px-4 py-6">
        <Tabs
          items={TABS.map((t) => ({ key: t, label: t }))}
          activeKey={activeTab}
          onChange={(k) => setActiveTab(k as Tab)}
        />

        {activeTab === "Scheduled Jobs" && (
          <section>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2 bg-[var(--surface)] border border-[var(--border)] rounded-md px-3 py-2 w-full sm:w-[28rem] shadow-sm">
                <Search size={16} className="text-gray-400" />
                <input
                  id="job-search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full outline-none text-sm"
                  placeholder="Search jobs by name or prompt"
                />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-[var(--surface)] border border-[var(--border)] rounded px-2 py-1 text-sm"
                  title="Filter by status"
                >
                  <option value="all">All statuses</option>
                  <option value="success">Active</option>
                  <option value="running">Running</option>
                  <option value="failed">Failed</option>
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-[var(--surface)] border border-[var(--border)] rounded px-2 py-1 text-sm"
                  title="Sort jobs"
                >
                  <option value="next">Sort by next run</option>
                  <option value="last">Sort by last run</option>
                  <option value="name">Sort by name</option>
                </select>
                <Button variant="outline" onClick={refreshJobs}>Refresh</Button>
                <Button onClick={() => { setSelectedJobForEdit(null); setActiveTab("Create Job"); }}>
                  New Job
                </Button>
              </div>
            </div>

            {loadingJobs ? (
              <div className="text-gray-500 text-sm">Loading jobs…</div>
            ) : filteredJobs.length === 0 ? (
              <div className="text-gray-500 text-sm">No jobs found.</div>
            ) : (
              <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${prefs.density === 'compact' ? 'sm:grid-cols-3 lg:grid-cols-4' : ''}`}>
                {filteredJobs.map((job) => (
                  <JobCard
                    key={job.id as string}
                    job={job}
                    onEdit={() => {
                      setSelectedJobForEdit(job);
                      setActiveTab("Create Job");
                    }}
                    onChanged={() => { refreshJobs(); push({ message: "Job updated", tone: "success" }); }}
                    onViewHistory={() => setActiveTab("Execution History")}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === "Create Job" && (
          <section>
            <CreateJobForm
              initial={selectedJobForEdit ?? undefined}
              onSaved={() => {
                setActiveTab("Scheduled Jobs");
                refreshJobs();
              }}
            />
          </section>
        )}

        {activeTab === "Execution History" && (
          <section>
            <ExecutionHistory />
          </section>
        )}
      </main>
      {/* Detail modal retained for future uses; primary flow navigates to job page */}
      <JobDetailModal open={!!detailJob} onClose={() => setDetailJob(null)} job={detailJob} />
    </div>
  );
}

function StatusBadge({ status }: { status?: string | null }) {
  const map: Record<string, { label: string; tone: Parameters<typeof Badge>[0]["tone"] }> = {
    success: { label: "Active", tone: "success" },
    failed: { label: "Failed", tone: "danger" },
    running: { label: "Running", tone: "info" },
  } as const;
  const item = status ? map[status] : undefined;
  if (!item) return <Badge tone="warning">Paused</Badge>;
  return <Badge tone={item.tone}>{item.label}</Badge>;
}

function JobCard({
  job,
  onEdit,
  onChanged,
  onViewHistory,
}: {
  job: Job;
  onEdit: () => void;
  onChanged: () => void;
  onViewHistory: () => void;
}) {
  const router = useRouter();
  const { push } = useToast();
  function prefsClass() {
    try {
      const raw = localStorage.getItem("prefs");
      const density = raw ? (JSON.parse(raw).density as string) : "comfortable";
      return density === "compact" ? "p-3" : "p-4";
    } catch {
      return "p-4";
    }
  }
  async function toggleEnabled() {
    if (typeof window === "undefined") return;
    if (window.__AMPLIFY_CONFIGURED__) {
      const newEnabled = !job.enabled;
      await client.models.Job.update({ id: job.id as string, enabled: newEnabled });
      
      // Update the schedule to enable/disable it
      try {
        await client.mutations.manageSchedule({
          action: 'update',
          jobId: job.id as string,
          schedule: job.schedule,
          enabled: newEnabled,
        });
        console.log('Schedule toggled successfully');
      } catch (scheduleError) {
        console.error('Failed to toggle schedule:', scheduleError);
      }
      
      onChanged();
    }
  }

  async function remove() {
    if (!confirm("Delete this job? This cannot be undone.")) return;
    if (typeof window === "undefined") return;
    if (window.__AMPLIFY_CONFIGURED__) {
      // Delete the schedule first
      try {
        await client.mutations.manageSchedule({
          action: 'delete',
          jobId: job.id as string,
        });
        console.log('Schedule deleted successfully');
      } catch (scheduleError) {
        console.error('Failed to delete schedule:', scheduleError);
      }
      
      // Then delete the job
      await client.models.Job.delete({ id: job.id as string });
      onChanged();
    }
    push({ message: "Job deleted", tone: "success" });
  }

  async function runNow() {
    try {
      const res = await fetch("http://claude.chinchilla-ai.com:3000/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: job.prompt, system: job.systemPrompt }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      push({ message: "Run started. Check history for results.", tone: "info" });
    } catch (e) {
      console.error(e);
      push({ message: "Failed to run job.", tone: "danger" });
    }
  }

  return (
    <Card
      className={`relative flex flex-col gap-3 ${prefsClass()} p-4 cursor-pointer hover:shadow-md`}
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/jobs/${job.id}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          router.push(`/jobs/${job.id}`);
        }
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="font-semibold text-[var(--foreground)]">{job.name}</span>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5 break-words line-clamp-2">{job.prompt}</p>
        </div>
        <StatusBadge status={job.lastRunStatus as string} />
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs text-[var(--muted-foreground)]">
        <div className="flex items-center gap-1">
          <Clock size={14} className="opacity-60" /> Next: {timeAgo(job.nextRunAt)}
        </div>
        <div className="flex items-center gap-1">
          <Clock size={14} className="opacity-60" /> Last: {timeAgo(job.lastRunAt)}
        </div>
        <div className="col-span-2">Schedule: {job.schedule}</div>
      </div>
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Button size="sm" onClick={(e) => { e.stopPropagation(); runNow(); }}>
          <Play size={14} /> Run Now
        </Button>
        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); toggleEnabled(); }}>
          <Pause size={14} /> {job.enabled ? "Pause" : "Resume"}
        </Button>
        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
          <Edit3 size={14} /> Edit
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={(e) => { e.stopPropagation(); remove(); }}
          className="text-red-700 hover:bg-red-50 hover:border-red-200"
        >
          <Trash2 size={14} /> Delete
        </Button>
        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onViewHistory(); }}>
          <History size={14} /> View History
        </Button>
      </div>
    </Card>
  );
}

function CreateJobForm({
  initial,
  onSaved,
}: {
  initial?: Partial<Job>;
  onSaved: () => void;
}) {
  const { push } = useToast();
  const configured = typeof window !== "undefined" && !!window.__AMPLIFY_CONFIGURED__;
  const [name, setName] = useState(initial?.name ?? "");
  const [prompt, setPrompt] = useState(initial?.prompt ?? "");
  const [systemPrompt, setSystemPrompt] = useState(initial?.systemPrompt ?? "");
  const [enabled, setEnabled] = useState<boolean>(initial?.enabled ?? true);
  const [schedule, setSchedule] = useState<string>(initial?.schedule ?? "0 */4 * * *");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function testRun() {
    try {
      const res = await fetch("http://claude.chinchilla-ai.com:3000/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, system: systemPrompt }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json().catch(() => ({}));
      setMessage(`Test run successful${data?.id ? ` (id ${data.id})` : ""}.`);
      push({ message: "Test run completed", tone: "success" });
    } catch (e: any) {
      setMessage(`Test run failed: ${e?.message ?? e}`);
      push({ message: "Test run failed", tone: "danger" });
    }
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      if (!configured) {
        setMessage("Saved locally (disconnected mode)");
        onSaved();
        return;
      }
      
      let jobResult;
      if (initial?.id) {
        // Update existing job
        jobResult = await client.models.Job.update({
          id: initial.id as string,
          name,
          prompt,
          systemPrompt: systemPrompt || undefined,
          schedule,
          enabled,
        });
      } else {
        // Create new job
        jobResult = await client.models.Job.create({
          name,
          prompt,
          systemPrompt: systemPrompt || undefined,
          schedule,
          enabled,
        });
      }
      
      // Set up the schedule with EventBridge
      if (jobResult.data?.id) {
        try {
          await client.mutations.manageSchedule({
            action: initial?.id ? 'update' : 'create',
            jobId: jobResult.data.id,
            schedule,
            enabled,
          });
          console.log('Schedule configured successfully');
        } catch (scheduleError) {
          console.error('Failed to configure schedule:', scheduleError);
          // Don't fail the whole operation, just log the error
          setMessage("Job saved but schedule setup failed. Check logs.");
        }
      }
      
      setMessage(initial?.id ? "Job updated successfully" : "Job saved successfully");
      push({ message: initial?.id ? "Job updated" : "Job saved", tone: "success" });
      onSaved();
    } catch (e: any) {
      setMessage(`Save failed: ${e?.message ?? e}`);
      push({ message: "Save failed", tone: "danger" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <div className="p-4 border-b border-[var(--border)]">
        <h2 className="text-lg font-semibold text-gray-900">{initial?.id ? "Edit Job" : "Create Job"}</h2>
        <p className="text-sm text-gray-500">Describe what you want in plain English, then set a schedule.</p>
      </div>
      <div className="p-4 grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Job Name</label>
          <input
            className="mt-1 w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Daily Standup Reminder"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">AI Prompt</label>
          <textarea
            className="mt-1 w-full min-h-28 bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Get all 'In Progress' Jira tickets and post a summary to #eng-standup"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            maxLength={2000}
          />
          <div className="mt-1 text-xs text-gray-500">Recommended &lt; 500 characters</div>
        </div>

        <details className="rounded-md bg-[var(--muted)] p-3 border border-[color:var(--border)]">
          <summary className="text-sm font-medium text-gray-800 cursor-pointer">Advanced Options</summary>
          <div className="mt-3 grid gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">System Prompt</label>
              <textarea
                className="mt-1 w-full min-h-24 bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Additional context for the AI"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="enabled"
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
              />
              <label htmlFor="enabled" className="text-sm text-gray-700">Enable on save</label>
            </div>
          </div>
        </details>

        <div>
          <label className="block text-sm font-medium text-[var(--foreground)]">Schedule</label>
          <div className="mt-2">
            <ScheduleBuilder value={schedule} onChange={setSchedule} />
          </div>
        </div>

        {message && (
          <div className="text-sm px-3 py-2 rounded bg-[var(--muted)] border border-[color:var(--border)] text-gray-700 dark:text-gray-200">{message}</div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={testRun}>
            Test Run
          </Button>
          <Button
            type="button"
            disabled={saving || !name || !prompt || !schedule}
            onClick={save}
          >
            {initial?.id ? "Save Changes" : "Save & Enable"}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function ExecutionHistory() {
  const configured = typeof window !== "undefined" && !!window.__AMPLIFY_CONFIGURED__;
  const [items, setItems] = useState<JobExecution[]>([]);
  const [loading, setLoading] = useState(false);
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        if (configured) {
          const res = await client.models.JobExecution.list({});
          setItems(res.data ?? []);
        } else {
          setItems([
            {
              id: "mock-exec-1",
              jobId: "mock-1",
              status: "success",
              startedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
              completedAt: new Date(Date.now() - 4.7 * 60 * 1000).toISOString(),
              durationMs: 18_000,
              response: { summary: "3 stories summarized" },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            } as unknown as JobExecution,
          ]);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [configured]);

  return (
    <Card>
      <div className="p-4 border-b border-[var(--border)]">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">Execution History</h2>
        <p className="text-sm text-[var(--muted-foreground)]">Recent job executions with status and duration.</p>
      </div>
      <div className="divide-y">
        {loading ? (
          <div className="p-4">
            <div className="grid gap-2">
              <Skeleton className="h-6" />
              <Skeleton className="h-6" />
              <Skeleton className="h-6" />
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="p-4 text-sm text-[var(--muted-foreground)]">No executions yet.</div>
        ) : (
          items.map((it) => (
            <div key={it.id as string} className="p-4">
              <button
                className="w-full text-left flex items-center justify-between gap-4"
                onClick={() => {
                  const id = String(it.id);
                  setOpenIds((prev) => {
                    const n = new Set(prev);
                    n.has(id) ? n.delete(id) : n.add(id);
                    return n;
                  });
                }}
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium text-[var(--foreground)]">{it.status?.toUpperCase()}</div>
                  <div className="text-xs text-[var(--muted-foreground)]">
                    Started {timeAgo(it.startedAt)} • Duration {Math.round(((it.durationMs ?? 0) / 1000) * 10) / 10}s
                  </div>
                </div>
                <div className="text-xs text-[var(--muted-foreground)] truncate max-w-[50%]">
                  {typeof it.response === "string" ? it.response : JSON.stringify(it.response ?? {})}
                </div>
              </button>
              {openIds.has(String(it.id)) && (
                <div className="mt-3 text-xs grid gap-2">
                  <div className="text-[var(--muted-foreground)]">Prompt</div>
                  <div className="font-mono bg-[var(--muted)] border border-[var(--border)] rounded p-2 overflow-auto">
                    {JSON.stringify({ prompt: "Example prompt used for this run" })}
                  </div>
                  <div className="text-[var(--muted-foreground)]">Response</div>
                  <div className="font-mono bg-[var(--muted)] border border-[var(--border)] rounded p-2 overflow-auto">
                    {typeof it.response === "string" ? it.response : JSON.stringify(it.response ?? {}, null, 2)}
                  </div>
                  <div className="text-[var(--muted-foreground)]">Tools</div>
                  <div className="font-mono bg-[var(--muted)] border border-[var(--border)] rounded p-2 overflow-auto">
                    ["slack", "jira"]
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
