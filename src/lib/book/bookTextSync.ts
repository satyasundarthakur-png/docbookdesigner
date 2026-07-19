import type { Book } from "./docxProcessor";

/** Strip HTML tags to plain text (browser-only; SSR-safe fallback via regex). */
export function htmlToPlainText(html: string): string {
  if (typeof document === "undefined") return html.replace(/<[^>]+>/g, "");
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
}

/**
 * Flatten a book's chapters into a single markdown string suitable for
 * sending to an AI model for polishing. Each chapter becomes a `## Title`
 * section followed by its plain-text body.
 */
export function bookToPolishText(book: Book): string {
  return book.chapters
    .map(c => `## ${c.title}\n\n${htmlToPlainText(c.html)}`)
    .join("\n\n");
}

/**
 * Reverse of bookToPolishText: takes polished markdown (chapters separated
 * by `## Title` headings) and rebuilds the book's chapters from it,
 * matching sections back to chapters by position.
 *
 * If a chapter has no matching section in the polished text (e.g. the AI
 * output was shorter than expected), that chapter's original HTML is kept
 * unchanged rather than being blanked out.
 */
export function polishTextToBook(polishedText: string, book: Book): Book {
  const sections = polishedText.split(/^## /m).filter(Boolean);

  const chapters = book.chapters.map((chapter, i) => {
    const section = sections[i];
    if (!section) return chapter; // no polished section for this chapter — keep original

    const newlineIdx = section.indexOf("\n");
    const body = newlineIdx >= 0 ? section.slice(newlineIdx + 1).trim() : "";

    if (!body) return chapter; // empty polished body — keep original, never blank a chapter

    const html = body
      .split(/\n\n+/)
      .filter(Boolean)
      .map(p => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
      .join("\n");

    return { ...chapter, html: html || chapter.html };
  });

  return { ...book, chapters };
}
