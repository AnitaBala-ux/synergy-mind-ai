import { createFileRoute, Link } from "@tanstack/react-router";
import { TopBar } from "@/components/top-bar";
import { BookOpen, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/guides/citing-ai")({
  head: () => ({
    meta: [
      { title: "How to Cite an AI Writing Assistant in Academic Research (APA, MLA, Chicago)" },
      { name: "description", content: "A practical guide to citing ChatGPT, Gemini, Claude, and other AI writing assistants in APA 7, MLA 9, Chicago, and Harvard — with examples, in-text citations, and academic integrity tips." },
      { property: "og:title", content: "How to Cite an AI Writing Assistant in Academic Research" },
      { property: "og:description", content: "Cite ChatGPT, Gemini, Claude, and other AI writing assistants correctly in APA, MLA, Chicago, and Harvard." },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "https://synergy-mind-ai.lovable.app/guides/citing-ai" },
    ],
    links: [{ rel: "canonical", href: "https://synergy-mind-ai.lovable.app/guides/citing-ai" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: "How to cite AI-generated content in academic research",
          description: "Step-by-step guide for citing AI writing assistants such as ChatGPT and Gemini in APA 7, MLA 9, and Chicago.",
          step: [
            { "@type": "HowToStep", name: "Record the prompt and response", text: "Save the exact prompt you used and the AI's response, plus the date and model version." },
            { "@type": "HowToStep", name: "Pick your citation style", text: "Follow APA 7, MLA 9, or Chicago depending on your institution." },
            { "@type": "HowToStep", name: "Format the reference", text: "Use the author (the AI tool's developer), year, title (your prompt), and version." },
            { "@type": "HowToStep", name: "Disclose AI use", text: "Add a methodology note explaining how AI was used in your work." },
          ],
        }),
      },
    ],
  }),
  component: CitingAIGuide,
});

function CitingAIGuide() {
  return (
    <>
      <TopBar title="Guide: Citing AI" />
      <main className="flex-1 overflow-y-auto p-6 lg:p-10">
        <article className="max-w-3xl mx-auto space-y-8">
          <header className="space-y-3">
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-primary">
              <BookOpen className="size-3.5" /> Academic guide
            </div>
            <h1 className="text-4xl font-bold tracking-tight">How to Cite an AI Writing Assistant in Academic Research</h1>
            <p className="text-muted-foreground text-lg">
              A practical reference for citing ChatGPT, Gemini, Claude, and other AI writing assistants in APA 7, MLA 9, Chicago, and Harvard — with worked examples, in-text citations, and integrity tips.
            </p>
          </header>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">Why citing an AI writing assistant matters</h2>
            <p>
              AI writing assistants are now routine tools for brainstorming, summarizing literature, drafting prose, and polishing arguments. Most universities and journals require you to disclose AI use and cite any text that came from an AI model, the same way you would cite a quote from a book or interview. Failing to do so risks academic integrity violations even when the underlying ideas are your own.
            </p>
            <p>
              This guide explains how to cite an AI writing assistant in four common reference styles: APA 7, MLA 9, Chicago, and Harvard.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">Before you cite: capture the source</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>The <strong>tool name and developer</strong> (e.g. ChatGPT by OpenAI, Gemini by Google).</li>
              <li>The <strong>model version</strong> (e.g. GPT-4o, Gemini 2.5 Flash) and the <strong>date</strong> of the conversation.</li>
              <li>The <strong>exact prompt</strong> you submitted, and the <strong>response</strong> you used.</li>
              <li>A link to the saved conversation if the tool provides one.</li>
            </ul>
            <p className="text-sm text-muted-foreground">
              Tip: Save prompts and responses in the ResearchFlow AI <Link to="/research" className="text-primary underline">Research Assistant</Link> so they stay attached to your project.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">APA 7 (American Psychological Association)</h2>
            <p>APA treats AI output as the product of an algorithm authored by the company that built it.</p>
            <div className="rounded-lg border border-border bg-card p-4 text-sm font-mono">
              OpenAI. (2025). <em>ChatGPT</em> (GPT-4o) [Large language model]. https://chat.openai.com
            </div>
            <p><strong>In-text:</strong> (OpenAI, 2025)</p>
            <p className="text-sm text-muted-foreground">Include the prompt in your methods section or an appendix rather than in the citation itself.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">MLA 9 (Modern Language Association)</h2>
            <p>MLA recommends citing the prompt as the title of the source and the AI tool as the container.</p>
            <div className="rounded-lg border border-border bg-card p-4 text-sm font-mono">
              "Summarize the key findings of social-cognitive theory in 200 words" prompt. <em>ChatGPT</em>, 14 Mar. version, OpenAI, 12 Jun. 2025, chat.openai.com.
            </div>
            <p><strong>In-text:</strong> ("Summarize")</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">Chicago (17th edition)</h2>
            <p>Chicago treats AI conversations as personal communication — usually a footnote rather than a bibliography entry.</p>
            <div className="rounded-lg border border-border bg-card p-4 text-sm font-mono">
              1. ChatGPT, response to prompt by author, "Summarize the key findings of social-cognitive theory," OpenAI, June 12, 2025.
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">Harvard referencing</h2>
            <p>Harvard styles vary by institution; a common pattern is:</p>
            <div className="rounded-lg border border-border bg-card p-4 text-sm font-mono">
              OpenAI (2025) <em>ChatGPT (GPT-4o)</em> [Large language model]. Available at: https://chat.openai.com (Accessed: 12 June 2025).
            </div>
            <p><strong>In-text:</strong> (OpenAI, 2025)</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">Disclosing AI use in your methodology</h2>
            <p>
              Even with citations, most reviewers expect a short note describing <em>how</em> you used AI: for ideation, summarization, copy-editing, or drafting. State which sections it touched and how you verified the output. This separates appropriate use from undisclosed substitution.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">Common mistakes to avoid</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Citing AI as if it were a peer-reviewed source — it isn't.</li>
              <li>Forgetting to record the prompt and model version.</li>
              <li>Pasting AI output verbatim without verification — always cross-check facts and citations the model produces.</li>
              <li>Ignoring your institution's policy. Many journals and universities now have specific AI disclosure rules.</li>
            </ul>
          </section>

          <section className="rounded-xl border border-border bg-gradient-to-br from-primary/10 to-accent/10 p-6">
            <h2 className="text-xl font-semibold">Generate citations automatically</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              ResearchFlow AI's Research Assistant can extract and format references in APA 7 and Harvard style — including AI-generated sources.
            </p>
            <Link to="/research" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
              Open Research Assistant <ArrowRight className="size-4" />
            </Link>
          </section>
        </article>
      </main>
    </>
  );
}
