import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/top-bar";
import { AlertTriangle, ShieldCheck, Scale, Eye, Users, Lock } from "lucide-react";

export const Route = createFileRoute("/responsible-ai")({
  head: () => ({ meta: [{ title: "Responsible AI — ResearchFlow AI" }] }),
  component: ResponsibleAI,
});

const sections = [
  { icon: AlertTriangle, title: "AI Limitations", body: "AI models can produce incorrect, outdated, or hallucinated information. Always verify outputs against authoritative sources before academic, professional, legal, medical, or financial use." },
  { icon: Scale, title: "Bias Awareness", body: "Large language models reflect biases present in their training data. Critically evaluate outputs that involve people, cultures, demographics, or contested topics." },
  { icon: Lock, title: "Data Privacy", body: "Do not paste personally identifiable, confidential, medical, or otherwise sensitive information into AI prompts. Treat the assistant as a public-facing system." },
  { icon: Eye, title: "Human Verification", body: "AI assists — it does not replace expert judgement. A qualified human must review and approve any decision, recommendation, or content produced." },
  { icon: Users, title: "Ethical Use", body: "Do not use ResearchFlow AI to deceive, plagiarize, harass, surveil, generate harmful content, or violate institutional policies or laws." },
  { icon: ShieldCheck, title: "Maintained by App Owner", body: "This page is maintained by the app owner to summarize current Responsible AI commitments and is not a certification or independent verification." },
];

function ResponsibleAI() {
  return (
    <>
      <TopBar title="Responsible AI" />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <section className="rounded-xl p-6 border border-amber-500/30 bg-amber-500/10">
            <div className="flex gap-3 items-start">
              <AlertTriangle className="size-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h2 className="font-semibold">Important Notice</h2>
                <p className="text-sm mt-1 text-foreground/90">
                  This system provides AI-generated outputs intended to assist users. Responses may contain inaccuracies and should be independently verified before academic, professional, legal, medical, or financial use.
                </p>
              </div>
            </div>
          </section>

          <div className="grid md:grid-cols-2 gap-4">
            {sections.map((s) => {
              const Icon = s.icon;
              return (
                <section key={s.title} className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="size-8 rounded-lg bg-primary/10 text-primary grid place-items-center"><Icon className="size-4" /></div>
                    <h3 className="font-semibold">{s.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{s.body}</p>
                </section>
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
}
