export type CitationStyle = "apa7" | "harvard";

export type CitationType = "journal" | "book" | "website" | "report" | "chapter";

export type CitationInput = {
  type: CitationType;
  authors: string; // "Smith, J.; Doe, A." or "Smith, John and Doe, Alice"
  year: string;
  title: string;
  source?: string; // Journal name, publisher, or website name
  volume?: string;
  issue?: string;
  pages?: string;
  publisher?: string;
  url?: string;
  doi?: string;
  accessed?: string; // ISO date for websites
};

function parseAuthors(raw: string): { surname: string; initials: string; full: string }[] {
  if (!raw.trim()) return [];
  return raw
    .split(/;|\band\b|,(?=\s*[A-Z][a-z])/g)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((name) => {
      // Try "Surname, First Middle" form first
      if (name.includes(",")) {
        const [surname, rest = ""] = name.split(",").map((p) => p.trim());
        const initials = rest
          .split(/\s+/)
          .filter(Boolean)
          .map((p) => p[0].toUpperCase() + ".")
          .join(" ");
        return { surname, initials, full: name };
      }
      // "First Middle Surname"
      const parts = name.split(/\s+/);
      const surname = parts.pop() ?? name;
      const initials = parts.map((p) => p[0].toUpperCase() + ".").join(" ");
      return { surname, initials, full: name };
    });
}

function joinApa(authors: ReturnType<typeof parseAuthors>): string {
  if (authors.length === 0) return "";
  const formatted = authors.map((a) => `${a.surname}, ${a.initials}`.trim());
  if (formatted.length === 1) return formatted[0];
  if (formatted.length === 2) return `${formatted[0]}, & ${formatted[1]}`;
  if (formatted.length <= 20) {
    return formatted.slice(0, -1).join(", ") + `, & ${formatted[formatted.length - 1]}`;
  }
  return formatted.slice(0, 19).join(", ") + ", ... " + formatted[formatted.length - 1];
}

function joinHarvard(authors: ReturnType<typeof parseAuthors>): string {
  if (authors.length === 0) return "";
  const formatted = authors.map((a) => `${a.surname}, ${a.initials}`.trim());
  if (formatted.length === 1) return formatted[0];
  if (formatted.length === 2) return `${formatted[0]} and ${formatted[1]}`;
  if (formatted.length === 3) return `${formatted[0]}, ${formatted[1]} and ${formatted[2]}`;
  return `${formatted[0]} et al.`;
}

function italic(s: string) { return `*${s}*`; }

export function formatCitation(input: CitationInput, style: CitationStyle): string {
  const authors = parseAuthors(input.authors);
  const year = input.year.trim() || "n.d.";
  const title = input.title.trim();
  const src = (input.source ?? "").trim();
  const pub = (input.publisher ?? "").trim();
  const url = (input.url ?? "").trim();
  const doi = (input.doi ?? "").trim();
  const vol = (input.volume ?? "").trim();
  const iss = (input.issue ?? "").trim();
  const pages = (input.pages ?? "").trim();
  const accessed = (input.accessed ?? "").trim();

  if (style === "apa7") {
    const authorStr = joinApa(authors);
    const lead = authorStr ? `${authorStr} (${year}).` : `(${year}).`;
    const parts: string[] = [lead];
    if (input.type === "journal") {
      parts.push(`${title}.`);
      let journal = italic(src);
      if (vol) journal += `, ${italic(vol)}`;
      if (iss) journal += `(${iss})`;
      if (pages) journal += `, ${pages}`;
      parts.push(`${journal}.`);
    } else if (input.type === "book") {
      parts.push(`${italic(title)}.`);
      if (pub) parts.push(`${pub}.`);
    } else if (input.type === "chapter") {
      parts.push(`${title}.`);
      if (src) parts.push(`In ${italic(src)}${pages ? ` (pp. ${pages})` : ""}.`);
      if (pub) parts.push(`${pub}.`);
    } else if (input.type === "report") {
      parts.push(`${italic(title)}.`);
      if (pub) parts.push(`${pub}.`);
    } else { // website
      parts.push(`${italic(title)}.`);
      if (src) parts.push(`${src}.`);
    }
    if (doi) parts.push(`https://doi.org/${doi.replace(/^https?:\/\/doi\.org\//, "")}`);
    else if (url) parts.push(url);
    return parts.join(" ");
  }

  // Harvard
  const authorStr = joinHarvard(authors);
  const lead = authorStr ? `${authorStr} (${year})` : `(${year})`;
  const parts: string[] = [lead];
  if (input.type === "journal") {
    parts.push(`'${title}',`);
    let journal = italic(src);
    if (vol) journal += `, ${vol}`;
    if (iss) journal += `(${iss})`;
    if (pages) journal += `, pp. ${pages}`;
    parts.push(`${journal}.`);
  } else if (input.type === "book") {
    parts.push(`${italic(title)}.`);
    if (pub) parts.push(`${pub}.`);
  } else if (input.type === "chapter") {
    parts.push(`'${title}',`);
    if (src) parts.push(`in ${italic(src)}${pages ? `, pp. ${pages}` : ""}.`);
    if (pub) parts.push(`${pub}.`);
  } else if (input.type === "report") {
    parts.push(`${italic(title)}.`);
    if (pub) parts.push(`${pub}.`);
  } else { // website
    parts.push(`${italic(title)}.`);
    if (src) parts.push(`${src}.`);
    if (url) parts.push(`Available at: ${url}${accessed ? ` (Accessed: ${accessed})` : ""}.`);
  }
  if (doi && input.type !== "website") parts.push(`doi: ${doi}.`);
  else if (url && input.type !== "website") parts.push(`Available at: ${url}.`);
  return parts.join(" ");
}

// Plain text variant for PDF export (strips markdown asterisks)
export function formatCitationPlain(input: CitationInput, style: CitationStyle): string {
  return formatCitation(input, style).replace(/\*([^*]+)\*/g, "$1");
}
