/**
 * Wrayth Intelligence — PDF export.
 *
 * Renders a follow-up report (executive report, incident report, management
 * explanation, or Q&A) as a print-ready PDF. Deliberately typography-first —
 * no heavy layout engine, no HTML-to-canvas rasterisation — so exports stay
 * crisp, small, and text-selectable.
 */
import { jsPDF } from 'jspdf';

type Section =
  | { kind: 'h1' | 'h2' | 'h3'; text: string }
  | { kind: 'p'; text: string }
  | { kind: 'li'; text: string }
  | { kind: 'space' };

function parseMarkdown(md: string): Section[] {
  const out: Section[] = [];
  const lines = md.split('\n');
  let paraBuf: string[] = [];

  const flushPara = () => {
    if (paraBuf.length === 0) return;
    out.push({ kind: 'p', text: paraBuf.join(' ') });
    paraBuf = [];
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (/^###\s+/.test(line)) {
      flushPara();
      out.push({ kind: 'h3', text: line.replace(/^###\s+/, '') });
    } else if (/^##\s+/.test(line)) {
      flushPara();
      out.push({ kind: 'h2', text: line.replace(/^##\s+/, '') });
    } else if (/^#\s+/.test(line)) {
      flushPara();
      out.push({ kind: 'h1', text: line.replace(/^#\s+/, '') });
    } else if (/^\s*[-*]\s+/.test(line)) {
      flushPara();
      out.push({ kind: 'li', text: line.replace(/^\s*[-*]\s+/, '') });
    } else if (line.trim() === '') {
      flushPara();
      out.push({ kind: 'space' });
    } else {
      paraBuf.push(line);
    }
  }
  flushPara();
  return out;
}

// Strip **bold** / *em* / `code` markers — jsPDF core fonts don't ship a bold
// variant we can inline mid-line without additional setup, so we render clean
// text and rely on structure (headings, bullets) for hierarchy.
function stripInline(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1');
}

export type PdfMeta = {
  title: string;
  subtitle?: string;
  kicker?: string;
  footer?: string;
};

export function exportFollowupPdf(markdown: string, meta: PdfMeta) {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginX = 56;
  const marginTop = 72;
  const marginBottom = 56;
  const contentW = pageW - marginX * 2;

  let y = marginTop;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageH - marginBottom) {
      doc.addPage();
      y = marginTop;
    }
  };

  const writeWrapped = (
    text: string,
    opts: { size: number; leading: number; bold?: boolean; color?: [number, number, number]; indent?: number },
  ) => {
    doc.setFont('helvetica', opts.bold ? 'bold' : 'normal');
    doc.setFontSize(opts.size);
    if (opts.color) doc.setTextColor(opts.color[0], opts.color[1], opts.color[2]);
    else doc.setTextColor(20, 20, 24);
    const indent = opts.indent ?? 0;
    const wrapped = doc.splitTextToSize(text, contentW - indent) as string[];
    for (const line of wrapped) {
      ensureSpace(opts.leading);
      doc.text(line, marginX + indent, y);
      y += opts.leading;
    }
  };

  // Header band
  doc.setFillColor(20, 12, 40);
  doc.rect(0, 0, pageW, 44, 'F');
  doc.setTextColor(220, 210, 240);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('WRAYTH INTELLIGENCE', marginX, 28);
  if (meta.kicker) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(180, 170, 210);
    const kw = doc.getTextWidth(meta.kicker);
    doc.text(meta.kicker, pageW - marginX - kw, 28);
  }

  y = marginTop;

  // Title
  writeWrapped(meta.title, { size: 22, leading: 26, bold: true, color: [15, 15, 20] });
  if (meta.subtitle) {
    y += 2;
    writeWrapped(meta.subtitle, { size: 10, leading: 14, color: [110, 110, 120] });
  }
  y += 10;
  doc.setDrawColor(220, 220, 228);
  doc.line(marginX, y, pageW - marginX, y);
  y += 18;

  // Body
  const sections = parseMarkdown(markdown);
  for (const s of sections) {
    if (s.kind === 'space') {
      y += 6;
      continue;
    }
    const text = stripInline(s.text);
    if (s.kind === 'h1') {
      y += 6;
      writeWrapped(text, { size: 16, leading: 20, bold: true });
      y += 4;
    } else if (s.kind === 'h2') {
      y += 6;
      writeWrapped(text, { size: 13, leading: 17, bold: true });
      y += 3;
    } else if (s.kind === 'h3') {
      y += 4;
      writeWrapped(text, { size: 11, leading: 15, bold: true, color: [60, 60, 70] });
      y += 2;
    } else if (s.kind === 'li') {
      ensureSpace(14);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(120, 90, 200);
      doc.text('•', marginX + 4, y);
      writeWrapped(text, { size: 10.5, leading: 14, indent: 16 });
      y += 2;
    } else {
      writeWrapped(text, { size: 10.5, leading: 14 });
      y += 4;
    }
  }

  // Footer on every page
  const total = doc.getNumberOfPages();
  const footerText = meta.footer ?? 'Generated by Ray — Wrayth AI Security Analyst';
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 150);
    doc.text(footerText, marginX, pageH - 28);
    const pageLabel = `Page ${i} of ${total}`;
    const pw = doc.getTextWidth(pageLabel);
    doc.text(pageLabel, pageW - marginX - pw, pageH - 28);
  }

  const slug = meta.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'wrayth-report';
  doc.save(`${slug}.pdf`);
}
