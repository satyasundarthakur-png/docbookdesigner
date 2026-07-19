import { saveAs } from "file-saver";
import type { Book } from "./docxProcessor";
import type { Theme } from "./themes";
import type { PageSize } from "./pageSize";
import { PAGE_SIZES } from "./pageSize";
import { FONT_LINK } from "./themes";

/**
 * Build the print-ready HTML document (used by both exportHtml and
 * exportPdf so the two stay pixel-identical).
 */
function buildHtmlDocument(book: Book, theme: Theme, pageSize?: PageSize): string {
  const ps = pageSize ?? PAGE_SIZES['a5'];
  const cw = ps.widthPx - ps.marginInnerPx - ps.marginOuterPx;
  const ch = ps.heightPx - ps.marginTopPx - ps.marginBottomPx;

  // Each chapter becomes ONE or MORE fixed-size pages, all same dimensions
  // We render ALL content without clipping so the user gets the full text.
  // Pages are separated by a visual page-break rule that prints as a real page break.
  const chaptersHtml = book.chapters.map((c, i) => `
<div class="book-page chapter-page">
  <div class="chap-num">Chapter ${i + 1}</div>
  <div class="chap-rule"></div>
  <div class="chap-title">${escapeHtml(c.title)}</div>
  <div class="body">${c.html}</div>
</div>`).join('\n');

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>${escapeHtml(book.title)}</title>
<link rel="stylesheet" href="${FONT_LINK}"/>
<style>
/* ── Print page setup ── */
@page {
  size: ${ps.cssWidth} ${ps.cssHeight};
  margin: ${ps.cssMargin};
}

* { box-sizing: border-box; }

body {
  background: #1a1a2e;
  margin: 0;
  padding: 24px 0;
  font-family: ${theme.fontBody};
  color: ${theme.pageColor};
}

/* ── Page shell ── */
.book-page {
  background: ${theme.pageBg};
  color: ${theme.pageColor};
  font-family: ${theme.fontBody};

  /* Fixed page dimensions — same as screen preview */
  width: ${ps.widthPx}px;
  min-height: ${ps.heightPx}px;          /* min so content never clips */

  padding-top:    ${ps.marginTopPx}px;
  padding-bottom: ${ps.marginBottomPx}px;
  padding-left:   ${ps.marginInnerPx}px;
  padding-right:  ${ps.marginOuterPx}px;

  margin: 0 auto 32px;
  box-shadow: 0 4px 32px rgba(0,0,0,.5);
}

/* ── Cover ── */
.cover-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: ${ps.heightPx}px;
}
.cover-rule-top,
.cover-rule-bot {
  width: ${Math.round(cw * .45)}px;
  height: 1.5px;
  background: ${theme.accent};
  opacity: .35;
  margin: ${Math.round(ps.coverTitlePx * 1.4)}px auto;
}
.cover-rule-mid {
  width: ${Math.round(cw * .22)}px;
  height: 1px;
  background: ${theme.accent};
  opacity: .25;
  margin: ${Math.round(ps.coverTitlePx * .7)}px auto;
}
.cover-page h1 {
  font-family: ${theme.fontDisplay};
  font-size: ${ps.coverTitlePx}px;
  line-height: ${Math.round(ps.coverTitlePx * 1.18)}px;
  color: ${theme.accent};
  font-weight: 700;
  margin: 0;
}
.cover-page .author {
  font-size: ${ps.coverAuthorPx}px;
  opacity: .65;
  margin: 0;
  font-family: ${theme.fontBody};
}

/* ── Chapter header ── */
.chap-num {
  font-family: ${theme.fontDisplay};
  font-size: ${Math.round(ps.chapterNumPt * 1.333)}px;
  color: ${theme.accent};
  text-align: center;
  letter-spacing: .25em;
  text-transform: uppercase;
  font-weight: 700;
  line-height: 1;
  margin-bottom: ${Math.round(ps.leadingPx * .6)}px;
}
.chap-rule {
  width: ${Math.round(cw * .18)}px;
  height: 1px;
  background: ${theme.accent};
  margin: 0 auto ${Math.round(ps.leadingPx * .9)}px;
  opacity: .4;
}
.chap-title {
  font-family: ${theme.fontDisplay};
  font-size: ${ps.chapterTitlePx}px;
  line-height: ${Math.round(ps.chapterTitlePx * 1.22)}px;
  color: ${theme.accent};
  text-align: center;
  font-weight: 700;
  font-style: italic;
  margin: 0 0 ${Math.round(ps.leadingPx * 2)}px;
}

/* ── Body text ── */
.body p {
  font-size: ${ps.bodyFontSizePx}px;
  line-height: ${ps.leadingPx}px;
  text-align: justify;
  text-indent: 1.5em;
  margin: 0 0 ${Math.round(ps.leadingPx * .12)}px;
  orphans: 3;
  widows: 3;
}
.body p:first-of-type { text-indent: 0; }
.body p:first-of-type::first-letter {
  font-family: ${theme.fontDisplay};
  font-size: ${Math.round(ps.bodyFontSizePx * 3.5)}px;
  float: left;
  line-height: .82;
  padding: ${Math.round(ps.bodyFontSizePx * .28)}px ${Math.round(ps.bodyFontSizePx * .55)}px 0 0;
  color: ${theme.accent};
}

