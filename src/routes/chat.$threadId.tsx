import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useTranslation } from "react-i18next";
import { TopBar } from "@/components/top-bar";
import { supabase } from "@/integrations/supabase/client";
import { getClientId } from "@/lib/client-id";
import { MessageSquarePlus, Send, Loader2, Trash2, Bot, User, FileText } from "lucide-react";
import { toast } from "sonner";
import { exportMarkdownToPDF } from "@/lib/pdf-export";

export const Route = createFileRoute("/chat/$threadId")({
  head: () => ({
    meta: [
      { title: "AI Assistant — ResearchFlow AI" },
      { name: "description", content: "Conversational AI assistant for research, writing, and productivity." },
      { property: "og:title", content: "AI Assistant — ResearchFlow AI" },
      { property: "og:description", content: "Multi-thread AI chat for research, writing, and productivity." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ChatPage,
});

type Thread = { id: string; title: string; updated_at: string };

function ChatPage() {
  const { t } = useTranslation();
  const { threadId } = useParams({ from: "/chat/$threadId" });
  const navigate = useNavigate();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [initialMessages, setInitialMessages] = useState<UIMessage[] | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState("");

  const loadThreads = async () => {
    const cid = getClientId();
    const { data } = await supabase
      .from("threads")
      .select("id,title,updated_at")
      .eq("client_id", cid)
      .order("updated_at", { ascending: false });
    setThreads(data ?? []);
  };

  useEffect(() => { loadThreads(); }, []);

  useEffect(() => {
    setInitialMessages(null);
    (async () => {
      const { data } = await supabase
        .from("messages")
        .select("id,role,parts")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true });
      const msgs: UIMessage[] = (data ?? []).map((m) => ({
        id: m.id,
        role: m.role as UIMessage["role"],
        parts: m.parts as UIMessage["parts"],
      }));
      setInitialMessages(msgs);
    })();
  }, [threadId]);

  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/chat", body: { threadId } }),
    [threadId],
  );

  const { messages, sendMessage, status } = useChat({
    id: threadId,
    messages: initialMessages ?? [],
    transport,
    onError: (e) => toast.error(e.message || "Chat failed"),
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => { inputRef.current?.focus(); }, [threadId, status]);

  const isLoading = status === "submitted" || status === "streaming";

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    // Update thread title if it's still "New Chat"
    const current = threads.find((t) => t.id === threadId);
    if (current && current.title === "New Chat") {
      const newTitle = text.slice(0, 60);
      await supabase.from("threads").update({ title: newTitle }).eq("id", threadId);
      loadThreads();
    }
    await sendMessage({ text });
  };

  const newThread = async () => {
    const cid = getClientId();
    const { data, error } = await supabase
      .from("threads")
      .insert({ client_id: cid, title: "New Chat" })
      .select("id")
      .single();
    if (error || !data) { toast.error("Could not create chat"); return; }
    await loadThreads();
    navigate({ to: "/chat/$threadId", params: { threadId: data.id } });
  };

  const deleteThread = async (id: string) => {
    await supabase.from("threads").delete().eq("id", id);
    await loadThreads();
    if (id === threadId) {
      const remaining = threads.filter((t) => t.id !== id);
      if (remaining[0]) navigate({ to: "/chat/$threadId", params: { threadId: remaining[0].id } });
      else navigate({ to: "/chat" });
    }
  };

  const suggestions = [
    t("chat.suggestion1"),
    t("chat.suggestion2"),
    t("chat.suggestion3"),
    t("chat.suggestion4"),
  ];

  return (
    <>
      <TopBar title={t("chat.title")} />
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Thread list */}
        <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border bg-card/50">
          <div className="p-3">
            <button
              onClick={newThread}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
            >
              <MessageSquarePlus className="size-4" /> {t("chat.newChat")}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-1">
            {threads.length === 0 && (
              <p className="px-3 py-6 text-xs text-muted-foreground text-center">{t("chat.noConversations")}</p>
            )}
            {threads.map((t) => (
              <div key={t.id} className={`group flex items-center gap-1 rounded-md ${t.id === threadId ? "bg-muted" : "hover:bg-muted/60"}`}>
                <Link
                  to="/chat/$threadId"
                  params={{ threadId: t.id }}
                  className="flex-1 px-3 py-2 text-sm truncate"
                >
                  {t.title}
                </Link>
                <button
                  onClick={(e) => { e.preventDefault(); deleteThread(t.id); }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 mr-1 hover:text-destructive"
                  aria-label={t("chat.deleteChat")}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        </aside>

        {/* Conversation */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="px-4 lg:px-8 pt-3 flex justify-end">
            <button
              onClick={() => {
                if (messages.length === 0) { toast.error(t("chat.noMessages")); return; }
                const md = messages.map((m) => {
                  const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
                  return `## ${m.role === "user" ? "You" : "SynergyMind AI"}\n\n${text}`;
                }).join("\n\n---\n\n");
                const current = threads.find((th) => th.id === threadId);
                exportMarkdownToPDF(md, {
                  title: current?.title || t("chat.title"),
                  subtitle: `${messages.length} messages`,
                  module: t("chat.title"),
                  filename: `chat-${Date.now()}`,
                });
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border text-xs hover:bg-muted"
            >
              <FileText className="size-3.5" /> {t("common.exportPdf")}
            </button>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 lg:px-8 py-6">
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.length === 0 && (
                <div className="text-center py-12">
                  <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
                    <Bot className="size-7" />
                  </div>
                  <h2 className="text-2xl font-semibold">{t("chat.howCanIHelp")}</h2>
                  <p className="text-sm text-muted-foreground mt-1">{t("chat.subtitle")}</p>
                  <div className="mt-6 grid sm:grid-cols-2 gap-2 max-w-2xl mx-auto">
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => { setInput(s); inputRef.current?.focus(); }}
                        className="text-left p-3 rounded-lg border border-border hover:border-primary hover:bg-muted/40 text-sm transition"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m) => {
                const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
                const isUser = m.role === "user";
                return (
                  <div key={m.id} className={`flex gap-3 ${isUser ? "justify-end" : ""}`}>
                    {!isUser && (
                      <div className="size-8 shrink-0 rounded-full bg-primary/10 text-primary grid place-items-center">
                        <Bot className="size-4" />
                      </div>
                    )}
                    <div className={isUser ? "max-w-[80%] rounded-2xl px-4 py-2.5 bg-primary text-primary-foreground" : "max-w-[80%] prose-chat text-foreground"}>
                      {isUser ? (
                        <p className="whitespace-pre-wrap text-sm">{text}</p>
                      ) : (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
                      )}
                    </div>
                    {isUser && (
                      <div className="size-8 shrink-0 rounded-full bg-muted grid place-items-center">
                        <User className="size-4" />
                      </div>
                    )}
                  </div>
                );
              })}

              {status === "submitted" && (
                <div className="flex gap-3">
                  <div className="size-8 shrink-0 rounded-full bg-primary/10 text-primary grid place-items-center">
                    <Bot className="size-4" />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="size-3.5 animate-spin" /> {t("chat.thinking")}
                  </div>
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="border-t border-border bg-card p-4">
            <div className="max-w-3xl mx-auto flex gap-2 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
                }}
                rows={1}
                placeholder={t("chat.placeholder")}
                className="flex-1 resize-none px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 max-h-40"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="size-11 rounded-xl bg-primary text-primary-foreground grid place-items-center disabled:opacity-40 hover:opacity-90"
              >
                {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              </button>
            </div>
            <p className="max-w-3xl mx-auto mt-2 text-[11px] text-muted-foreground text-center">
              {t("chat.disclaimer")}
            </p>
          </form>
        </div>
      </div>
    </>
  );
}
