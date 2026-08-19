import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { TopBar } from "@/components/top-bar";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { runPlanner } from "@/lib/ai.functions";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CalendarClock, Copy, Download, FileText, Loader2, Palette, Pencil, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { exportMarkdownToPDF, type PdfTheme } from "@/lib/pdf-export";

const ACCENTS = [
  { name: "Emerald", value: "#064e3b" },
  { name: "Gold", value: "#c9a84c" },
  { name: "Blue", value: "#2563eb" },
  { name: "Plum", value: "#7c3aed" },
  { name: "Rose", value: "#be123c" },
  { name: "Slate", value: "#334155" },
];

export const Route = createFileRoute("/planner")({
  head: () => ({
    meta: [
      { title: "Task Planner — Synergy Mind AI" },
      { name: "description", content: "Turn goals and deadlines into an AI-optimized weekly schedule. Balance research, deep work, and tasks across your week with smart priorities." },
      { property: "og:title", content: "AI Task Planner — Synergy Mind AI" },
      { property: "og:description", content: "Generate an AI-optimized weekly schedule from your goals and deadlines." },
      { property: "og:url", content: "https://synergy-mind-ai.lovable.app/planner" },
    ],
    links: [{ rel: "canonical", href: "https://synergy-mind-ai.lovable.app/planner" }],
  }),
  component: Planner,
});

