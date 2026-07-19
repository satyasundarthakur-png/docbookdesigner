import { saveAs } from "file-saver";
import type { Book } from "./docxProcessor";
import type { Theme } from "./themes";
import type { PageSize } from "./pageSize";
import { PAGE_SIZES } from "./pageSize";
import { FONT_LINK } from "./themes";

export function exportHtml(book: Book, theme: Theme, pageSize?: PageSize) {
  const ps = pageSize ?? PAGE_SIZES['a5'];
  const cw = ps.widthPx - ps.marginInnerPx - ps.marginOuterPx;

  const chaptersHtml = book.chapters.map((c, i) => `
<div class="book-page">
  <div class="chap-num">Chapter ${i + 1}</div>
  <div class="chap-rule"></div>
  <div class="chap-title">${escapeHtml(c.title)}</div>
  <div class="body">${c.html}</div>
</div>`).join('\n');

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/>
<title>${escapeHtml(book.title)}</title>
<link rel="stylesheet" href="${FONT_LINK}"/>
<style>
@page { size:${ps.cssWidth} ${ps.cssHeight}; margin:${ps.cssMargin}; }
*{box-sizing:border-box;}
:root{--bg:${theme.pageBg};--fg:${theme.pageColor};--acc:${theme.accent};}
body{background:#1a1a2e;margin:0;padding:24px 0;font-family:${theme.fontBody};}

.book-page{
  background:var(--bg);color:var(--fg);font-family:${theme.fontBody};
  width:${ps.cssWidth};min-height:${ps.cssHeight};
  margin:0 auto 24px;
  padding:${ps.marginTopPx}px ${ps.marginOuterPx}px ${ps.marginBottomPx}px ${ps.marginInnerPx}px;
  box-shadow:0 4px 32px rgba(0,0,0,.5);
  page-break-after:always;
}
.cover{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;}
.cover-top-rule,.cover-bot-rule{width:${Math.round(cw*.45)}px;height:1.5px;background:var(--acc);opacity:.35;margin:${Math.round(ps.coverTitlePx*1.4)}px auto;}
.cover-mid-rule{width:${Math.round(cw*.22)}px;height:1px;background:var(--acc);opacity:.25;margin:${Math.round(ps.coverTitlePx*.7)}px auto;}
.cover h1{font-family:${theme.fontDisplay};font-size:${ps.coverTitlePx}px;line-height:${Math.round(ps.coverTitlePx*1.18)}px;color:var(--acc);font-weight:700;margin:0;}
.cover .author{font-size:${ps.coverAuthorPx}px;opacity:.65;margin:0;}

.body p{font-size:${ps.bodyFontSizePx}px;line-height:${ps.leadingPx}px;text-align:justify;text-indent:1.5em;margin:0 0 ${Math.round(ps.leadingPx*.15)}px;orphans:3;widows:3;}
.body p:first-of-type{text-indent:0;}
.body p:first-of-type::first-letter{font-family:${theme.fontDisplay};font-size:${Math.round(ps.bodyFontSizePx*3.5)}px;float:left;line-height:.82;padding:${Math.round(ps.bodyFontSizePx*.28)}px ${Math.round(ps.bodyFontSizePx*.55)}px 0 0;color:var(--acc);}
.body h2{font-family:${theme.fontDisplay};font-size:${ps.sectionTitlePx}px;color:var(--acc);font-weight:700;margin:${Math.round(ps.leadingPx*1.5)}px 0 ${Math.round(ps.leadingPx*.5)}px;page-break-after:avoid;}
.body h3{font-family:${theme.fontDisplay};font-size:${Math.round(ps.subSectionPt*1.333)}px;color:var(--acc);font-weight:700;margin:${ps.leadingPx}px 0 ${Math.round(ps.leadingPx*.4)}px;page-break-after:avoid;}
.body .verse{font-style:italic;text-align:center;margin:${ps.leadingPx*1.2}px ${Math.round(cw*.08)}px;padding:${Math.round(ps.leadingPx*.6)}px 0;border-top:1px solid var(--acc);border-bottom:1px solid var(--acc);color:var(--acc);font-size:${Math.round(ps.bodyFontSizePx*.94)}px;}
.body .translator-note{border-left:2px solid var(--acc);padding-left:${Math.round(cw*.06)}px;margin:${ps.leadingPx}px 0;font-style:italic;font-size:${Math.round(ps.bodyFontSizePx*.92)}px;opacity:.80;page-break-inside:avoid;}
.body blockquote{margin:${ps.leadingPx}px ${Math.round(cw*.06)}px;font-size:${Math.round(ps.bodyFontSizePx*.94)}px;opacity:.85;}

.chap-num{font-family:${theme.fontDisplay};font-size:${Math.round(ps.chapterNumPt*1.333)}px;color:var(--acc);text-align:center;letter-spacing:.25em;text-transform:uppercase;font-weight:700;line-height:1;margin-bottom:${Math.round(ps.leadingPx*.6)}px;}
.chap-rule{width:${Math.round(cw*.18)}px;height:1px;background:var(--acc);margin:0 auto ${Math.round(ps.leadingPx*.9)}px;opacity:.4;}
.chap-title{font-family:${theme.fontDisplay};font-size:${ps.chapterTitlePx}px;line-height:${Math.round(ps.chapterTitlePx*1.22)}px;color:var(--acc);text-align:center;font-weight:700;font-style:italic;margin:0 0 ${Math.round(ps.leadingPx*2)}px;page-break-after:avoid;}

@media print{body{background:#fff;padding:0;}.book-page{box-shadow:none;margin:0;}}
</style>
</head><body>
<div class="book-page cover">
  <div class="cover-top-rule"></div>
  <h1>${escapeHtml(book.title)}</h1>
  ${book.author ? `<div class="cover-mid-rule"></div><p class="author">${escapeHtml(book.author)}</p>` : ''}
  <div class="cover-bot-rule"></div>
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
