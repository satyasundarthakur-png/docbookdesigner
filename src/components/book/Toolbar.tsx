import { useState } from "react";
import type { Book } from "@/lib/book/docxProcessor";
import { THEMES, type Theme } from "@/lib/book/themes";
import { exportHtml } from "@/lib/book/export";
import { GeminiSettings } from "@/components/gemini/GeminiSettings";
import { TextPolishDialog } from "@/components/gemini/TextPolishDialog";
import { CoverPageDialog } from "@/components/gemini/CoverPageDialog";
import { getStoredModel } from "@/lib/gemini/config";

/** Strip HTML tags to plain text before sending to Gemini */
function htmlToPlainText(html: string): string {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
}

export function Toolbar({
  book,
  theme,
  activeThemeId,
  onThemeChange,
  onReset,
  onTextUpdate,
  onCoverUpdate,
}: {
  book: Book;
  theme: Theme;
  activeThemeId: string;
  onThemeChange: (id: string) => void;
  onReset: () => void;
  onTextUpdate?: (updatedBook: Book) => void;
  onCoverUpdate?: (coverHtml: string) => void;
}) {
  const [showPolishDialog, setShowPolishDialog] = useState(false);
  const [showCoverDialog, setShowCoverDialog] = useState(false);

  // Convert HTML chapters to plain text markdown for Gemini
  const fullText = book.chapters
    .map(c => `## ${c.title}\n\n${htmlToPlainText(c.html)}`)
    .join("\n\n");

  const handlePolish = (polishedText: string) => {
    if (!onTextUpdate) { setShowPolishDialog(false); return; }

    // Split polished text back into chapters by ## headings
    const sections = polishedText.split(/^## /m).filter(Boolean);
    const updatedChapters = book.chapters.map((chapter, i) => {
      const section = sections[i];
      if (!section) return chapter;
      const newlineIdx = section.indexOf("\n");
      const body = newlineIdx >= 0 ? section.slice(newlineIdx + 1).trim() : "";
      const newHtml = body
        .split(/\n\n+/)
        .filter(Boolean)
        .map(para => `<p>${para.replace(/\n/g, "<br/>")}</p>`)
        .join("\n");
      return { ...chapter, html: newHtml || chapter.html };
    });

    onTextUpdate({ ...book, chapters: updatedChapters });
    setShowPolishDialog(false);
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 border-b border-neutral-700 bg-neutral-950 px-4 py-3 text-white">
        {/* Back */}
        <button
          onClick={onReset}
          className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-800 transition-colors"
          title="Start with a new document"
        >
          ← New file
        </button>

        {/* Book Info */}
        <div className="truncate text-sm text-neutral-400 border-l border-neutral-700 pl-4 max-w-xs">
          <span className="font-semibold text-white">{book.title}</span>
          <span className="mx-2 text-neutral-700">·</span>
          <span>{book.chapters.length} chapters</span>
        </div>

        {/* Right */}
        <div className="ml-auto flex flex-wrap items-center gap-2">

          {/* Theme Selector */}
          <div className="flex gap-1 rounded-lg bg-neutral-900 p-1 border border-neutral-800">
            {Object.values(THEMES).map((t) => (
              <button
                key={t.id}
                onClick={() => onThemeChange(t.id)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  activeThemeId === t.id
                    ? "bg-neutral-700 text-white"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-800"
                }`}
                title={t.name}
              >
                {t.name}
              </button>
            ))}
          </div>

          {/* Export */}
          <button
            onClick={() => exportHtml(book, theme)}
            className="rounded-lg bg-neutral-800 border border-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-700 transition-colors"
            title="Export as HTML file"
          >
            ⬇️ Export
          </button>

          {/* Print */}
          <button
            onClick={() => window.print()}
            className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-800 transition-colors"
            title="Print or save as PDF"
          >
            🖨️ Print
          </button>

          {/* AI Cover Page */}
          <button
            onClick={() => setShowCoverDialog(true)}
            className="rounded-lg border border-purple-700/50 bg-purple-900/20 px-3 py-1.5 text-sm text-purple-300 hover:bg-purple-900/40 transition-colors"
            title="Generate AI cover page"
          >
            🎨 Cover
          </button>

          {/* AI Polish */}
          <button
            onClick={() => setShowPolishDialog(true)}
            className="rounded-lg border border-purple-700/50 bg-purple-900/20 px-3 py-1.5 text-sm text-purple-300 hover:bg-purple-900/40 transition-colors"
            title={`Polish text with Gemini (${getStoredModel().includes('lite') ? 'Flash Lite' : 'Flash'})`}
          >
            ✨ Polish
          </button>

          {/* AI Settings */}
          <GeminiSettings />
        </div>
      </div>

      {/* Dialogs */}
      <TextPolishDialog
        text={fullText}
        onPolish={handlePolish}
        isOpen={showPolishDialog}
        onClose={() => setShowPolishDialog(false)}
      />

      <CoverPageDialog
        title={book.title}
        author={book.author}
        isOpen={showCoverDialog}
        onClose={() => setShowCoverDialog(false)}
        onApply={(html) => onCoverUpdate?.(html)}
      />
    </>
  );
}
