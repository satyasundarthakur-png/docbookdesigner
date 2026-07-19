import { saveAs } from "file-saver";
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, BorderStyle, Header as DocxHeader,
} from "docx";
import type { Book } from "./docxProcessor";
import type { Theme } from "./themes";

/**
 * Convert a chapter's HTML body into docx Paragraph objects.
 * Handles: <p>, <h2>/<h3>/<h4>, <strong>/<b>, <em>/<i>, .verse,
 * .translator-note, .caution-box. Falls back to plain text for
 * anything unrecognized rather than dropping content.
 */
function htmlToDocxParagraphs(html: string): Paragraph[] {
  if (typeof document === "undefined") return [];

  const container = document.createElement("div");
  container.innerHTML = html;

  const paragraphs: Paragraph[] = [];

  const runsFromNode = (node: ChildNode, bold = false, italic = false): TextRun[] => {
    const runs: TextRun[] = [];
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? "";
      if (text) runs.push(new TextRun({ text, bold, italics: italic }));
      return runs;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return runs;

    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();
    const nextBold = bold || tag === "strong" || tag === "b";
    const nextItalic = italic || tag === "em" || tag === "i";

    if (tag === "br") {
      runs.push(new TextRun({ text: "", break: 1 }));
      return runs;
    }

    el.childNodes.forEach(child => {
      runs.push(...runsFromNode(child, nextBold, nextItalic));
    });
    return runs;
  };

  Array.from(container.children).forEach(el => {
    const tag = el.tagName.toLowerCase();

    if (tag === "h2") {
      paragraphs.push(new Paragraph({
        text: el.textContent ?? "",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 150 },
      }));
      return;
    }
    if (tag === "h3") {
      paragraphs.push(new Paragraph({
        text: el.textContent ?? "",
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 250, after: 120 },
      }));
      return;
    }
    if (tag === "h4") {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: el.textContent ?? "", bold: true, italics: true })],
        spacing: { before: 200, after: 100 },
      }));
      return;
    }

    if (el.classList.contains("verse")) {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: el.textContent ?? "", italics: true })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 200 },
        border: {
          top: { style: BorderStyle.SINGLE, size: 4, color: "999999" },
          bottom: { style: BorderStyle.SINGLE, size: 4, color: "999999" },
        },
      }));
      return;
    }

    if (el.classList.contains("translator-note")) {
      paragraphs.push(new Paragraph({
        children: [
          new TextRun({ text: "Translator's Note: ", bold: true, italics: true }),
          ...runsFromNode(el, false, true).filter(r =>
            !(r as any).options?.text?.startsWith?.("Translator's Note"),
          ),
        ],
        spacing: { before: 150, after: 150 },
        indent: { left: 360 },
        border: { left: { style: BorderStyle.SINGLE, size: 12, color: "999999" } },
      }));
      return;
    }

    if (el.classList.contains("caution-box")) {
      const body = el.querySelector(".caution-body");
      const text = (body?.textContent ?? el.textContent ?? "").replace(/^Caution:\s*/i, "");
      paragraphs.push(new Paragraph({
        children: [
          new TextRun({ text: "⚠ Caution: ", bold: true }),
          new TextRun({ text }),
        ],
        spacing: { before: 150, after: 150 },
        indent: { left: 360 },
        border: { left: { style: BorderStyle.SINGLE, size: 16, color: "B45309" } },
      }));
      return;
    }

    // Default: normal paragraph, preserving bold/italic runs
    const runs = runsFromNode(el);
    if (runs.length > 0) {
      paragraphs.push(new Paragraph({
        children: runs,
        spacing: { after: 120 },
        alignment: AlignmentType.JUSTIFIED,
      }));
    }
  });

  return paragraphs;
}

export async function exportDocx(book: Book, theme: Theme) {
  const sections = book.chapters.map((chapter, i) => {
    const chapterParagraphs = htmlToDocxParagraphs(chapter.html);
    return {
      properties: i > 0 ? { type: "nextPage" as const } : undefined,
      children: [
        new Paragraph({
          text: `Chapter ${i + 1}`,
          alignment: AlignmentType.CENTER,
          spacing: { before: 400, after: 100 },
          run: { size: 20, allCaps: true, bold: true, color: "8A5A2B" } as any,
        }),
        new Paragraph({
          text: chapter.title,
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),
        ...chapterParagraphs,
      ],
    };
  });

  const doc = new Document({
    creator: book.author || "DocBook Designer",
    title: book.title,
    sections: [
      // Cover page section
      {
        properties: {},
        children: [
          new Paragraph({ text: "", spacing: { before: 2000 } }),
          new Paragraph({
            text: book.title,
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
          }),
          ...(book.author
            ? [new Paragraph({
                children: [new TextRun({ text: book.author, size: 28 })],
                alignment: AlignmentType.CENTER,
              })]
            : []),
        ],
      },
      ...sections,
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${sanitizeFilename(book.title)}.docx`);
}

function sanitizeFilename(s: string): string {
  return s.replace(/[^a-z0-9-_]+/gi, "_").slice(0, 60) || "book";
}
