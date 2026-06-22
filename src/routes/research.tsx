import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { TopBar } from "@/components/top-bar";
import { useServerFn } from "@tanstack/react-start";
import { runResearch, analyzeDocument, extractCitation } from "@/lib/ai.functions";
import { supabase } from "@/integrations/supabase/client";
import { getClientId } from "@/lib/client-id";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Copy, Download, FileText, Loader2, Save, Sparkles, Trash2,
  Upload, BookMarked, Wand2, Plus, X,
} from "lucide-react";
import { toast } from "sonner";
import { exportMarkdownToPDF } from "@/lib/pdf-export";
import {
  formatCitation, formatCitationPlain,
  type CitationInput, type CitationStyle, type CitationType,
} from "@/lib/citations";

export const Route = createFileRoute("/research")({
  head: () => ({
    meta: [
      { title: "Research Assistant — ResearchFlow AI" },
      { name: "description", content: "Conduct academic and workplace research with AI. Upload PDFs, generate citations, and export branded reports." },
      { property: "og:title", content: "AI Research Assistant — ResearchFlow AI" },
      { property: "og:description", content: "Upload PDFs, generate summaries, and build citations with AI." },
      { property: "og:url", content: "https://synergy-mind-ai.lovable.app/research" },
    ],
    links: [{ rel: "canonical", href: "https://synergy-mind-ai.lovable.app/research" }],
  }),
  component: ResearchPage,
});

const TEMPLATES = [
  { id: "academic", label: "Academic Research" },
  { id: "business", label: "Business Research" },
  { id: "policy", label: "Policy Analysis" },
  { id: "literature", label: "Literature Review" },
  { id: "summary", label: "Report Summary" },
] as const;

const DOC_TEMPLATES = [
  { id: "summary", label: "Summary & Key Findings" },
  { id: "academic", label: "Academic Critique" },
  { id: "literature", label: "Literature-Review Notes" },
] as const;

type Session = { id: string; template: string; query: string; result: string; created_at: string };
type Tab = "research" | "document" | "citations";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

function ResearchPage() {
  const [tab, setTab] = useState<Tab>("research");

  return (
    <>
      <TopBar title="Research Assistant" />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-5">
          <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
            {[
              { id: "research", label: "AI Research", icon: Sparkles },
              { id: "document", label: "Document Analysis", icon: FileText },
              { id: "citations", label: "Citations", icon: BookMarked },
            ].map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id as Tab)}
                  className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 transition ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="size-4" /> {t.label}
                </button>
              );
            })}
          </div>

          {tab === "research" && <ResearchTab />}
          {tab === "document" && <DocumentTab />}
          {tab === "citations" && <CitationsTab />}
        </div>
      </main>
    </>
  );
}

/* ---------------- AI Research Tab ---------------- */

