import { auth, defineMcp } from "@lovable.dev/mcp-js";
import researchAnalyze from "./tools/research-analyze";
import formatCitation from "./tools/format-citation";
import planSchedule from "./tools/plan-schedule";
import listNotifications from "./tools/list-notifications";

const projectRef = import.meta.env['VITE_SUPABASE_PROJECT_ID'] ?? "project-ref-unset";

export default defineMcp({
  name: "synergymind-ai",
  title: "SynergyMind AI",
  version: "0.1.0",
  instructions:
    "Tools for SynergyMind AI, an AI research and productivity workspace. Use `research_analyze` for structured research reports, `format_citation` for APA/MLA/Chicago/Harvard references, `plan_schedule` for weekly planning, and `list_notifications` to read the signed-in user's notifications.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [researchAnalyze, formatCitation, planSchedule, listNotifications],
});
