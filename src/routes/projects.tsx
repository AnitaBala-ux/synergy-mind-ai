import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TopBar } from "@/components/top-bar";
import { supabase } from "@/integrations/supabase/client";
import { getClientId } from "@/lib/client-id";
import { FolderKanban, Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "Projects — ResearchFlow AI" },
      { name: "description", content: "Organize your research and work into color-coded projects, keep deliverables grouped, and track progress across your AI-assisted workflow." },
      { property: "og:title", content: "Projects — ResearchFlow AI" },
      { property: "og:description", content: "Organize research and work into color-coded projects in your ResearchFlow AI workspace." },
      { property: "og:url", content: "https://synergy-mind-ai.lovable.app/projects" },
    ],
    links: [{ rel: "canonical", href: "https://synergy-mind-ai.lovable.app/projects" }],
  }),
  component: Projects,
});

type Project = { id: string; name: string; description: string | null; color: string };

const COLORS = ["#2563EB", "#14B8A6", "#F59E0B", "#EF4444", "#8B5CF6", "#10B981"];

function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [color, setColor] = useState(COLORS[0]);

  const load = async () => {
    const cid = getClientId();
    const { data } = await supabase.from("projects").select("*").eq("client_id", cid).order("created_at", { ascending: false });
    setProjects((data ?? []) as Project[]);
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!name.trim()) return;
    await supabase.from("projects").insert({ client_id: getClientId(), name, description: desc || null, color });
    setName(""); setDesc("");
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("projects").delete().eq("id", id);
    load();
  };

  return (
    <>
      <TopBar title="Projects" />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-semibold mb-3">Create Project</h2>
            <div className="grid md:grid-cols-[1fr_1fr_auto] gap-3">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Project name"
                className="px-3 py-2 rounded-md border border-border bg-background text-sm" />
              <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description (optional)"
                className="px-3 py-2 rounded-md border border-border bg-background text-sm" />
              <button onClick={add} className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2">
                <Plus className="size-4" /> Add
              </button>
            </div>
            <div className="mt-3 flex gap-2">
              {COLORS.map((c) => (
                <button key={c} onClick={() => setColor(c)}
                  className={`size-6 rounded-full ring-2 ${color === c ? "ring-foreground" : "ring-transparent"}`}
                  style={{ background: c }} />
              ))}
            </div>
          </section>

          <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.length === 0 && (
              <div className="col-span-full text-center py-16 text-sm text-muted-foreground">No projects yet.</div>
            )}
            {projects.map((p) => (
              <div key={p.id} className="group rounded-xl border border-border bg-card p-5 hover:shadow-md transition">
                <div className="flex items-start gap-3">
                  <div className="size-10 rounded-lg grid place-items-center text-white" style={{ background: p.color }}>
                    <FolderKanban className="size-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{p.name}</div>
                    {p.description && <p className="text-xs text-muted-foreground mt-0.5">{p.description}</p>}
                  </div>
                  <button onClick={() => remove(p.id)} aria-label="Delete project" className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive">
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </section>
        </div>
      </main>
    </>
  );
}