function Planner() {
  const { t } = useTranslation();
  const run = useServerFn(runPlanner);
  const [goals, setGoals] = useState("");
  const [deadline, setDeadline] = useState("");
  const [hoursPerDay, setHours] = useState(6);
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [output, setOutput] = useState("");
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);
  const [decorating, setDecorating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [planTitle, setPlanTitle] = useState("");
  const [planSubtitle, setPlanSubtitle] = useState("");
  const [theme, setTheme] = useState<PdfTheme>({
    accent: "#064e3b",
    font: "helvetica",
    header: "band",
    cover: false,
    format: "a4",
  });

  const plan = editing ? draft : draft || output;

  const onRun = async () => {
    if (!goals.trim()) return;
    setLoading(true); setOutput("");
    try {
      setDraft("");
      const { result } = await run({ data: { goals, deadline: deadline || undefined, hoursPerDay, priority } });
      setOutput(result);
      setDraft(result);
    } catch (e) { toast.error((e as Error).message); }
    finally { setLoading(false); }
  };

  return (
    <>
      <TopBar title={t("planner.title")} />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-[360px_1fr] gap-6">
          <section className="rounded-xl border border-border bg-card p-6 h-fit">
            <div className="flex items-center gap-2 mb-1">
              <CalendarClock className="size-4 text-primary" />
              <h2 className="font-semibold">{t("planner.heading")}</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">{t("planner.intro")}</p>

            <label className="text-xs font-medium">{t("planner.goals")}</label>
            <textarea value={goals} onChange={(e) => setGoals(e.target.value)} rows={6}
              placeholder={t("planner.goalsPlaceholder")}
              className="mt-1 w-full px-3 py-2 rounded-md border border-border bg-background text-sm" />

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium">{t("planner.deadline")}</label>
                <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-md border border-border bg-background text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium">{t("planner.hoursPerDay")}</label>
                <input type="number" min={1} max={16} value={hoursPerDay} onChange={(e) => setHours(+e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-md border border-border bg-background text-sm" />
              </div>
            </div>

            <label className="mt-3 block text-xs font-medium">{t("planner.priority")}</label>
            <div className="mt-1 flex gap-2">
              {(["low", "medium", "high"] as const).map((p) => (
                <button key={p} onClick={() => setPriority(p)}
                  className={`flex-1 px-3 py-1.5 rounded-md text-xs capitalize border ${priority === p ? "bg-primary text-primary-foreground border-primary" : "border-border"}`}>{t(`planner.${p}`)}</button>
              ))}
            </div>

            <button onClick={onRun} disabled={loading || !goals.trim()}
              className="mt-4 w-full px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="size-4 animate-spin" /> : <CalendarClock className="size-4" />}
              {loading ? t("planner.building") : t("planner.generate")}
            </button>
          </section>

          <section className="rounded-xl border border-border bg-card p-6 min-h-[400px]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">{t("planner.yourPlan")}</h3>
              {plan && (
                <div className="flex flex-wrap gap-1">
                  <button onClick={() => setEditing((v) => !v)}
                    className={`px-2.5 py-1.5 rounded-md text-xs flex items-center gap-1.5 border ${editing ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}
                    aria-label={editing ? t("planner.preview") : t("planner.edit")}>
                    <Pencil className="size-3.5" /> {editing ? t("planner.preview") : t("planner.edit")}
                  </button>
                  <button onClick={() => setDecorating((v) => !v)}
                    className={`px-2.5 py-1.5 rounded-md text-xs flex items-center gap-1.5 border ${decorating ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}
                    aria-label={t("planner.decorate")}>
                    <Palette className="size-3.5" /> {t("planner.decorate")}
                  </button>
                  <button onClick={() => { navigator.clipboard.writeText(plan); toast.success(t("common.copied")); }}
                    className="p-2 rounded-md hover:bg-muted" aria-label={t("common.copy")}><Copy className="size-4" /></button>
                  <button
                    onClick={() => {
                      const blob = new Blob([plan], { type: "text/markdown" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url; a.download = `weekly-plan-${Date.now()}.md`; a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="p-2 rounded-md hover:bg-muted" aria-label={t("planner.exportMd")}><Download className="size-4" /></button>
                  <button
                    onClick={() => exportMarkdownToPDF(plan, {
                      title: planTitle.trim() || t("planner.yourPlan"),
                      subtitle: planSubtitle.trim() || `${hoursPerDay} hrs/day · ${t(`planner.${priority}`)}`,
                      module: t("planner.title"),
                      filename: `weekly-plan-${Date.now()}`,
                      theme,
                    })}
                    className="p-2 rounded-md hover:bg-muted" aria-label={t("common.exportPdf")}><FileText className="size-4" /></button>
                </div>
              )}
            </div>
            {plan && decorating && (
              <div className="mb-4 rounded-lg border border-border bg-muted/40 p-4 grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium">{t("planner.planTitle")}</label>
                    <input value={planTitle} onChange={(e) => setPlanTitle(e.target.value)} placeholder={t("planner.yourPlan")}
                      className="mt-1 w-full px-3 py-2 rounded-md border border-border bg-background text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium">{t("planner.planSubtitle")}</label>
                    <input value={planSubtitle} onChange={(e) => setPlanSubtitle(e.target.value)}
                      className="mt-1 w-full px-3 py-2 rounded-md border border-border bg-background text-sm" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium">{t("planner.accent")}</label>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {ACCENTS.map((a) => (
                      <button key={a.value} onClick={() => setTheme((th) => ({ ...th, accent: a.value }))}
                        aria-label={a.name} title={a.name}
                        className={`size-7 rounded-full border-2 ${theme.accent === a.value ? "border-foreground" : "border-transparent"}`}
                        style={{ backgroundColor: a.value }} />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium">{t("planner.font")}</label>
                  <select value={theme.font} onChange={(e) => setTheme((th) => ({ ...th, font: e.target.value as PdfTheme["font"] }))}
                    className="mt-1 w-full px-3 py-2 rounded-md border border-border bg-background text-sm">
                    <option value="helvetica">Helvetica (sans)</option>
                    <option value="times">Times (serif)</option>
                    <option value="courier">Courier (mono)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium">{t("planner.headerStyle")}</label>
                  <select value={theme.header} onChange={(e) => setTheme((th) => ({ ...th, header: e.target.value as PdfTheme["header"] }))}
                    className="mt-1 w-full px-3 py-2 rounded-md border border-border bg-background text-sm">
                    <option value="band">Colour band</option>
                    <option value="line">Minimal line</option>
                    <option value="none">None</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium">{t("planner.pageSize")}</label>
                  <select value={theme.format} onChange={(e) => setTheme((th) => ({ ...th, format: e.target.value as PdfTheme["format"] }))}
                    className="mt-1 w-full px-3 py-2 rounded-md border border-border bg-background text-sm">
                    <option value="a4">A4</option>
                    <option value="letter">Letter</option>
                  </select>
                </div>
                <label className="sm:col-span-2 flex items-center gap-2 text-xs font-medium">
                  <input type="checkbox" checked={!!theme.cover} onChange={(e) => setTheme((th) => ({ ...th, cover: e.target.checked }))} />
                  {t("planner.coverPage")}
                </label>
              </div>
            )}
            {!plan && !loading && (
              <div className="text-center py-16 text-sm text-muted-foreground">
                {t("planner.empty")}
              </div>
            )}
            {loading && !plan && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> {t("planner.buildingDetailed")}
              </div>
            )}
            {plan && editing && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">{t("planner.editHint")}</p>
                <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={22}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm font-mono leading-relaxed" />
                <div className="mt-2 flex gap-2">
                  <button onClick={() => { setEditing(false); toast.success(t("planner.saved")); }}
                    className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium">{t("planner.preview")}</button>
                  {output && draft !== output && (
                    <button onClick={() => setDraft(output)}
                      className="px-3 py-1.5 rounded-md border border-border text-xs flex items-center gap-1.5"><RotateCcw className="size-3.5" /> {t("planner.reset")}</button>
                  )}
                </div>
              </div>
            )}
            {plan && !editing && (
              <div className="prose-chat">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{plan}</ReactMarkdown>
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