/* ── Headings inside body ── */
.body h2 {
  font-family: ${theme.fontDisplay};
  color: ${theme.accent};
  font-size: ${ps.sectionTitlePx}px;
  line-height: ${Math.round(ps.sectionTitlePx * 1.25)}px;
  font-weight: 700;
  margin: ${Math.round(ps.leadingPx * 1.5)}px 0 ${Math.round(ps.leadingPx * .5)}px;
  page-break-after: avoid;
}
.body h3 {
  font-family: ${theme.fontDisplay};
  color: ${theme.accent};
  font-size: ${Math.round(ps.subSectionPt * 1.333)}px;
  font-weight: 700;
  margin: ${ps.leadingPx}px 0 ${Math.round(ps.leadingPx * .4)}px;
  page-break-after: avoid;
}
.body h4 {
  font-family: ${theme.fontDisplay};
  color: ${theme.accent};
  font-size: ${ps.bodyFontSizePx}px;
  font-weight: 700;
  font-style: italic;
  margin: ${Math.round(ps.leadingPx * .8)}px 0 ${Math.round(ps.leadingPx * .3)}px;
  page-break-after: avoid;
}

/* ── Emphasis / italic ── */
.body em, .body i { font-style: italic; }
.body strong, .body b { font-weight: 700; }

/* ── Special blocks ── */
.body .verse {
  font-style: italic;
  text-align: center;
  margin: ${Math.round(ps.leadingPx * 1.1)}px ${Math.round(cw * .07)}px;
  padding: ${Math.round(ps.leadingPx * .55)}px 0;
  line-height: ${Math.round(ps.leadingPx * 1.3)}px;
  border-top: 1px solid ${theme.accent};
  border-bottom: 1px solid ${theme.accent};
  color: ${theme.accent};
  font-size: ${Math.round(ps.bodyFontSizePx * .94)}px;
  page-break-inside: avoid;
}
.body .translator-note {
  border-left: 2px solid ${theme.accent};
  padding-left: ${Math.round(cw * .06)}px;
  margin: ${Math.round(ps.leadingPx * .9)}px 0;
  font-style: italic;
  font-size: ${Math.round(ps.bodyFontSizePx * .92)}px;
  line-height: ${Math.round(ps.leadingPx * .95)}px;
  opacity: .80;
  page-break-inside: avoid;
}
.body blockquote {
  margin: ${Math.round(ps.leadingPx * .9)}px ${Math.round(cw * .06)}px;
  font-size: ${Math.round(ps.bodyFontSizePx * .94)}px;
  opacity: .85;
}


.body .caution-box {
  display:flex;
  gap:8px;
  background:rgba(180,60,0,0.06);
  border-left:3px solid var(--acc);
  border-radius:0 4px 4px 0;
  padding:10px 14px;
  margin:14px 0;
  font-size:${Math.round(ps.bodyFontSizePx * 0.9)}px;
  line-height:${Math.round(ps.leadingPx * 0.95)}px;
  page-break-inside:avoid;
}
.body .caution-icon {
  flex-shrink:0;
  margin-top:1px;
}
.body .caution-body { flex:1; }

/* ── Print ── */
@media print {
  body { background: #fff !important; padding: 0 !important; }
  .book-page {
    box-shadow: none !important;
    margin: 0 !important;
    page-break-after: always;
    width: ${ps.cssWidth} !important;
    min-height: ${ps.cssHeight} !important;
  }
}
</style>
</head>
<body>

<!-- Cover -->
<div class="book-page cover-page">
  <div class="cover-rule-top"></div>
  <h1>${escapeHtml(book.title)}</h1>
  ${book.author ? `<div class="cover-rule-mid"></div><p class="author">${escapeHtml(book.author)}</p>` : ''}
  <div class="cover-rule-bot"></div>
</div>

<!-- Chapters -->
${chaptersHtml}

</body>
</html>`;

  return html;
}

export function exportHtml(book: Book, theme: Theme, pageSize?: PageSize) {
  const html = buildHtmlDocument(book, theme, pageSize);
  saveAs(
    new Blob([html], { type: 'text/html;charset=utf-8' }),
    `${sanitize(book.title)}.html`,
  );
}

/**
 * Export as PDF via the browser's native print pipeline. This opens a new
 * window with the exact same styled HTML used for the HTML export, then
 * triggers the print dialog so the user can "Save as PDF". This approach
 * (rather than a canvas-rasterizing library) keeps text selectable and
 * searchable, and correctly renders Unicode scripts (e.g. Odia, Devanagari)
 * using the browser's own font engine instead of a client-side renderer
 * that may not resolve those glyphs.
 */
export function exportPdf(book: Book, theme: Theme, pageSize?: PageSize) {
  const html = buildHtmlDocument(book, theme, pageSize);

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    // Popup blocked — fall back to HTML download so the user isn't stuck
    saveAs(new Blob([html], { type: 'text/html;charset=utf-8' }), `${sanitize(book.title)}.html`);
    return;
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();

  // Wait for fonts/layout to settle before opening the print dialog
  const triggerPrint = () => {
    printWindow.focus();
    printWindow.print();
  };

  if (printWindow.document.readyState === 'complete') {
    setTimeout(triggerPrint, 400);
  } else {
    printWindow.addEventListener('load', () => setTimeout(triggerPrint, 400));
  }
}

export function exportPolishedText(book: Book) {
  const text = book.chapters
    .map(c => `## ${c.title}\n\n${
      c.html
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim()
    }`)
    .join('\n\n---\n\n');

  const full = `${book.title}${book.author ? '\nBy ' + book.author : ''}\n\n${'='.repeat(60)}\n\n${text}`;
  saveAs(
    new Blob([full], { type: 'text/plain;charset=utf-8' }),
    `${sanitize(book.title)}_polished.txt`,
  );
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!
  ));
}

function sanitize(s: string) {
  return s.replace(/[^a-z0-9-_]+/gi, '_').slice(0, 60) || 'book';
}
