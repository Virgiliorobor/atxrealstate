import PDFDocument from "pdfkit";
import fs from "node:fs";
import path from "node:path";
import { getAgencyRoot } from "./paths.js";

type Doc = PDFKit.PDFDocument;

// Neo-Austin Editorial — mirrors _uidev/the_agency_website/src/index.css :root
const CANVAS = "#ffffff";
const INK = "#0a0a0a";
const INK_MUTED = "#3a4a44";
const PRIMARY = "#006b57";
const ACID = "#d0ed00";
const LINE_SOFT = "#b9cbc3";

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 56;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const NEO_SHIFT = 6;

const DISPLAY = "Times-Bold";
const DISPLAY_ITALIC = "Times-Italic";
const BODY = "Helvetica";
const BODY_BOLD = "Helvetica-Bold";
const BODY_ITALIC = "Helvetica-Oblique";
const MONO = "Courier";

export function renderBriefPdf(title: string, markdown: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "LETTER",
      margins: { top: MARGIN, bottom: 84, left: MARGIN, right: MARGIN },
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

    drawMasthead(doc, title);
    const propertyId = detectPropertyId(title, markdown);
    if (propertyId) drawHero(doc, propertyId);
    drawBody(doc, markdown);
    drawFooters(doc);

    doc.end();
  });
}

function drawMasthead(doc: Doc, title: string) {
  doc.font(BODY_BOLD).fontSize(7.5).fillColor(INK);
  doc.text("THE AGENCY", { characterSpacing: 2, lineBreak: false, continued: true });
  doc.fillColor(INK_MUTED).text("  ·  DIANA CASTELLANO REAL ESTATE", {
    characterSpacing: 1.5,
  });

  doc.moveDown(0.25);
  doc.font(BODY).fontSize(7.5).fillColor(INK_MUTED);
  doc.text("Boutique residential  ·  Austin, TX", { characterSpacing: 0.5 });

  doc.moveDown(0.6);
  const y0 = doc.y;
  doc.strokeColor(INK).lineWidth(1.2).moveTo(MARGIN, y0).lineTo(MARGIN + CONTENT_WIDTH, y0).stroke();
  doc.moveDown(0.15);
  const y1 = doc.y;
  doc.strokeColor(INK).lineWidth(0.4).moveTo(MARGIN, y1).lineTo(MARGIN + CONTENT_WIDTH, y1).stroke();

  doc.moveDown(1.4);

  const titleParts = splitTitle(title);
  doc.font(DISPLAY).fontSize(30).fillColor(INK);
  doc.text(titleParts.main, { lineGap: 0, characterSpacing: -0.3 });

  if (titleParts.sub) {
    doc.moveDown(0.25);
    doc.font(DISPLAY_ITALIC).fontSize(13).fillColor(PRIMARY);
    doc.text(titleParts.sub, { characterSpacing: 0.2 });
  }

  doc.moveDown(0.9);
}

function splitTitle(title: string): { main: string; sub: string | null } {
  const m = title.match(/^(.*?)\s+[—–-]\s+(.*)$/);
  if (m) return { main: m[1].trim(), sub: m[2].trim() };
  return { main: title, sub: null };
}

function detectPropertyId(title: string, markdown: string): string | null {
  const combo = `${title}\n${markdown}`;
  const m = combo.match(/\bATX-\d{3}\b/i);
  return m ? m[0].toUpperCase() : null;
}

function resolvePropertyImage(propertyId: string): string | null {
  try {
    const root = getAgencyRoot();
    const dir = path.join(root, "_uidev", "the_agency_website", "public", "Images", "properties");
    if (!fs.existsSync(dir)) return null;
    const files = fs.readdirSync(dir);
    const lower = propertyId.toLowerCase();
    const heroMatch = files.find(
      (f) =>
        f.toLowerCase().startsWith(lower) &&
        /hero/i.test(f) &&
        /\.(png|jpe?g)$/i.test(f),
    );
    if (heroMatch) return path.join(dir, heroMatch);
    const anyMatch = files.find(
      (f) => f.toLowerCase().startsWith(lower) && /\.(png|jpe?g)$/i.test(f),
    );
    return anyMatch ? path.join(dir, anyMatch) : null;
  } catch {
    return null;
  }
}

function drawHero(doc: Doc, propertyId: string) {
  const imgPath = resolvePropertyImage(propertyId);
  if (!imgPath) return;

  const imgWidth = CONTENT_WIDTH;
  const imgHeight = Math.round(imgWidth * 0.5);
  const x = MARGIN;
  const y = doc.y;

  doc.save();
  doc.fillColor(PRIMARY).rect(x + NEO_SHIFT, y + NEO_SHIFT, imgWidth, imgHeight).fill();
  doc.restore();

  try {
    doc.image(imgPath, x, y, { width: imgWidth, height: imgHeight });
  } catch {
    doc.save();
    doc.fillColor(LINE_SOFT).rect(x, y, imgWidth, imgHeight).fill();
    doc.restore();
  }

  doc.save();
  doc.lineWidth(1).strokeColor(INK).rect(x, y, imgWidth, imgHeight).stroke();
  doc.restore();

  doc.y = y + imgHeight + 6;

  doc.font(MONO).fontSize(8).fillColor(INK_MUTED);
  doc.text(`Hero · ${propertyId}`, x, doc.y, { characterSpacing: 0.5 });
  doc.moveDown(1.2);
}

