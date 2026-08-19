import { jsPDF } from "jspdf";

export type PdfTheme = {
  /** Accent color as hex, e.g. "#2563EB" */
  accent?: string;
  /** Base font family for the document */
  font?: "helvetica" | "times" | "courier";
  /** Header style: solid color band, thin accent line, or none */
  header?: "band" | "line" | "none";
  /** Add a dedicated cover page */
  cover?: boolean;
  /** Page size */
  format?: "a4" | "letter";
};

export type PdfMeta = {
  title: string;
  subtitle?: string;
  module?: string; // e.g. "Research Assistant"
  filename?: string;
  theme?: PdfTheme;
};

function hexToRgb(hex?: string) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex ?? "");
  if (!m) return { r: 37, g: 99, b: 235 };
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

// Synergy Mind brand colors (match src/styles.css)
const BRAND = { r: 37, g: 99, b: 235 }; // #2563EB
const INK = { r: 17, g: 24, b: 39 };
const MUTED = { r: 107, g: 114, b: 128 };

type Block =
  | { type: "h1" | "h2" | "h3" | "p"; text: string }
  | { type: "li"; text: string; indent: number }
  | { type: "hr" }
  | { type: "blank" };

function stripInline(s: string): string {
  return s
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)");
}

function parseMarkdown(md: string): Block[] {
  const blocks: Block[] = [];
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) { blocks.push({ type: "blank" }); continue; }
    if (/^---+$/.test(line)) { blocks.push({ type: "hr" }); continue; }
    let m;
    if ((m = line.match(/^###\s+(.*)/))) { blocks.push({ type: "h3", text: stripInline(m[1]) }); continue; }
    if ((m = line.match(/^##\s+(.*)/))) { blocks.push({ type: "h2", text: stripInline(m[1]) }); continue; }
    if ((m = line.match(/^#\s+(.*)/))) { blocks.push({ type: "h1", text: stripInline(m[1]) }); continue; }
    if ((m = line.match(/^(\s*)[-*+]\s+(.*)/))) {
      const indent = Math.min(2, Math.floor(m[1].length / 2));
      blocks.push({ type: "li", text: stripInline(m[2]), indent });
      continue;
    }
    if ((m = line.match(/^(\s*)\d+\.\s+(.*)/))) {
      const indent = Math.min(2, Math.floor(m[1].length / 2));
      blocks.push({ type: "li", text: stripInline(m[2]), indent });
      continue;
    }
    blocks.push({ type: "p", text: stripInline(line) });
  }
  return blocks;
}

export function exportMarkdownToPDF(markdown: string, meta: PdfMeta) {
  const theme = meta.theme ?? {};
  const BRAND = hexToRgb(theme.accent);
  const FONT = theme.font ?? "helvetica";
  const headerStyle = theme.header ?? "band";
  const doc = new jsPDF({ unit: "pt", format: theme.format ?? "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginX = 56;
  const contentW = pageW - marginX * 2;
  let y = 0;

  const drawHeader = () => {
    if (headerStyle === "none") { y = 72; return; }
    if (headerStyle === "line") {
      doc.setDrawColor(BRAND.r, BRAND.g, BRAND.b);
      doc.setLineWidth(3);
      doc.line(0, 3, pageW, 3);
      doc.setTextColor(INK.r, INK.g, INK.b);
      doc.setFont(FONT, "bold");
      doc.setFontSize(11);
      doc.text("Synergy Mind AI", marginX, 34);
      doc.setFont(FONT, "normal");
      doc.setFontSize(9);
      doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
      doc.text(meta.module ?? "Report", pageW - marginX, 34, { align: "right" });
      y = 72;
      return;
    }
    doc.setFillColor(BRAND.r, BRAND.g, BRAND.b);
    doc.rect(0, 0, pageW, 64, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont(FONT, "bold");
    doc.setFontSize(14);
    doc.text("Synergy Mind AI", marginX, 30);
    doc.setFont(FONT, "normal");
    doc.setFontSize(9);
    doc.text(meta.module ?? "Report", marginX, 48);
    doc.text(new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }),
      pageW - marginX, 48, { align: "right" });
    y = 96;
  };

  const drawCover = () => {
    doc.setFillColor(BRAND.r, BRAND.g, BRAND.b);
    doc.rect(0, 0, pageW, pageH * 0.42, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont(FONT, "bold");
    doc.setFontSize(28);
    const tl = doc.splitTextToSize(meta.title, contentW);
    doc.text(tl, marginX, pageH * 0.22);
    doc.setFont(FONT, "normal");
    doc.setFontSize(12);
    if (meta.subtitle) doc.text(doc.splitTextToSize(meta.subtitle, contentW), marginX, pageH * 0.22 + tl.length * 30);
    doc.setTextColor(INK.r, INK.g, INK.b);
    doc.setFont(FONT, "bold");
    doc.setFontSize(13);
    doc.text("Synergy Mind AI", marginX, pageH * 0.42 + 48);
    doc.setFont(FONT, "normal");
    doc.setFontSize(10);
    doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
    doc.text(meta.module ?? "Report", marginX, pageH * 0.42 + 66);
    doc.text(new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }),
      marginX, pageH * 0.42 + 82);
    doc.addPage();
  };

  const drawFooter = (pageNum: number, totalPages: number) => {
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.5);
    doc.line(marginX, pageH - 40, pageW - marginX, pageH - 40);
    doc.setFont(FONT, "normal");
    doc.setFontSize(8);
    doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
    doc.text("Generated by Synergy Mind AI · synergy-mind-ai.lovable.app", marginX, pageH - 24);
    doc.text(`Page ${pageNum} / ${totalPages}`, pageW - marginX, pageH - 24, { align: "right" });
  };

  const ensureSpace = (h: number) => {
    if (y + h > pageH - 56) {
      doc.addPage();
      drawHeader();
    }
  };

  if (theme.cover) drawCover();
  drawHeader();

  // Title
  doc.setTextColor(INK.r, INK.g, INK.b);
  doc.setFont(FONT, "bold");
  doc.setFontSize(20);
  const titleLines = doc.splitTextToSize(meta.title, contentW);
  ensureSpace(titleLines.length * 24);
  doc.text(titleLines, marginX, y);
  y += titleLines.length * 24;

  if (meta.subtitle) {
    doc.setFont(FONT, "normal");
    doc.setFontSize(10);
    doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
    const sl = doc.splitTextToSize(meta.subtitle, contentW);
    ensureSpace(sl.length * 14);
    doc.text(sl, marginX, y);
    y += sl.length * 14;
  }
  y += 8;

  // Accent rule
  doc.setDrawColor(BRAND.r, BRAND.g, BRAND.b);
  doc.setLineWidth(2);
  doc.line(marginX, y, marginX + 48, y);
  y += 20;

  doc.setTextColor(INK.r, INK.g, INK.b);
  const blocks = parseMarkdown(markdown);
  for (const b of blocks) {
    if (b.type === "blank") { y += 6; continue; }
    if (b.type === "hr") {
      ensureSpace(12);
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.5);
      doc.line(marginX, y, pageW - marginX, y);
      y += 10;
      continue;
    }
    if (b.type === "h1") {
      doc.setFont(FONT, "bold"); doc.setFontSize(16);
      doc.setTextColor(INK.r, INK.g, INK.b);
      const lines = doc.splitTextToSize(b.text, contentW);
      ensureSpace(lines.length * 20 + 8);
      doc.text(lines, marginX, y); y += lines.length * 20 + 4;
      continue;
    }
    if (b.type === "h2") {
      doc.setFont(FONT, "bold"); doc.setFontSize(13);
      doc.setTextColor(BRAND.r, BRAND.g, BRAND.b);
      const lines = doc.splitTextToSize(b.text, contentW);
      ensureSpace(lines.length * 17 + 6);
      doc.text(lines, marginX, y); y += lines.length * 17 + 2;
      continue;
    }
    if (b.type === "h3") {
      doc.setFont(FONT, "bold"); doc.setFontSize(11);
      doc.setTextColor(INK.r, INK.g, INK.b);
      const lines = doc.splitTextToSize(b.text, contentW);
      ensureSpace(lines.length * 15 + 4);
      doc.text(lines, marginX, y); y += lines.length * 15;
      continue;
    }
    if (b.type === "li") {
      doc.setFont(FONT, "normal"); doc.setFontSize(10.5);
      doc.setTextColor(INK.r, INK.g, INK.b);
      const indent = b.indent * 14;
      const bulletX = marginX + indent;
      const textX = bulletX + 12;
      const lines = doc.splitTextToSize(b.text, contentW - indent - 12);
      ensureSpace(lines.length * 14);
      doc.setFillColor(BRAND.r, BRAND.g, BRAND.b);
      doc.circle(bulletX + 2, y - 3, 1.6, "F");
      doc.text(lines, textX, y);
      y += lines.length * 14;
      continue;
    }
    // paragraph
    doc.setFont(FONT, "normal"); doc.setFontSize(10.5);
    doc.setTextColor(INK.r, INK.g, INK.b);
    const lines = doc.splitTextToSize(b.text, contentW);
    ensureSpace(lines.length * 14);
    doc.text(lines, marginX, y); y += lines.length * 14 + 4;
  }

  // Footers
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    drawFooter(i, total);
  }

  const fname = (meta.filename ?? meta.title).replace(/[^\w-]+/g, "_").slice(0, 80);
  doc.save(`${fname || "synergy-mind"}.pdf`);
}
