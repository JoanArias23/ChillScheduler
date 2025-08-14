"use client";

import Header from "@/components/Header";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { useEffect, useMemo, useState, Suspense } from "react";
import { getCurrentUser } from "aws-amplify/auth";
import { useRouter } from "next/navigation";
import EmptyState from "@/components/EmptyState";
import {
  Clock,
  Edit3,
  History,
  Pause,
  Play,
  Search,
  Trash2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Tabs from "@/components/Tabs";
import ScheduleBuilder from "@/components/ScheduleBuilder";
import JobDetailModal from "@/components/JobDetailModal";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { usePrefs } from "@/components/usePrefs";
import { useSearchParams } from "next/navigation";
import { TEMPLATES } from "@/components/templates";
import { useCountdown } from "@/hooks/useCountdown";

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


const TABS = ["Scheduled Jobs", "Create Job", "Execution History"] as const;
type Tab = (typeof TABS)[number];

function HomePage() {
  const [activeTab, setActiveTab] = useState<Tab>("Scheduled Jobs");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("next");
  const [selectedJobForEdit, setSelectedJobForEdit] = useState<Job | null>(null);
  const [detailJob, setDetailJob] = useState<Job | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const configured = typeof window !== "undefined" && !!window.__AMPLIFY_CONFIGURED__;
  const { prefs } = usePrefs();
  const { push } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Check authentication on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        await getCurrentUser();
        setAuthChecked(true);
      } catch {
        // User is not authenticated, redirect to landing page
        router.push("/landing");
      }
    }
    checkAuth();
  }, [router]);

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
        setSelectedJobForEdit({ name: tpl.name, prompt: tpl.prompt, schedule: tpl.schedule } as Job);
        setActiveTab("Create Job");
      }
    } else if (editId) {
      // In connected mode fetch real job; otherwise mock
      (async () => {
        try {
          if (configured) {
            const j = await client.models.Job.get({ id: editId });
            if (j.data) setSelectedJobForEdit(j.data);
          } else {
            setSelectedJobForEdit({ id: editId, name: "Mock Job", prompt: "Edit me", schedule: "0 */4 * * *" } as Job);
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

  // Show loading while checking authentication
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="p-4">
                    <div className="flex flex-col gap-3">
                      <div>
                        <Skeleton className="h-5 w-3/4 mb-2" />
                        <Skeleton className="h-3 w-full" />
                      </div>
                      <div className="flex gap-2">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                      <div className="flex gap-2">
                        <Skeleton className="h-8 w-20" />
                        <Skeleton className="h-8 w-20" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <EmptyState onCreateJob={() => { setSelectedJobForEdit(null); setActiveTab("Create Job"); }} />
            ) : filteredJobs.length === 0 ? (
              <div className="text-gray-500 text-sm">No jobs match your search.</div>
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

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomePage />
    </Suspense>
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
  const [isRunning, setIsRunning] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastExecution, setLastExecution] = useState<JobExecution | null>(null);
  const [showFullResult, setShowFullResult] = useState(false);
  const countdown = useCountdown(job.nextRunAt);
  
  // Fetch last execution result
  useEffect(() => {
    async function fetchLastExecution() {
      if (!job.id || !window.__AMPLIFY_CONFIGURED__) return;
      try {
        const res = await client.models.JobExecution.list({
          filter: { jobId: { eq: job.id as string } },
          limit: 1,
        });
        if (res.data && res.data.length > 0) {
          setLastExecution(res.data[0]);
        }
      } catch (error) {
        console.error("Failed to fetch last execution:", error);
      }
    }
    fetchLastExecution();
  }, [job.id, job.lastRunAt]);
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
    setIsRunning(true);
    setLastError(null);
    try {
      // Call the Lambda function through GraphQL mutation
      const result = await client.mutations.executeJob({
        jobId: job.id as string,
        trigger: 'manual'
      });
      
      if (result.data) {
        push({ message: "Job executed successfully! Check history for results.", tone: "success" });
        setTimeout(() => onChanged(), 1500); // Refresh after a short delay
      } else {
        throw new Error("Execution failed");
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Failed to run job";
      console.error(e);
      setLastError(errorMessage);
      push({ message: errorMessage, tone: "danger" });
    } finally {
      setIsRunning(false);
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
      {/* Last Result Preview */}
      {lastExecution && lastExecution.response && (
        <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-md p-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Last Result:</p>
              <p className="text-xs text-gray-800 dark:text-gray-200 break-words">
                {(() => {
                  const responseText = typeof lastExecution.response === 'string' 
                    ? lastExecution.response 
                    : JSON.stringify(lastExecution.response);
                  return showFullResult 
                    ? responseText
                    : responseText.length > 150 
                      ? responseText.substring(0, 150) + "..."
                      : responseText;
                })()}
              </p>
              {typeof lastExecution.response === 'string' && lastExecution.response.length > 150 && (
                <button
                  onClick={(e) => { e.stopPropagation(); setShowFullResult(!showFullResult); }}
                  className="text-xs text-emerald-600 hover:text-emerald-700 mt-1"
                >
                  {showFullResult ? "Show less" : "Show more"}
                </button>
              )}
            </div>
            {lastExecution.durationMs && (
              <span className="text-xs text-gray-500 flex-shrink-0">
                {(lastExecution.durationMs / 1000).toFixed(1)}s
              </span>
            )}
          </div>
        </div>
      )}
      
      {/* Countdown Timer */}
      <div className="space-y-2">
        <div className={`flex items-center gap-2 ${countdown.isOverdue ? 'text-red-600 dark:text-red-400' : ''}`}>
          <Clock size={14} className={countdown.isOverdue ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'} />
          <span className="text-xs font-medium">
            {countdown.isOverdue ? (
              <span className="text-red-600 dark:text-red-400">{countdown.formatted}</span>
            ) : (
              <>Next run in: <span className="text-emerald-600 dark:text-emerald-400">{countdown.formatted}</span></>
            )}
          </span>
        </div>
        {!countdown.isOverdue && countdown.total > 0 && (
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div 
              className="bg-emerald-600 dark:bg-emerald-400 h-1.5 rounded-full transition-all duration-1000"
              style={{ 
                width: `${Math.max(0, Math.min(100, (1 - countdown.total / (4 * 60 * 60 * 1000)) * 100))}%` 
              }}
            />
          </div>
        )}
        <div className="flex items-center gap-4 text-xs text-[var(--muted-foreground)]">
          <span>Schedule: {job.schedule}</span>
          <span>Last: {timeAgo(job.lastRunAt)}</span>
        </div>
      </div>
      {lastError && (
        <div className="flex items-start gap-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <AlertCircle size={14} className="text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-medium text-red-800 dark:text-red-300">Execution Failed</p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{lastError}</p>
          </div>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Button 
          size="sm" 
          onClick={(e) => { e.stopPropagation(); runNow(); }}
          disabled={isRunning}
        >
          {isRunning ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Running...
            </>
          ) : (
            <>
              <Play size={14} /> Run Now
            </>
          )}
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
      // Create a temporary job for testing
      const tempJobId = `test_${Date.now()}`;
      
      // Store the test job temporarily
      const testJob = await client.models.Job.create({
        id: tempJobId,
        name: `Test: ${name || 'Unnamed'}`,
        prompt,
        systemPrompt: systemPrompt || undefined,
        schedule: '0 0 * * *', // Daily (not actually scheduled)
        enabled: false, // Don't actually schedule it
      });
      
      if (testJob.data) {
        // Execute the test job
        const result = await client.mutations.executeJob({
          jobId: tempJobId,
          trigger: 'manual'
        });
        
        // Clean up the test job
        await client.models.Job.delete({ id: tempJobId });
        
        if (result.data) {
          setMessage(`Test run successful! Check the response in execution history.`);
          push({ message: "Test run completed", tone: "success" });
        } else {
          throw new Error("Test execution failed");
        }
      }
    } catch (e) {
      setMessage(`Test run failed: ${e instanceof Error ? e.message : String(e)}`);
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
    } catch (e) {
      setMessage(`Save failed: ${e instanceof Error ? e.message : String(e)}`);
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
                    [&quot;slack&quot;, &quot;jira&quot;]
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