function drawBody(doc: Doc, markdown: string) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  let inYaml = false;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();

    if (trimmed === "```" || /^```\w*/.test(trimmed)) {
      inYaml = !inYaml;
      doc.moveDown(0.2);
      continue;
    }
    if (inYaml) {
      doc.font(MONO).fontSize(8.5).fillColor(PRIMARY);
      doc.text(raw, { lineGap: 1 });
      continue;
    }

    if (!trimmed) {
      doc.moveDown(0.4);
      continue;
    }

    if (trimmed === "---" || /^[-*_]{3,}$/.test(trimmed)) {
      doc.moveDown(0.4);
      const y = doc.y;
      doc.strokeColor(LINE_SOFT).lineWidth(0.4)
        .moveTo(MARGIN, y).lineTo(MARGIN + CONTENT_WIDTH, y).stroke();
      doc.moveDown(0.5);
      continue;
    }

    if (trimmed.startsWith("# ")) {
      doc.moveDown(0.5);
      doc.font(DISPLAY).fontSize(18).fillColor(INK);
      doc.text(stripInline(trimmed.slice(2)), { lineGap: 1, characterSpacing: -0.2 });
      doc.moveDown(0.2);
      continue;
    }
    if (trimmed.startsWith("## ")) {
      drawSectionHeading(doc, stripInline(trimmed.slice(3)));
      continue;
    }
    if (trimmed.startsWith("### ")) {
      doc.moveDown(0.35);
      doc.font(BODY_BOLD).fontSize(10).fillColor(INK);
      doc.text(stripInline(trimmed.slice(4)));
      doc.moveDown(0.15);
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const text = trimmed.replace(/^[-*]\s+/, "");
      doc.font(BODY).fontSize(10).fillColor(INK);
      const y = doc.y;
      doc.fillColor(PRIMARY).text("▪", MARGIN + 2, y + 0.5, { lineBreak: false });
      doc.fillColor(INK).text("", MARGIN + 14, y);
      renderInline(doc, text, { width: CONTENT_WIDTH - 14, lineGap: 2 });
      continue;
    }

    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      doc.font(BODY_BOLD).fontSize(10).fillColor(PRIMARY);
      const y = doc.y;
      doc.text(`${numMatch[1]}.`, MARGIN, y, { lineBreak: false });
      doc.fillColor(INK).font(BODY).text("", MARGIN + 22, y);
      renderInline(doc, numMatch[2], { width: CONTENT_WIDTH - 22, lineGap: 2 });
      continue;
    }

    const dataMatch = trimmed.match(/^([A-Z][\w\s/&]{1,40}):\s+(.+)$/);
    if (dataMatch && dataMatch[1].length <= 28) {
      doc.font(BODY_BOLD).fontSize(9).fillColor(INK_MUTED);
      const label = dataMatch[1].toUpperCase();
      const y = doc.y;
      doc.text(label, MARGIN, y, {
        width: 140,
        lineBreak: false,
        characterSpacing: 0.5,
      });
      doc.font(BODY).fontSize(10).fillColor(INK);
      doc.text("", MARGIN + 150, y);
      renderInline(doc, dataMatch[2], { width: CONTENT_WIDTH - 150, lineGap: 2 });
      doc.moveDown(0.05);
      continue;
    }

    doc.font(BODY).fontSize(10).fillColor(INK);
    renderInline(doc, trimmed, { width: CONTENT_WIDTH, lineGap: 2.5 });
    doc.moveDown(0.1);
  }
}

function drawSectionHeading(doc: Doc, text: string) {
  doc.moveDown(0.7);
  const y = doc.y;
  doc.save();
  doc.fillColor(PRIMARY).rect(MARGIN, y + 1, 3, 13).fill();
  doc.restore();
  doc.font(BODY_BOLD).fontSize(10).fillColor(INK);
  doc.text(text.toUpperCase(), MARGIN + 10, y, {
    characterSpacing: 1.2,
    lineGap: 0,
  });
  doc.moveDown(0.35);
}

type InlinePart = { kind: "text" | "bold" | "italic" | "code"; text: string };

function renderInline(
  doc: Doc,
  text: string,
  opts: { width?: number; lineGap?: number } = {},
) {
  const parts = tokenizeInline(text);
  parts.forEach((part, i) => {
    const isLast = i === parts.length - 1;
    if (part.kind === "bold") doc.font(BODY_BOLD);
    else if (part.kind === "italic") doc.font(BODY_ITALIC);
    else if (part.kind === "code") doc.font(MONO).fontSize(9);
    else doc.font(BODY).fontSize(10);

    doc.fillColor(part.kind === "code" ? PRIMARY : INK);
    doc.text(part.text, {
      continued: !isLast,
      width: i === 0 ? opts.width : undefined,
      lineGap: opts.lineGap,
    });
  });
  doc.font(BODY).fillColor(INK).fontSize(10);
}

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

function drawFooters(doc: Doc) {
  const range = doc.bufferedPageRange();
  const stamp = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(range.start + i);
    const y = PAGE_HEIGHT - 56;
    doc.save();
    doc.strokeColor(INK).lineWidth(0.4)
      .moveTo(MARGIN, y).lineTo(MARGIN + CONTENT_WIDTH, y).stroke();
    doc.restore();

    doc.font(BODY).fontSize(7.5).fillColor(INK_MUTED);
    doc.text("THE AGENCY", MARGIN, y + 8, {
      characterSpacing: 1.5,
      lineBreak: false,
    });
    doc.text(
      `${stamp}  ·  Page ${i + 1} of ${range.count}`,
      MARGIN,
      y + 8,
      { align: "right", width: CONTENT_WIDTH, lineBreak: false },
    );
  }
}
