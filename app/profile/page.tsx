"use client";

import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useEffect, useState } from "react";
import { User } from "lucide-react";

type Profile = {
  name: string;
  email: string;
  timezone: string;
  bio: string;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile>({
    name: "Abelino Chinchilla",
    email: "abelino@example.com",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    bio: "I love building automation and tooling.",
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem("profile");
      if (stored) setProfile(JSON.parse(stored));
    } catch {}
  }, []);

  function save() {
    try {
      localStorage.setItem("profile", JSON.stringify(profile));
      alert("Profile saved");
    } catch {}
  }

  return (
    <main className="max-w-[960px] mx-auto px-4 py-6 grid gap-4">
      <h1 className="text-2xl font-bold text-[var(--foreground)]">My Profile</h1>

      <Card>
        <div className="p-4 flex items-center gap-4 border-b border-[var(--border)]">
          <div className="w-14 h-14 rounded-full bg-[var(--muted)] flex items-center justify-center border border-[var(--border)]">
            <User />
          </div>
          <div>
            <div className="text-lg font-semibold text-[var(--foreground)]">{profile.name}</div>
            <div className="text-sm text-[var(--muted-foreground)]">{profile.email}</div>
          </div>
        </div>
        <div className="p-4 grid gap-3">
          <label className="text-sm">Name</label>
          <input
            className="bg-[var(--surface)] border border-[var(--border)] rounded px-3 py-2 text-sm"
            value={profile.name}
            onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
          />
          <label className="text-sm">Email</label>
          <input
            className="bg-[var(--surface)] border border-[var(--border)] rounded px-3 py-2 text-sm"
            value={profile.email}
            onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
          />
          <label className="text-sm">Timezone</label>
          <input
            className="bg-[var(--surface)] border border-[var(--border)] rounded px-3 py-2 text-sm"
            value={profile.timezone}
            onChange={(e) => setProfile((p) => ({ ...p, timezone: e.target.value }))}
          />
          <label className="text-sm">Bio</label>
          <textarea
            className="bg-[var(--surface)] border border-[var(--border)] rounded px-3 py-2 text-sm min-h-24"
            value={profile.bio}
            onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
          />
          <div>
            <Button variant="outline" onClick={save}>Save Profile</Button>
          </div>
        </div>
      </Card>

      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="font-semibold mb-1 text-[var(--foreground)]">Usage</div>
          <div className="text-sm text-[var(--muted-foreground)]">This week: 12 executions</div>
          <div className="text-sm text-[var(--muted-foreground)]">Most active job: News Digest</div>
        </Card>
        <Card className="p-4">
          <div className="font-semibold mb-1 text-[var(--foreground)]">Shortcuts</div>
          <div className="text-sm text-[var(--muted-foreground)]">Press / to focus search</div>
          <div className="text-sm text-[var(--muted-foreground)]">Press N to create a job</div>
        </Card>
      </div>
    </main>
  );
}

