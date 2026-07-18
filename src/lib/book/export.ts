import { saveAs } from "file-saver";
import type { Book } from "./docxProcessor";
import type { Theme } from "./themes";
import { FONT_LINK } from "./themes";

export function exportHtml(book: Book, theme: Theme) {
  const chaptersHtml = book.chapters
    .map(
      (c, i) => `
      <section class="chapter">
        <div class="chapter-num">Chapter ${i + 1}</div>
        <h1 class="chapter-title">${escapeHtml(c.title)}</h1>
        <div class="chapter-body">${c.html}</div>
      </section>`,
    )
    .join("\n");

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/>
<title>${escapeHtml(book.title)}</title>
<link rel="stylesheet" href="${FONT_LINK}"/>
<style>
  :root { --bg:${theme.pageBg}; --fg:${theme.pageColor}; --accent:${theme.accent}; }
  body { background:#222; margin:0; font-family:${theme.fontBody}; color:var(--fg); }
  .page { max-width: 680px; margin: 40px auto; background:var(--bg); padding: 80px 72px; box-shadow: 0 20px 60px rgba(0,0,0,.4); }
  .cover { text-align:center; padding: 160px 60px; }
  .cover h1 { font-family:${theme.fontDisplay}; font-size: 56px; margin:0 0 24px; color:var(--accent); }
  .cover .author { font-family:${theme.fontBody}; font-size: 20px; opacity:.7; }
  .chapter { page-break-before: always; }
  .chapter-num { font-family:${theme.fontDisplay}; letter-spacing:.3em; text-transform:uppercase; font-size:12px; color:var(--accent); text-align:center; margin-bottom:12px; }
  .chapter-title { font-family:${theme.fontDisplay}; font-size:42px; text-align:center; margin: 0 0 48px; color:var(--accent); }
  .chapter-body p { font-size:17px; line-height:1.75; text-align:justify; text-indent:1.5em; margin:0; }
  .chapter-body p:first-of-type { text-indent:0; }
  .chapter-body p:first-of-type::first-letter { font-family:${theme.fontDisplay}; font-size:56px; float:left; line-height:.9; padding:6px 8px 0 0; color:var(--accent); }
  h2,h3 { font-family:${theme.fontDisplay}; color:var(--accent); }
  @media print { body{background:#fff} .page{box-shadow:none;margin:0;max-width:none} }
</style>
</head><body>
  <div class="page cover">
    <h1>${escapeHtml(book.title)}</h1>
    ${book.author ? `<div class="author">${escapeHtml(book.author)}</div>` : ""}
  </div>
  <div class="page">${chaptersHtml}</div>
</body></html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  saveAs(blob, `${sanitize(book.title)}.html`);
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
function sanitize(s: string) {
  return s.replace(/[^a-z0-9-_]+/gi, "_").slice(0, 60) || "book";
}