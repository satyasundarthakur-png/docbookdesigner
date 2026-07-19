import { saveAs } from "file-saver";
import type { Book } from "./docxProcessor";
import type { Theme } from "./themes";
import type { PageSize } from "./pageSize";
import { PAGE_SIZES } from "./pageSize";
import { FONT_LINK } from "./themes";

export function exportHtml(book: Book, theme: Theme, pageSize?: PageSize) {
  const ps = pageSize ?? PAGE_SIZES['a5'];

  const chaptersHtml = book.chapters.map((c, i) => `
    <div class="book-page">
      <div class="chapter-num">Chapter ${i + 1}</div>
      <div class="chapter-rule"></div>
      <h1 class="chapter-title">${escapeHtml(c.title)}</h1>
      <div class="chapter-body">${c.html}</div>
    </div>`).join('\n');

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/>
<title>${escapeHtml(book.title)}</title>
<link rel="stylesheet" href="${FONT_LINK}"/>
<style>
  @page { size:${ps.cssWidth} ${ps.cssHeight}; margin:${ps.cssMargin}; }
  :root { --bg:${theme.pageBg}; --fg:${theme.pageColor}; --accent:${theme.accent}; }
  * { box-sizing: border-box; }
  body { background:#555; margin:0; padding:24px 0; font-family:${theme.fontBody}; color:var(--fg); }
  .book-page {
    background:var(--bg);
    width:${ps.cssWidth};
    min-height:${ps.cssHeight};
    margin:0 auto 24px;
    padding:${ps.marginTopPx}px ${ps.marginOuterPx}px ${ps.marginBottomPx}px ${ps.marginInnerPx}px;
    box-shadow:0 4px 24px rgba(0,0,0,.4);
    page-break-after:always;
  }
  .cover {
    display:flex; flex-direction:column;
    align-items:center; justify-content:center; text-align:center;
  }
  .cover-rule { width:35%; height:2px; background:var(--accent); opacity:.4; margin:32px auto; }
  .cover-rule-sm { width:20%; height:1px; background:var(--accent); opacity:.3; margin:20px auto; }
  .cover h1 { font-family:${theme.fontDisplay}; font-size:${ps.coverTitleSize}px; margin:0; color:var(--accent); line-height:1.2; }
  .cover .author { font-size:${ps.bodyFontSize * 1.4}px; opacity:.65; margin:0; }
  .chapter-num { font-family:${theme.fontDisplay}; letter-spacing:.3em; text-transform:uppercase; font-size:${ps.bodyFontSize * 0.75}px; color:var(--accent); text-align:center; margin-bottom:${ps.bodyFontSize * 0.8}px; }
  .chapter-rule { width:20%; height:1px; background:var(--accent); opacity:.35; margin:0 auto ${ps.bodyFontSize * 1.5}px; }
  .chapter-title { font-family:${theme.fontDisplay}; font-size:${ps.chapterTitleSize}px; text-align:center; margin:0 0 ${ps.bodyFontSize * 2.5}px; color:var(--accent); font-weight:700; line-height:1.2; page-break-after:avoid; }
  .chapter-body p { font-size:${ps.bodyFontSize}px; line-height:${ps.lineHeight}; text-align:justify; text-indent:1.5em; margin:0 0 3px; }
  .chapter-body p:first-of-type { text-indent:0; }
  .chapter-body p:first-of-type::first-letter { font-family:${theme.fontDisplay}; font-size:${ps.bodyFontSize * 3.8}px; float:left; line-height:.85; padding:4px 7px 0 0; color:var(--accent); }
  h2,h3,h4 { font-family:${theme.fontDisplay}; color:var(--accent); page-break-after:avoid; }
  .verse { font-style:italic; text-align:center; margin:1.8em 1.2em; padding:.8em 0; line-height:1.9; border-top:1px solid var(--accent); border-bottom:1px solid var(--accent); color:var(--accent); page-break-inside:avoid; }
  .translator-note { border-left:3px solid var(--accent); padding-left:1.2em; margin:1.2em 0; font-style:italic; opacity:.82; page-break-inside:avoid; }
  @media print { body{background:#fff;padding:0} .book-page{box-shadow:none;margin:0;} }
</style>
</head><body>
  <div class="book-page cover">
    <div class="cover-rule"></div>
    <h1>${escapeHtml(book.title)}</h1>
    ${book.author ? `<div class="cover-rule-sm"></div><p class="author">${escapeHtml(book.author)}</p>` : ''}
    <div class="cover-rule"></div>
  </div>
  ${chaptersHtml}
</body></html>`;

  saveAs(new Blob([html], { type: 'text/html;charset=utf-8' }), `${sanitize(book.title)}.html`);
}

export function exportPolishedText(book: Book) {
  const text = book.chapters
    .map(c => `## ${c.title}\n\n${c.html
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'")
      .trim()}`)
    .join('\n\n---\n\n');
  const full = `${book.title}${book.author ? '\nBy ' + book.author : ''}\n\n${'='.repeat(60)}\n\n${text}`;
  saveAs(new Blob([full], { type: 'text/plain;charset=utf-8' }), `${sanitize(book.title)}_polished.txt`);
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
}
function sanitize(s: string) {
  return s.replace(/[^a-z0-9-_]+/gi, '_').slice(0, 60) || 'book';
}
