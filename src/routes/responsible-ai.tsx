import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { TopBar } from "@/components/top-bar";
import { AlertTriangle, ShieldCheck, Scale, Eye, Users, Lock } from "lucide-react";

export const Route = createFileRoute("/responsible-ai")({
  head: () => ({
    meta: [
      { title: "Responsible AI — SynergyMind AI" },
      { name: "description", content: "How SynergyMind AI approaches accuracy, bias, privacy, and human oversight. Read our commitments for using AI safely in academic and professional work." },
      { property: "og:title", content: "Responsible AI — SynergyMind AI" },
      { property: "og:description", content: "Our commitments on accuracy, bias, privacy, and human oversight when using AI." },
      { property: "og:url", content: "https://synergy-mind-ai.lovable.app/responsible-ai" },
    ],
    links: [{ rel: "canonical", href: "https://synergy-mind-ai.lovable.app/responsible-ai" }],
  }),
  component: ResponsibleAI,
});

function ResponsibleAI() {
  const { t } = useTranslation();

  const sections = [
    { icon: AlertTriangle, title: t("responsible.limitsTitle"), body: t("responsible.limitsBody") },
    { icon: Scale, title: t("responsible.biasTitle"), body: t("responsible.biasBody") },
    { icon: Lock, title: t("responsible.privacyTitle"), body: t("responsible.privacyBody") },
    { icon: Eye, title: t("responsible.verifyTitle"), body: t("responsible.verifyBody") },
    { icon: Users, title: t("responsible.ethicsTitle"), body: t("responsible.ethicsBody") },
    { icon: ShieldCheck, title: t("responsible.ownerTitle"), body: t("responsible.ownerBody") },
  ];

  return (
    <>
      <TopBar title={t("responsible.title")} />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <section className="rounded-xl p-6 border border-amber-500/30 bg-amber-500/10">
            <div className="flex gap-3 items-start">
              <AlertTriangle className="size-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h2 className="font-semibold">{t("responsible.noticeTitle")}</h2>
                <p className="text-sm mt-1 text-foreground/90">{t("responsible.notice")}</p>
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