function ResearchTab() {
  const run = useServerFn(runResearch);
  const [query, setQuery] = useState("");
  const [template, setTemplate] = useState<(typeof TEMPLATES)[number]["id"]>("academic");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);

  const loadSessions = async () => {
    const cid = getClientId();
    const { data } = await supabase
      .from("research_sessions").select("*").eq("client_id", cid)
      .order("created_at", { ascending: false }).limit(20);
    setSessions((data ?? []) as Session[]);
  };
  useEffect(() => { loadSessions(); }, []);

  const onRun = async () => {
    if (!query.trim()) return;
    setLoading(true); setOutput("");
    try {
      const { result } = await run({ data: { query, template } });
      setOutput(result);
    } catch (e) { toast.error((e as Error).message || "Research failed"); }
    finally { setLoading(false); }
  };

  const onSave = async () => {
    if (!output) return;
    await supabase.from("research_sessions").insert({
      client_id: getClientId(), template, query, result: output,
    });
    toast.success("Saved to workspace");
    loadSessions();
  };

  const onCopy = () => { navigator.clipboard.writeText(output); toast.success("Copied"); };
  const onDownloadMd = () => {
    const blob = new Blob([output], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `research-${Date.now()}.md`; a.click();
    URL.revokeObjectURL(url);
  };
  const onExportPDF = () => {
    if (!output) return;
    exportMarkdownToPDF(output, {
      title: query.slice(0, 90) || "Research Report",
      subtitle: TEMPLATES.find((t) => t.id === template)?.label,
      module: "Research Assistant",
      filename: `research-${Date.now()}`,
    });
  };

  const deleteSession = async (id: string) => {
    await supabase.from("research_sessions").delete().eq("id", id);
    loadSessions();
  };

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-6">
      <div className="space-y-6">
        <section className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="size-4 text-primary" />
            <h2 className="font-semibold">New Research Query</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4">Choose a template and describe what you want to research.</p>

          <div className="flex flex-wrap gap-2 mb-3">
            {TEMPLATES.map((t) => (
              <button key={t.id} onClick={() => setTemplate(t.id)}
                className={`px-3 py-1.5 rounded-full text-xs border transition ${
                  template === t.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:border-primary text-muted-foreground"
                }`}>{t.label}</button>
            ))}
          </div>

          <textarea value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Summarize recent advances in retrieval-augmented generation for legal research..."
            rows={6}
            className="w-full px-4 py-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />

          <div className="mt-3 flex gap-2">
            <button onClick={onRun} disabled={loading || !query.trim()}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 flex items-center gap-2">
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {loading ? "Researching..." : "Run Research"}
            </button>
            <button onClick={() => { setQuery(""); setOutput(""); }} className="px-4 py-2 rounded-md border border-border text-sm">Clear</button>
          </div>
        </section>

        {(output || loading) && (
          <OutputCard
            loading={loading}
            output={output}
            actions={
              <>
                <IconBtn onClick={onCopy} title="Copy"><Copy className="size-4" /></IconBtn>
                <IconBtn onClick={onDownloadMd} title="Download Markdown"><Download className="size-4" /></IconBtn>
                <IconBtn onClick={onExportPDF} title="Export PDF"><FileText className="size-4" /></IconBtn>
                <IconBtn onClick={onSave} title="Save session"><Save className="size-4" /></IconBtn>
              </>
            }
          />
        )}
      </div>

      <aside className="rounded-xl border border-border bg-card p-4 h-fit">
        <h3 className="font-semibold text-sm mb-3">Saved Sessions</h3>
        {sessions.length === 0 && <p className="text-xs text-muted-foreground">No saved research yet.</p>}
        <div className="space-y-2">
          {sessions.map((s) => (
            <div key={s.id} className="group p-3 rounded-lg border border-border hover:border-primary cursor-pointer text-xs"
              onClick={() => { setQuery(s.query); setTemplate(s.template as never); setOutput(s.result); }}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground truncate">{s.query}</div>
                  <div className="text-muted-foreground mt-1">{TEMPLATES.find((t) => t.id === s.template)?.label}</div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive">
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}

/* ---------------- Document Analysis Tab ---------------- */

function DocumentTab() {
  const analyze = useServerFn(analyzeDocument);
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [instruction, setInstruction] = useState("");
  const [template, setTemplate] = useState<(typeof DOC_TEMPLATES)[number]["id"]>("summary");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const onPickFile = (f: File | null) => {
    if (!f) return;
    if (f.size > MAX_UPLOAD_BYTES) {
      toast.error("Max file size is 5 MB");
      return;
    }
    const ok =
      f.type === "application/pdf" ||
      f.type.startsWith("text/") ||
      f.name.match(/\.(pdf|txt|md|markdown|csv)$/i);
    if (!ok) {
      toast.error("Supported types: PDF, TXT, MD, CSV");
      return;
    }
    setFile(f);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onPickFile(e.dataTransfer.files?.[0] ?? null);
  };

  const fileToBase64 = (f: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // strip data URL prefix
        const idx = result.indexOf(",");
        resolve(idx >= 0 ? result.slice(idx + 1) : result);
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(f);
    });

  const onAnalyze = async () => {
    if (!file) return;
    setLoading(true); setOutput("");
    try {
      const isPdf = file.type === "application/pdf";
      const payload = {
        filename: file.name,
        mimeType: file.type || "application/octet-stream",
        instruction: instruction || undefined,
        template,
        ...(isPdf
          ? { base64: await fileToBase64(file) }
          : { text: await file.text() }),
      };
      const { result } = await analyze({ data: payload });
      setOutput(result);
    } catch (e) {
      toast.error((e as Error).message || "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const onExportPDF = () => {
    if (!output) return;
    exportMarkdownToPDF(output, {
      title: `Analysis: ${file?.name ?? "Document"}`,
      subtitle: DOC_TEMPLATES.find((d) => d.id === template)?.label,
      module: "Research Assistant · Document Analysis",
      filename: `analysis-${Date.now()}`,
    });
  };

  const onSave = async () => {
    if (!output) return;
    await supabase.from("research_sessions").insert({
      client_id: getClientId(),
      template,
      query: `[Document: ${file?.name ?? "uploaded file"}] ${instruction || "Analyze document"}`,
      result: output,
    });
    toast.success("Saved to research sessions");
  };

  return (
    <section className="rounded-xl border border-border bg-card p-6 space-y-5">
      <div className="flex items-center gap-2">
        <FileText className="size-4 text-primary" />
        <h2 className="font-semibold">Analyze a Document</h2>
      </div>
      <p className="text-xs text-muted-foreground -mt-3">
        Upload a PDF or text file (max 5 MB). AI will summarize, extract key findings, and suggest citations.
      </p>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary hover:bg-muted/40 transition"
      >
        <Upload className="size-6 mx-auto text-muted-foreground mb-2" />
        {file ? (
          <div className="text-sm">
            <div className="font-medium">{file.name}</div>
            <div className="text-xs text-muted-foreground">
              {(file.size / 1024).toFixed(1)} KB · {file.type || "unknown"}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setFile(null); }}
              className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
            >
              <X className="size-3" /> Remove
            </button>
          </div>
        ) : (
          <>
            <div className="text-sm font-medium">Click or drop a PDF / TXT / MD / CSV file</div>
            <div className="text-xs text-muted-foreground mt-1">Max 5 MB · Processed securely via AI gateway</div>
          </>
        )}
        <input
          ref={inputRef} type="file" className="hidden"
          accept=".pdf,.txt,.md,.markdown,.csv,application/pdf,text/*"
          onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {DOC_TEMPLATES.map((t) => (
          <button key={t.id} onClick={() => setTemplate(t.id)}
            className={`px-3 py-1.5 rounded-full text-xs border transition ${
              template === t.id
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border hover:border-primary text-muted-foreground"
            }`}>{t.label}</button>
        ))}
      </div>

      <textarea
        value={instruction}
        onChange={(e) => setInstruction(e.target.value)}
        rows={3}
        placeholder="Optional: tell the AI what to focus on, e.g. 'Focus on methodology and limitations.'"
        className="w-full px-4 py-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
      />

      <div className="flex gap-2">
        <button onClick={onAnalyze} disabled={!file || loading}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 flex items-center gap-2">
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
          {loading ? "Analyzing..." : "Analyze Document"}
        </button>
      </div>

      {(output || loading) && (
        <OutputCard
          loading={loading}
          output={output}
          actions={
            <>
              <IconBtn onClick={() => { navigator.clipboard.writeText(output); toast.success("Copied"); }} title="Copy">
                <Copy className="size-4" />
              </IconBtn>
              <IconBtn onClick={onExportPDF} title="Export PDF"><FileText className="size-4" /></IconBtn>
              <IconBtn onClick={onSave} title="Save"><Save className="size-4" /></IconBtn>
            </>
          }
        />
      )}
    </section>
  );
}

/* ---------------- Citations Tab ---------------- */

const EMPTY_CITATION: CitationInput = {
  type: "journal", authors: "", year: "", title: "",
  source: "", volume: "", issue: "", pages: "", publisher: "", url: "", doi: "",
};

function CitationsTab() {
  const parse = useServerFn(extractCitation);
  const [style, setStyle] = useState<CitationStyle>("apa7");
  const [form, setForm] = useState<CitationInput>(EMPTY_CITATION);
  const [parseText, setParseText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [list, setList] = useState<CitationInput[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("rf_citations");
      if (raw) setList(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);
  const persist = (next: CitationInput[]) => {
    setList(next);
    localStorage.setItem("rf_citations", JSON.stringify(next));
  };

  const update = <K extends keyof CitationInput>(k: K, v: CitationInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const onAdd = () => {
    if (!form.title.trim() && !form.authors.trim()) {
      toast.error("Enter at least an author or title");
      return;
    }
    persist([form, ...list]);
    setForm(EMPTY_CITATION);
    toast.success("Citation added");
  };

  const onRemove = (idx: number) => persist(list.filter((_, i) => i !== idx));

  const onAutoParse = async () => {
    if (!parseText.trim()) return;
    setParsing(true);
    try {
      const { citation } = await parse({ data: { text: parseText } });
      setForm({ ...EMPTY_CITATION, ...citation });
      toast.success("Parsed — review and add");
    } catch (e) {
      toast.error((e as Error).message || "Could not parse");
    } finally { setParsing(false); }
  };

  const copyAll = () => {
    const text = list.map((c) => formatCitationPlain(c, style)).join("\n\n");
    navigator.clipboard.writeText(text);
    toast.success("All citations copied");
  };

  const exportPDF = () => {
    if (list.length === 0) return;
    const md = `# References (${style === "apa7" ? "APA 7" : "Harvard"})\n\n` +
      list.map((c) => `- ${formatCitation(c, style)}`).join("\n\n");
    exportMarkdownToPDF(md, {
      title: "Reference List",
      subtitle: style === "apa7" ? "APA 7th Edition" : "Harvard Style",
      module: "Research Assistant · Citations",
      filename: `references-${Date.now()}`,
    });
  };

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-6">
      <section className="rounded-xl border border-border bg-card p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookMarked className="size-4 text-primary" />
            <h2 className="font-semibold">Citation Builder</h2>
          </div>
          <div className="flex gap-1 rounded-lg border border-border p-0.5">
            {(["apa7", "harvard"] as const).map((s) => (
              <button key={s} onClick={() => setStyle(s)}
                className={`px-2.5 py-1 rounded text-xs ${style === s ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
                {s === "apa7" ? "APA 7" : "Harvard"}
              </button>
            ))}
          </div>
        </div>

        {/* Auto-parse */}
        <div className="rounded-lg border border-dashed border-border p-4">
          <label className="text-xs font-medium flex items-center gap-1.5">
            <Wand2 className="size-3.5 text-primary" /> Auto-fill from a URL, DOI, or pasted reference
          </label>
          <textarea
            value={parseText}
            onChange={(e) => setParseText(e.target.value)}
            placeholder="https://doi.org/10.1038/s41586-023-12345-6  —or—  Smith, J. (2023). Title. Journal Name, 12(3), 45-67."
            rows={2}
            className="mt-2 w-full px-3 py-2 rounded-md border border-border bg-background text-xs"
          />
          <button onClick={onAutoParse} disabled={parsing || !parseText.trim()}
            className="mt-2 px-3 py-1.5 rounded-md bg-foreground text-background text-xs font-medium disabled:opacity-40 flex items-center gap-1.5">
            {parsing ? <Loader2 className="size-3.5 animate-spin" /> : <Wand2 className="size-3.5" />}
            {parsing ? "Parsing..." : "Auto-fill"}
          </button>
        </div>

        {/* Form */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Type">
            <select value={form.type} onChange={(e) => update("type", e.target.value as CitationType)}
              className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm capitalize">
              <option value="journal">Journal article</option>
              <option value="book">Book</option>
              <option value="chapter">Book chapter</option>
              <option value="website">Website</option>
              <option value="report">Report</option>
            </select>
          </Field>
          <Field label="Year">
            <Input v={form.year} on={(v) => update("year", v)} placeholder="2024" />
          </Field>
          <Field label="Author(s)" wide>
            <Input v={form.authors} on={(v) => update("authors", v)} placeholder="Smith, J.; Doe, A." />
          </Field>
          <Field label="Title" wide>
            <Input v={form.title} on={(v) => update("title", v)} placeholder="Article or book title" />
          </Field>
          <Field label={form.type === "website" ? "Site name" : "Journal / Publisher"}>
            <Input v={form.source ?? ""} on={(v) => update("source", v)} placeholder="Nature, BBC News..." />
          </Field>
          <Field label="Publisher">
            <Input v={form.publisher ?? ""} on={(v) => update("publisher", v)} placeholder="Oxford Univ. Press" />
          </Field>
          {form.type === "journal" && (
            <>
              <Field label="Volume"><Input v={form.volume ?? ""} on={(v) => update("volume", v)} placeholder="12" /></Field>
              <Field label="Issue"><Input v={form.issue ?? ""} on={(v) => update("issue", v)} placeholder="3" /></Field>
              <Field label="Pages"><Input v={form.pages ?? ""} on={(v) => update("pages", v)} placeholder="45-67" /></Field>
              <Field label="DOI"><Input v={form.doi ?? ""} on={(v) => update("doi", v)} placeholder="10.1038/..." /></Field>
            </>
          )}
          <Field label="URL" wide>
            <Input v={form.url ?? ""} on={(v) => update("url", v)} placeholder="https://..." />
          </Field>
        </div>

        {/* Live preview */}
        <div className="rounded-lg border border-border bg-muted/40 p-4">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Preview</div>
          <p
            className="text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: renderItalic(formatCitation(form, style)) }}
          />
        </div>

        <div className="flex justify-end">
          <button onClick={onAdd}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2">
            <Plus className="size-4" /> Add to list
          </button>
        </div>
      </section>

      <aside className="rounded-xl border border-border bg-card p-4 h-fit">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">Reference List ({list.length})</h3>
          <div className="flex gap-1">
            <IconBtn onClick={copyAll} title="Copy all" disabled={list.length === 0}>
              <Copy className="size-3.5" />
            </IconBtn>
            <IconBtn onClick={exportPDF} title="Export PDF" disabled={list.length === 0}>
              <FileText className="size-3.5" />
            </IconBtn>
          </div>
        </div>
        {list.length === 0 && <p className="text-xs text-muted-foreground">Add citations to build a reference list.</p>}
        <ol className="space-y-3">
          {list.map((c, i) => (
            <li key={i} className="group text-xs leading-relaxed border-b border-border pb-3 last:border-0">
              <div className="flex justify-between items-start gap-2">
                <span dangerouslySetInnerHTML={{ __html: renderItalic(formatCitation(c, style)) }} />
                <button onClick={() => onRemove(i)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive shrink-0">
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ol>
      </aside>
    </div>
  );
}

/* ---------------- Small UI helpers ---------------- */

function renderItalic(s: string): string {
  // very small markdown-italic renderer for the preview list
  const escaped = s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return escaped.replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

function Field({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "col-span-2" : ""}>
      <label className="text-[11px] font-medium text-muted-foreground">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function Input({ v, on, placeholder }: { v: string; on: (v: string) => void; placeholder?: string }) {
  return (
    <input value={v} onChange={(e) => on(e.target.value)} placeholder={placeholder}
      className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm" />
  );
}

function IconBtn(props: React.ButtonHTMLAttributes<HTMLButtonElement> & { title: string }) {
  const { className = "", children, ...rest } = props;
  return (
    <button
      {...rest}
      className={`p-2 rounded-md hover:bg-muted disabled:opacity-40 ${className}`}
      aria-label={props.title}
    >{children}</button>
  );
}

function OutputCard({ loading, output, actions }: { loading: boolean; output: string; actions: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">AI Output</h3>
        <div className="flex gap-1.5">{actions}</div>
      </div>
      {loading && !output ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
          <Loader2 className="size-4 animate-spin" /> Generating insights...
        </div>
      ) : (
        <div className="prose-chat">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{output}</ReactMarkdown>
        </div>
      )}
    </section>
  );
}
