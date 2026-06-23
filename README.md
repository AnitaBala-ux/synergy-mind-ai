# ResearchFlow AI

**Research smarter. Plan better. Achieve more.**

ResearchFlow AI is a unified AI workspace for academic research, intelligent task planning, smart to-dos, and productivity analytics. It combines an AI research assistant, document analysis, automatic citations, weekly planner, and task/project management into one modern dashboard.

## Live App

- **Published site:** https://synergy-mind-ai.lovable.app
- **Preview site:** https://id-preview--2f9c2f72-e6f8-48b4-a3b5-33ff7ab8fc08.lovable.app

## Features

### AI Research Assistant
- Ask questions, summarize papers, generate literature notes, and explore topics.
- Upload PDFs or documents up to 5 MB and receive summaries with key findings.
- Automatic citation generation in APA 7 and Harvard referencing styles.

### AI Chat
- Conversational assistant with threaded history.
- Export any AI output as a branded PDF report.

### Task Planner
- Turn goals and deadlines into an AI-optimized weekly schedule.
- Configure daily availability, priority, and deadline constraints.
- Export plans to PDF.

### Smart To-Dos
- Track tasks with priorities, due dates, statuses, and project grouping.
- Monitor completion rates and productivity scores.

### Projects
- Organize research and work into color-coded projects.
- Group deliverables and track progress across your workflow.

### Analytics & Productivity
- Automatic productivity score based on task completion.
- Focus-time tracking from tasks and research sessions.
- Weekly trends and streak tracking.

### Academic Guide
- Built-in guide on citing AI-generated content in APA, MLA, Chicago, and Harvard styles.
- Targets best practices for academic integrity with AI writing assistants.

## Tech Stack

- **Framework:** [TanStack Start](https://tanstack.com/start) (React 19, full-stack SSR/SSG)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com) with custom Emerald Prestige design tokens
- **UI Components:** shadcn/ui + Radix UI primitives
- **Backend & Auth:** Lovable Cloud (Supabase) with Row-Level Security
- **AI Gateway:** Lovable AI Gateway
- **Charts:** Recharts
- **PDF Export:** jsPDF
- **Icons:** Lucide React
- **Type Safety:** TypeScript 5 + Zod

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) (recommended) or Node.js
- A Lovable Cloud / Supabase project connected to the app

### Install dependencies

```bash
bun install
```

### Run the development server

```bash
bun dev
```

The app will be available at `http://localhost:8080` by default.

### Build for production

```bash
bun run build
```

### Preview the production build

```bash
bun run preview
```

### Lint and format

```bash
bun run lint
bun run format
```

## Project Structure

```
src/
  components/          # Reusable UI components (TopBar, AppSidebar, shadcn/ui)
  hooks/               # Custom React hooks
  integrations/        # Supabase client, auth middleware, types
  lib/                 # Utilities, AI functions, citations, PDF export
  routes/              # TanStack Start file-based routes
  router.tsx           # Router configuration
  server.ts            # Server entry
  start.ts             # Start configuration
  styles.css           # Global theme and Tailwind v4 tokens
public/                # Static assets (robots.txt, llms.txt)
supabase/              # Supabase config and migrations
```

## Environment Variables

The following variables are injected by Lovable Cloud:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

Server-side secrets (service role keys, API keys) are read inside `createServerFn` handlers via `process.env.*` and are managed by Lovable Cloud.

## SEO & Accessibility

- Unique titles, meta descriptions, Open Graph tags, and canonical links on every route.
- JSON-LD structured data (Organization, WebSite, HowTo).
- Dynamic sitemap at `/sitemap.xml`.
- Semantic HTML, ARIA labels, and accessible color contrast.

## Key Routes

| Route | Description |
|-------|-------------|
| `/` | Dashboard with stats, productivity score, and quick actions |
| `/chat` | AI chat assistant with threaded history |
| `/research` | Research assistant with file upload and citations |
| `/planner` | AI weekly schedule generator |
| `/todo` | Smart task management |
| `/projects` | Project organization |
| `/analytics` | Productivity and focus-time analytics |
| `/guides/citing-ai` | How to cite AI-generated content |
| `/sitemap.xml` | Dynamic XML sitemap |

## Design

The app uses a custom **Emerald Prestige** theme:

- Deep emerald primary with warm gold accents
- Cream surfaces and elegant shadows
- Modern tech typography: **Space Grotesk** (display) + **DM Sans** (body)
- Sidebar dashboard layout

## License

Private — built and maintained via [Lovable](https://lovable.dev).

## Feedback & Support

For issues or feature requests, use the Lovable editor or connect this project to your own GitHub repository for pull-request-based collaboration.
