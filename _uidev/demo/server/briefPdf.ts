import PDFDocument from "pdfkit";

type Doc = PDFKit.PDFDocument;

const INK = "#111111";
const SUB = "#444444";
const MUTED = "#8a8a8a";
const RULE = "#222222";
const ACCENT = "#1f6f6b";

const PAGE_MARGIN = 56;
const PAGE_WIDTH = 612;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;

export function renderBriefPdf(title: string, markdown: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "LETTER",
      margins: { top: PAGE_MARGIN, bottom: 72, left: PAGE_MARGIN, right: PAGE_MARGIN },
      bufferPages: true,
      info: {
        Title: title,
        Author: "Diana Castellano Real Estate",
        Subject: "Property brief",
        Creator: "The Agency",
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c as Buffer));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    drawHeader(doc, title);
    drawBody(doc, markdown);
    drawFooters(doc);

    doc.end();
  });
}

function drawHeader(doc: Doc, title: string) {
  doc.font("Helvetica-Bold").fontSize(8).fillColor(MUTED);
  doc.text("THE AGENCY  ·  DIANA CASTELLANO REAL ESTATE", { characterSpacing: 1.2 });
  doc.moveDown(0.2);
  doc.font("Helvetica").fontSize(8).fillColor(MUTED);
  doc.text("Boutique residential  ·  Austin, TX", { characterSpacing: 0.4 });

  doc.moveDown(1.4);
  doc.font("Helvetica-Bold").fontSize(24).fillColor(INK);
  doc.text(title, { lineGap: 2 });

  doc.moveDown(0.6);
  const y = doc.y;
  doc.strokeColor(RULE).lineWidth(1.2)
    .moveTo(PAGE_MARGIN, y).lineTo(PAGE_MARGIN + CONTENT_WIDTH, y).stroke();
  doc.moveDown(1.2);
}

function drawBody(doc: Doc, markdown: string) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      doc.moveDown(0.4);
      continue;
    }

    if (trimmed === "---" || /^[-*_]{3,}$/.test(trimmed)) {
      doc.moveDown(0.4);
      const y = doc.y;
      doc.strokeColor("#dddddd").lineWidth(0.5)
        .moveTo(PAGE_MARGIN, y).lineTo(PAGE_MARGIN + CONTENT_WIDTH, y).stroke();
      doc.moveDown(0.6);
      continue;
    }

    if (trimmed.startsWith("# ")) {
      doc.moveDown(0.4);
      doc.font("Helvetica-Bold").fontSize(16).fillColor(INK);
      doc.text(stripInline(trimmed.slice(2)), { lineGap: 1 });
      doc.moveDown(0.2);
      continue;
    }
    if (trimmed.startsWith("## ")) {
      doc.moveDown(0.4);
      doc.font("Helvetica-Bold").fontSize(12).fillColor(ACCENT);
      doc.text(stripInline(trimmed.slice(3)).toUpperCase(), { characterSpacing: 0.6 });
      doc.moveDown(0.1);
      continue;
    }
    if (trimmed.startsWith("### ")) {
      doc.moveDown(0.3);
      doc.font("Helvetica-Bold").fontSize(10.5).fillColor(SUB);
      doc.text(stripInline(trimmed.slice(4)));
      doc.moveDown(0.1);
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const text = trimmed.replace(/^[-*]\s+/, "");
      doc.font("Helvetica").fontSize(10).fillColor(INK);
      const bulletX = PAGE_MARGIN + 4;
      const textX = PAGE_MARGIN + 16;
      const y = doc.y;
      doc.text("•", bulletX, y, { lineBreak: false });
      doc.text("", textX, y);
      renderInline(doc, text, { width: CONTENT_WIDTH - 16 });
      continue;
    }

    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      doc.font("Helvetica").fontSize(10).fillColor(INK);
      const labelX = PAGE_MARGIN;
      const textX = PAGE_MARGIN + 20;
      const y = doc.y;
      doc.text(`${numMatch[1]}.`, labelX, y, { lineBreak: false });
      doc.text("", textX, y);
      renderInline(doc, numMatch[2], { width: CONTENT_WIDTH - 20 });
      continue;
    }

    doc.font("Helvetica").fontSize(10).fillColor(INK);
    renderInline(doc, trimmed, { width: CONTENT_WIDTH, lineGap: 2 });
  }
}

function renderInline(
  doc: Doc,
  text: string,
  opts: { width?: number; lineGap?: number } = {},
) {
  const stripped = stripFence(text);
  const parts = tokenizeInline(stripped);

  parts.forEach((part, i) => {
    const isLast = i === parts.length - 1;
    if (part.kind === "bold") doc.font("Helvetica-Bold");
    else if (part.kind === "italic") doc.font("Helvetica-Oblique");
    else if (part.kind === "code") doc.font("Courier");
    else doc.font("Helvetica");

    doc.fillColor(part.kind === "code" ? ACCENT : INK);
    doc.text(part.text, {
      continued: !isLast,
      width: i === 0 ? opts.width : undefined,
      lineGap: opts.lineGap,
    });
  });

  doc.font("Helvetica").fillColor(INK);
}

type InlinePart = { kind: "text" | "bold" | "italic" | "code"; text: string };

function tokenizeInline(s: string): InlinePart[] {
  const parts: InlinePart[] = [];
  const re = /(\*\*[^*]+\*\*)|(__[^_]+__)|(\*[^*]+\*)|(_[^_]+_)|(`[^`]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) {
    if (m.index > last) parts.push({ kind: "text", text: s.slice(last, m.index) });
    const tok = m[0];
    if (tok.startsWith("**") || tok.startsWith("__"))
      parts.push({ kind: "bold", text: tok.slice(2, -2) });
    else if (tok.startsWith("`"))
      parts.push({ kind: "code", text: tok.slice(1, -1) });
    else parts.push({ kind: "italic", text: tok.slice(1, -1) });
    last = m.index + tok.length;
  }
  if (last < s.length) parts.push({ kind: "text", text: s.slice(last) });
  return parts.length ? parts : [{ kind: "text", text: s }];
}

function stripInline(s: string): string {
  return s
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    .replace(/`([^`]+)`/g, "$1");
}

function stripFence(s: string): string {
  return s.replace(/^```\w*\s*/, "").replace(/```$/, "");
}

function drawFooters(doc: Doc) {
  const range = doc.bufferedPageRange();
  const stamp = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(range.start + i);
    doc.font("Helvetica").fontSize(8).fillColor(MUTED);
    doc.text(
      `Generated ${stamp}  ·  Page ${i + 1} of ${range.count}`,
      PAGE_MARGIN,
      720,
      { align: "center", width: CONTENT_WIDTH, lineBreak: false },
    );
  }
}
