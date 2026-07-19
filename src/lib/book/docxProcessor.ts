import mammoth from "mammoth";

export type Chapter = { title: string; html: string };
export type Book    = { title: string; author: string; chapters: Chapter[] };

export async function processDocx(buffer: ArrayBuffer): Promise<Book> {
  const { value: html } = await mammoth.convertToHtml(
    { arrayBuffer: buffer },
    {
      styleMap: [
        "p[style-name='Title']           => h1.book-title:fresh",
        "p[style-name='Subtitle']        => p.book-subtitle:fresh",
        "p[style-name='Heading 1']       => h1:fresh",
        "p[style-name='Heading 2']       => h2:fresh",
        "p[style-name='Heading 3']       => h3:fresh",
        "p[style-name='Heading 4']       => h4:fresh",
        "p[style-name='Verse']           => div.verse:fresh",
        "p[style-name='Translator Note'] => p.translator-note:fresh",
      ],
    },
  );

  const doc  = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
  const root = doc.body.firstElementChild as HTMLElement;

  // ── 1. Pull styled book title / author ──────────────────────────────────
  let title  = "";
  let author = "";

  const titleEl = root.querySelector("h1.book-title");
  if (titleEl) { title = titleEl.textContent?.trim() || ""; titleEl.remove(); }

  const subEl = root.querySelector("p.book-subtitle");
  if (subEl)   { author = subEl.textContent?.trim() || ""; subEl.remove(); }

  // ── 2. Detect document structure ────────────────────────────────────────
  // Strategy: use the FIRST h1 that looks like a "CHAPTER N" heading as
  // the chapter-break marker. All other h1s become h2 (section headings).
  // This handles documents that use h1 for both chapter titles AND section
  // headings within a chapter.

  const allNodes = Array.from(root.children) as HTMLElement[];

  // Find h1 nodes that are chapter-level (e.g. "Chapter 4", "CHAPTER IV",
  // or look like a chapter declaration — bold, short, standalone)
  const isChapterH1 = (el: HTMLElement): boolean => {
    if (el.tagName !== "H1") return false;
    const txt = el.textContent?.trim() || "";
    // Explicit chapter markers
    if (/^chapter\s+\d+/i.test(txt)) return true;
    if (/^chapter\s+[ivxlc]+/i.test(txt)) return true;
    // All-caps short title alone on a line (≤60 chars, no lowercase) — treat as chapter
    if (txt.length <= 60 && txt === txt.toUpperCase() && /[A-Z]/.test(txt)) return true;
    return false;
  };

  const chapterH1Count = allNodes.filter(isChapterH1).length;

  // If there are zero dedicated chapter-h1s, treat every h1 as a chapter break
  // (classic single-document-per-chapter structure).
  // If there IS at least one chapter-h1, only those break chapters; other h1s → h2.
  const useAllH1AsChapters = chapterH1Count === 0;

  // ── 3. Split into chapters ──────────────────────────────────────────────
  const chapters: Chapter[] = [];
  let current: Chapter | null = null;
  let preHtml = "";

  for (const node of allNodes) {
    const isBreak = node.tagName === "H1" &&
      (useAllH1AsChapters || isChapterH1(node));

    if (isBreak) {
      // Save previous chapter
      if (current) {
        chapters.push(current);
      } else if (preHtml.trim()) {
        // Content before first chapter heading → intro chapter
        chapters.push({ title: firstWords(preHtml, 5) || "Introduction", html: preHtml });
        preHtml = "";
      }
      current = { title: node.textContent?.trim() || "Chapter", html: "" };
    } else {
      // Non-chapter h1 → demote to h2 (section heading within a chapter)
      let nodeHtml = node.outerHTML;
      if (node.tagName === "H1") {
        nodeHtml = nodeHtml.replace(/^<h1/, "<h2").replace(/h1>$/, "h2>");
      }

      // ── 4. Post-process inline content ──────────────────────────────
      nodeHtml = postProcess(nodeHtml);

      if (current) {
        current.html += nodeHtml;
      } else {
        preHtml += nodeHtml;
      }
    }
  }
  if (current) chapters.push(current);

  // Entire document is one chapter (no h1 found at all)
  if (chapters.length === 0) {
    chapters.push({ title: title || "Chapter 1", html: postProcess(root.innerHTML) });
  }

  // ── 5. Title fallback ───────────────────────────────────────────────────
  if (!title && chapters[0]) title = chapters[0].title;
  if (!title) title = "Untitled Book";

  return { title, author, chapters };
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Extract first N words from raw HTML for a fallback title */
function firstWords(html: string, n: number): string {
  return (html.replace(/<[^>]+>/g, " ").trim().split(/\s+/).slice(0, n).join(" "));
}

/**
 * Post-process HTML content:
 *  - Convert ⚠ CAUTION: / ⚠ WARNING: paragraphs → styled caution boxes
 *  - Convert **bold** markdown in text nodes → <strong>
 *  - Convert *italic* markdown in text nodes → <em>
 *  - Convert Translator's Note paragraphs → styled note class
 */
function postProcess(html: string): string {
  // Work on individual <p> tags for targeted replacement
  return html.replace(/<p>([\s\S]*?)<\/p>/g, (match, inner) => {
    const text = inner.trim();

    // ── Caution / Warning blocks ──
    // Matches: ⚠ CAUTION:, ⚠ WARNING:, ** ⚠ CAUTION **, etc.
    if (/^[⚠🚨]?\s*\*{0,2}(?:CAUTION|WARNING|IMPORTANT)\b/i.test(stripTags(text)) ||
        text.includes('⚠')) {
      const cleaned = inlineMarkdown(text)
        .replace(/^\s*[⚠🚨]\s*/, '')         // remove leading icon
        .replace(/^\*{1,2}CAUTION:?\*{0,2}\s*/i, '')
        .replace(/^\*{1,2}WARNING:?\*{0,2}\s*/i, '');
      return `<div class="caution-box"><span class="caution-icon">⚠</span><div class="caution-body"><strong>Caution:</strong> ${cleaned}</div></div>`;
    }

    // ── Translator's Note ──
    if (/^\*{0,2}Translator['']?s?\s+Note[:\*]?/i.test(stripTags(text))) {
      const cleaned = inlineMarkdown(text).replace(/^\*{0,2}Translator['']?s?\s+Note[:\*]?\s*\*{0,2}\s*/i, '');
      return `<p class="translator-note"><strong>Translator's Note:</strong> ${cleaned}</p>`;
    }

    // ── Normal paragraph — just process inline markdown ──
    return `<p>${inlineMarkdown(text)}</p>`;
  });
}

/** Strip HTML tags */
function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, "");
}

/**
 * Convert simple inline markdown in HTML-safe text:
 *  **text** → <strong>text</strong>
 *  *text*   → <em>text</em> (not already inside **)
 */
function inlineMarkdown(html: string): string {
  // Bold first (** before *)
  html = html.replace(/\*\*([^*]+?)\*\*/g, "<strong>$1</strong>");
  // Italic (single *) — skip if followed immediately by another * (already handled)
  html = html.replace(/\*([^*\n]+?)\*/g, "<em>$1</em>");
  return html;
}
