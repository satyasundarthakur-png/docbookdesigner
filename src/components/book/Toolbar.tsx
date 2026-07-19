import { useState } from "react";
import type { Book } from "@/lib/book/docxProcessor";
import { THEMES, type Theme } from "@/lib/book/themes";
import { exportHtml } from "@/lib/book/export";
import { PAGE_SIZES, type PageSize, type PageSizeId } from "@/lib/book/pageSize";
import { GeminiSettings } from "@/components/gemini/GeminiSettings";
import { TextPolishDialog } from "@/components/gemini/TextPolishDialog";
import { CoverPageDialog } from "@/components/gemini/CoverPageDialog";

function htmlToPlainText(html: string): string {
  if (typeof document === 'undefined') return html.replace(/<[^>]+>/g, '');
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
}

export function Toolbar({
  book,
  theme,
  pageSize,
  activeThemeId,
  activePageSizeId,
  onThemeChange,
  onPageSizeChange,
  onReset,
  onTextUpdate,
  onCoverUpdate,
}: {
  book: Book;
  theme: Theme;
  pageSize: PageSize;
  activeThemeId: string;
  activePageSizeId: PageSizeId;
  onThemeChange: (id: string) => void;
  onPageSizeChange: (id: PageSizeId) => void;
  onReset: () => void;
  onTextUpdate?: (updatedBook: Book) => void;
  onCoverUpdate?: (coverHtml: string) => void;
}) {
  const [showPolishDialog, setShowPolishDialog] = useState(false);
  const [showCoverDialog, setShowCoverDialog]   = useState(false);

  const fullText = book.chapters
    .map(c => `## ${c.title}\n\n${htmlToPlainText(c.html)}`)
    .join("\n\n");

  const handlePolish = (polishedText: string) => {
    if (!onTextUpdate) { setShowPolishDialog(false); return; }
    const sections = polishedText.split(/^## /m).filter(Boolean);
    const updatedChapters = book.chapters.map((chapter, i) => {
      const section = sections[i];
      if (!section) return chapter;
      const newlineIdx = section.indexOf("\n");
      const body = newlineIdx >= 0 ? section.slice(newlineIdx + 1).trim() : "";
      const newHtml = body.split(/\n\n+/).filter(Boolean)
        .map(para => `<p>${para.replace(/\n/g, "<br/>")}</p>`).join("\n");
      return { ...chapter, html: newHtml || chapter.html };
    });
    onTextUpdate({ ...book, chapters: updatedChapters });
    setShowPolishDialog(false);
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 border-b border-neutral-700 bg-neutral-950 px-3 py-2.5 text-white text-sm">

        {/* Back */}
        <button onClick={onReset}
          className="rounded border border-neutral-700 px-3 py-1.5 hover:bg-neutral-800 transition-colors whitespace-nowrap">
          ← New file
        </button>

        {/* Book title */}
        <div className="truncate text-neutral-400 border-l border-neutral-700 pl-3 max-w-[160px]">
          <span className="font-medium text-white">{book.title}</span>
          <span className="ml-2 text-neutral-600">{book.chapters.length} ch</span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Page size */}
        <div className="flex items-center gap-1.5">
          <span className="text-neutral-500 text-xs">Page</span>
          <div className="flex gap-1 rounded-md bg-neutral-900 p-0.5 border border-neutral-800">
            {(Object.keys(PAGE_SIZES) as PageSizeId[]).map(id => (
              <button key={id}
                onClick={() => onPageSizeChange(id)}
                className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                  activePageSizeId === id
                    ? 'bg-neutral-600 text-white'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`}
                title={PAGE_SIZES[id].description}
              >
                {PAGE_SIZES[id].label}
              </button>
            ))}
          </div>
        </div>

        {/* Theme selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-neutral-500 text-xs">Theme</span>
          <div className="flex gap-1 rounded-md bg-neutral-900 p-0.5 border border-neutral-800">
            {Object.values(THEMES).map(t => (
              <button key={t.id}
                onClick={() => onThemeChange(t.id)}
                className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                  activeThemeId === t.id
                    ? 'bg-neutral-600 text-white'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`}
                title={t.name}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        {/* Export */}
        <button onClick={() => exportHtml(book, theme, pageSize)}
          className="rounded border border-neutral-700 px-3 py-1.5 hover:bg-neutral-800 transition-colors whitespace-nowrap">
          ⬇️ Export
        </button>

        {/* Print */}
        <button onClick={() => window.print()}
          className="rounded border border-neutral-700 px-3 py-1.5 hover:bg-neutral-800 transition-colors">
          🖨️ Print
        </button>

        {/* AI Cover */}
        <button onClick={() => setShowCoverDialog(true)}
          className="rounded border border-purple-800/60 bg-purple-900/20 px-3 py-1.5 text-purple-300 hover:bg-purple-900/40 transition-colors whitespace-nowrap">
          🎨 Cover
        </button>

        {/* AI Polish */}
        <button onClick={() => setShowPolishDialog(true)}
          className="rounded border border-purple-800/60 bg-purple-900/20 px-3 py-1.5 text-purple-300 hover:bg-purple-900/40 transition-colors whitespace-nowrap">
          ✨ Polish
        </button>

        {/* AI Settings */}
        <GeminiSettings />
      </div>

      <TextPolishDialog
        text={fullText} book={book} theme={theme}
        onPolish={handlePolish}
        isOpen={showPolishDialog}
        onClose={() => setShowPolishDialog(false)}
      />
      <CoverPageDialog
        title={book.title} author={book.author}
        isOpen={showCoverDialog}
        onClose={() => setShowCoverDialog(false)}
        onApply={html => onCoverUpdate?.(html)}
      />
    </>
  );
}
