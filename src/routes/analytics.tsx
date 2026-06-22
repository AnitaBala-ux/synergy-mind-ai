import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TopBar } from "@/components/top-bar";
import { supabase } from "@/integrations/supabase/client";
import { getClientId } from "@/lib/client-id";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export const Route = createFileRoute("/analytics")({
  head: () => ({ meta: [{ title: "Analytics — ResearchFlow AI" }] }),
  component: Analytics,
});

function Analytics() {
  const [data, setData] = useState<{ day: string; completed: number; created: number }[]>([]);
  const [totals, setTotals] = useState({ completed: 0, research: 0, focusHours: 0, streak: 0 });

  useEffect(() => {
    (async () => {
      const cid = getClientId();
      const since = new Date(); since.setDate(since.getDate() - 6);
      const [{ data: tasks }, { data: research }] = await Promise.all([
        supabase.from("tasks").select("created_at,completed_at,status").eq("client_id", cid).gte("created_at", since.toISOString()),
        supabase.from("research_sessions").select("created_at").eq("client_id", cid),
      ]);

      const days: { day: string; completed: number; created: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const label = d.toLocaleDateString(undefined, { weekday: "short" });
        const dayStr = d.toISOString().slice(0, 10);
        const completed = (tasks ?? []).filter((t) => t.completed_at?.slice(0, 10) === dayStr).length;
        const created = (tasks ?? []).filter((t) => t.created_at?.slice(0, 10) === dayStr).length;
        days.push({ day: label, completed, created });
      }
      setData(days);
      setTotals({
        completed: (tasks ?? []).filter((t) => t.status === "completed").length,
        research: research?.length ?? 0,
        focusHours: Math.round((tasks ?? []).filter((t) => t.status === "completed").length * 0.75),
        streak: days.filter((d) => d.completed > 0).length,
      });
    })();
  }, []);

  const cards = [
    { label: "Tasks Completed (week)", value: totals.completed },
    { label: "Research Sessions", value: totals.research },
    { label: "Focus Hours", value: totals.focusHours },
    { label: "Active Days Streak", value: totals.streak },
  ];

  return (
    <>
      <TopBar title="Productivity Analytics" />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((c) => (
            <div key={c.label} className="rounded-xl border border-border bg-card p-5">
              <div className="text-xs text-muted-foreground">{c.label}</div>
              <div className="mt-3 text-3xl font-semibold">{c.value}</div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-semibold mb-1">Weekly Activity</h3>
          <p className="text-xs text-muted-foreground mb-4">Tasks created vs completed over the past 7 days</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
                <Bar dataKey="created" fill="var(--color-muted-foreground)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="completed" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>
    </>
  );
}
