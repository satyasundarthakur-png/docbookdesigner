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

  const allNodes = Array.from(root.children) as HTMLElement[];

  // ── 2. Detect chapter-break markers ─────────────────────────────────────
  // Priority 1: a paragraph or heading whose ENTIRE text is a "Chapter N"
  // label (e.g. "CHAPTER 4", "Chapter Four", "CHAPTER IV"). This is the
  // most explicit and reliable signal — many manuscripts (including
  // per-chapter .docx files) put this on its own line as plain/bold text,
  // NOT as a Heading-1 style. If we only looked at H1 tags we would miss
  // this entirely and misread every in-chapter section heading as its own
  // chapter (the original bug).
  const CHAPTER_LABEL_RE = /^chapter\s+([0-9]+|[ivxlcdm]+|one|two|three|four|five|six|seven|eight|nine|ten)\b\.?:?\s*$/i;

  const isChapterLabel = (el: HTMLElement): boolean => {
    const txt = el.textContent?.trim() || "";
    return CHAPTER_LABEL_RE.test(txt);
  };

  // Priority 2 (fallback if no explicit "Chapter N" label found anywhere):
  // an H1 that looks like a standalone chapter title — short, all-caps.
  const looksLikeChapterH1 = (el: HTMLElement): boolean => {
    if (el.tagName !== "H1") return false;
    const txt = el.textContent?.trim() || "";
    if (/^chapter\s+\d+/i.test(txt)) return true;
    if (/^chapter\s+[ivxlc]+/i.test(txt)) return true;
    if (txt.length <= 60 && txt === txt.toUpperCase() && /[A-Z]/.test(txt)) return true;
    return false;
  };

  const hasExplicitChapterLabels = allNodes.some(isChapterLabel);
  const chapterH1Count = allNodes.filter(looksLikeChapterH1).length;

  // Decide the chapter-break strategy for this document, in priority order:
  //   1. Explicit "Chapter N" label paragraphs/headings found → use those only.
  //   2. No explicit labels, but some H1s look like standalone chapter
  //      titles → use those only (other H1s become section headings).
  //   3. Neither found → every H1 is a chapter break (classic structure
  //      where each H1 genuinely is a new chapter).
  const useExplicitLabels = hasExplicitChapterLabels;
  const useChapterStyleH1 = !useExplicitLabels && chapterH1Count > 0;
  const useAllH1AsChapters = !useExplicitLabels && !useChapterStyleH1;

  const isBreakNode = (el: HTMLElement): boolean => {
    if (useExplicitLabels) return isChapterLabel(el);
    if (useChapterStyleH1) return looksLikeChapterH1(el);
    return el.tagName === "H1"; // useAllH1AsChapters
  };

  // ── 3. Split into chapters ──────────────────────────────────────────────
  const chapters: Chapter[] = [];
  let current: Chapter | null = null;
  let preHtml = "";
  let pendingLabelText = ""; // holds "CHAPTER 4" text until we find its title line

  for (let idx = 0; idx < allNodes.length; idx++) {
    const node = allNodes[idx];

    if (isBreakNode(node)) {
      // Close out the previous chapter
      if (current) {
        chapters.push(current);
      } else if (preHtml.trim()) {
        chapters.push({ title: firstWords(preHtml, 5) || "Introduction", html: preHtml });
        preHtml = "";
      }

      const labelText = node.textContent?.trim() || "Chapter";

      if (useExplicitLabels) {
        // "CHAPTER 4" is just a label. We ONLY fold in a descriptive
        // subtitle from the next line when that next line is CLEARLY a
        // title fragment, not body prose — otherwise this would eat real
        // paragraph content (this exact bug previously deleted the first
        // paragraph of every chapter whenever a chapter's Heading-1 text
        // was literally just "Chapter N", which is the most common case).
        //
        // Safe signal for "this is a subtitle, not a paragraph": the node
        // itself is a heading tag (H1/H2/H3) or is short AND has no
        // sentence-ending punctuation (a real paragraph almost always
        // ends with . ! ? or similar).
        let derivedTitle = labelText;
        const next = allNodes[idx + 1];
        if (next && !isBreakNode(next)) {
          const nextTxt = next.textContent?.trim() || "";
          const isHeadingTag = /^H[1-4]$/.test(next.tagName);
          const looksLikeTitleFragment =
            nextTxt.length > 0 &&
            nextTxt.length <= 100 &&
            !/[.!?]["')\]]?\s*$/.test(nextTxt); // doesn't end like a sentence

          if (isHeadingTag || looksLikeTitleFragment) {
            derivedTitle = `${labelText}: ${nextTxt}`.replace(/\s+/g, " ").trim();
            if (isHeadingTag) {
              // It's a heading — demote/consume it so it isn't duplicated
              // as a section heading immediately inside the new chapter.
              allNodes[idx + 1] = document.createElement("div");
            } else {
              // It's a short plain paragraph fragment (e.g. a subtitle
              // typed as a normal paragraph) — safe to fold in and consume.
              allNodes[idx + 1] = document.createElement("div");
            }
          }
        }
        current = { title: derivedTitle, html: "" };
      } else {
        current = { title: labelText, html: "" };
      }
    } else {
      // Non-break node → part of the current chapter's body.
      // If it's an H1 that isn't being used as a chapter break in this
      // document's strategy, demote it to H2 (section heading).
      let nodeHtml = node.outerHTML;
      if (node.tagName === "H1") {
        nodeHtml = nodeHtml.replace(/^<h1/, "<h2").replace(/h1>$/, "h2>");
      }

      nodeHtml = postProcess(nodeHtml);

      if (current) current.html += nodeHtml;
      else preHtml += nodeHtml;
    }
  }
  if (current) chapters.push(current);

  // Entire document is one chapter (no break markers found at all)
  if (chapters.length === 0) {
    chapters.push({ title: title || "Chapter 1", html: postProcess(root.innerHTML) });
  }

  // ── 4. Title fallback ────────────────────────────────────────────────────
  if (!title && chapters[0]) title = chapters[0].title;
  if (!title) title = "Untitled Book";

  return { title, author, chapters };
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Extract first N words from raw HTML for a fallback title */
function firstWords(html: string, n: number): string {
  return html.replace(/<[^>]+>/g, " ").trim().split(/\s+/).slice(0, n).join(" ");
}

/**
 * Post-process HTML content:
 *  - Convert ⚠ CAUTION: / ⚠ WARNING: paragraphs → styled caution boxes
 *  - Convert **bold** markdown in text nodes → <strong>
 *  - Convert *italic* markdown in text nodes → <em>
 *  - Convert Translator's Note paragraphs → styled note class
 *
 * IMPORTANT: this function must be content-preserving. It only ever wraps
 * or restyles existing text — it must never truncate, drop, or replace
 * paragraph content. Every regex here operates on the full paragraph text
 * and re-emits all of it.
 */
function postProcess(html: string): string {
  return html.replace(/<p>([\s\S]*?)<\/p>/g, (match, inner) => {
    const text = inner.trim();
    if (!text) return match; // preserve empty paragraphs untouched

    const plain = stripTags(text);

    // ── Caution / Warning blocks ──
    if (/^[⚠🚨]?\s*\*{0,2}(?:CAUTION|WARNING|IMPORTANT)\b/i.test(plain) || plain.includes('⚠')) {
      let cleaned = inlineMarkdown(text);
      // Strip a leading icon/label ONLY if it is actually at the start of
      // the (tag-stripped) text — avoids silently eating content when the
      // icon is wrapped in a leading <strong> tag.
      cleaned = cleaned.replace(/^(<strong>|<em>)*\s*[⚠🚨]\s*/i, (m) => m.replace(/[⚠🚨]\s*/i, ''));
      cleaned = cleaned.replace(/(<strong>|<em>)*\s*\*{0,2}(CAUTION|WARNING):?\*{0,2}\s*/i, (m) =>
        m.replace(/\*{0,2}(CAUTION|WARNING):?\*{0,2}\s*/i, ''));
      return `<div class="caution-box"><span class="caution-icon">⚠</span><div class="caution-body"><strong>Caution:</strong> ${cleaned}</div></div>`;
    }

    // ── Translator's Note ──
    if (/^\*{0,2}Translator['']?s?\s+Note[:\*]?/i.test(plain)) {
      let cleaned = inlineMarkdown(text);
      cleaned = cleaned.replace(/^(<strong>|<em>)*\s*\*{0,2}Translator['']?s?\s+Note[:\*]?\s*(<\/strong>|<\/em>)*\s*/i, '');
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
 *  *text*   → <em>text</em>
 */
function inlineMarkdown(html: string): string {
  html = html.replace(/\*\*([^*]+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*\n]+?)\*/g, "<em>$1</em>");
  return html;
}
