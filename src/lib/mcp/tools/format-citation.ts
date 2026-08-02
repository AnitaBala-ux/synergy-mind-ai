import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { runAi } from "../ai";

export default defineTool({
  name: "format_citation",
  title: "Format a citation",
  description:
    "Turn a URL, DOI, or raw reference into a formatted citation in APA 7, MLA 9, Chicago, or Harvard style.",
  inputSchema: {
    reference: z
      .string()
      .min(5)
      .describe("A URL, DOI, raw citation text, or description of the source."),
    style: z
      .enum(["apa", "mla", "chicago", "harvard"])
      .default("apa")
      .describe("Citation style to output."),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async ({ reference, style }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const text = await runAi(
      `You are a citation formatter. Return the reference formatted in ${style.toUpperCase()} style. Output the formatted citation only, followed by a short bullet list of any fields that were unavailable. Never invent data.`,
      reference,
    );
    return { content: [{ type: "text", text }] };
  },
});
