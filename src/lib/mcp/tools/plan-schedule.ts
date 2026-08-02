import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { runAi } from "../ai";

export default defineTool({
  name: "plan_schedule",
  title: "Plan a weekly schedule",
  description:
    "Generate an optimized weekly plan with priority matrix and time blocking from a list of goals.",
  inputSchema: {
    goals: z.string().min(3).describe("The goals or tasks to schedule, one per line."),
    deadline: z.string().default("").describe("Optional deadline, e.g. '2026-08-15'."),
    hoursPerDay: z.number().min(1).max(16).default(6).describe("Working hours available per day."),
    priority: z.enum(["low", "medium", "high"]).default("medium").describe("Overall priority."),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async ({ goals, deadline, hoursPerDay, priority }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const text = await runAi(
      "You are an expert productivity planner. Create an optimized weekly schedule in markdown with: Daily Plan (Mon-Sun), Priority Matrix (Urgent/Important quadrants), Time Blocking Suggestions, and Smart Recommendations.",
      `Goals:\n${goals}\n\nDeadline: ${deadline || "flexible"}\nHours available per day: ${hoursPerDay}\nPriority: ${priority}`,
    );
    return { content: [{ type: "text", text }] };
  },
});
