import { useState } from "react";
import type { Book } from "@/lib/book/docxProcessor";
import { THEMES, type Theme } from "@/lib/book/themes";
import { exportHtml } from "@/lib/book/export";
import { PAGE_SIZES, type PageSize, type PageSizeId } from "@/lib/book/pageSize";
import { bookToPolishText, polishTextToBook } from "@/lib/book/bookTextSync";
import { GeminiSettings } from "@/components/gemini/GeminiSettings";
import { TextPolishDialog } from "@/components/gemini/TextPolishDialog";
import { CoverPageDialog } from "@/components/gemini/CoverPageDialog";

export function Toolbar({
  book, theme, pageSize,
  activeThemeId, activePageSizeId,
  onThemeChange, onPageSizeChange,
  onReset, onTextUpdate, onCoverUpdate,
}: {
  book: Book; theme: Theme; pageSize: PageSize;
  activeThemeId: string; activePageSizeId: PageSizeId;
  onThemeChange: (id: string) => void;
  onPageSizeChange: (id: PageSizeId) => void;
  onReset: () => void;
  onTextUpdate?: (b: Book) => void;
  onCoverUpdate?: (html: string) => void;
}) {
  const [showPolish, setShowPolish] = useState(false);
  const [showCover, setShowCover]   = useState(false);

  const fullText = bookToPolishText(book);

  const handlePolish = (polishedText: string) => {
    if (!onTextUpdate) { setShowPolish(false); return; }
    onTextUpdate(polishTextToBook(polishedText, book));
    setShowPolish(false);
  };

  return (
    <>
      {/* Toolbar */}
      <div className="toolbar-glass relative z-20 flex flex-wrap items-center gap-2 px-3 py-2">

        {/* Logo mark */}
        <button onClick={onReset} className="flex items-center gap-2 mr-1 group">
          <span className="text-lg">🪶</span>
          <span className="shimmer-text font-bold text-sm hidden sm:block">DocBook</span>
        </button>

        <div className="w-px h-5 bg-white/10 mx-1" />

        {/* Book title */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-white/55 text-xs truncate max-w-[140px]" title={book.title}>{book.title}</span>
          <span className="text-white/20 text-xs hidden sm:block">{book.chapters.length} ch</span>
        </div>

        <div className="flex-1" />

        {/* Page size */}
        <div className="flex items-center gap-1.5">
          <span className="text-white/30 text-[10px] uppercase tracking-wider hidden md:block">Page</span>
          <div className="flex gap-0.5 bg-white/4 rounded-lg p-0.5 border border-white/6">
            {(Object.keys(PAGE_SIZES) as PageSizeId[]).map(id => (
              <button key={id} onClick={() => onPageSizeChange(id)}
                title={PAGE_SIZES[id].description}
                className={`rounded-md px-2 py-1 text-[11px] font-medium transition-all duration-200 ${
                  activePageSizeId === id
                    ? 'bg-gradient-to-r from-violet-600/70 to-indigo-600/70 text-white shadow-sm'
                    : 'text-white/40 hover:text-white/75 hover:bg-white/6'
                }`}>
                {PAGE_SIZES[id].label}
              </button>
            ))}
          </div>
        </div>

        <div className="w-px h-4 bg-white/10" />

        {/* Theme */}
        <div className="flex items-center gap-1.5">
          <span className="text-white/30 text-[10px] uppercase tracking-wider hidden md:block">Theme</span>
          <div className="flex gap-0.5 bg-white/4 rounded-lg p-0.5 border border-white/6">
            {Object.values(THEMES).map(t => (
              <button key={t.id} onClick={() => onThemeChange(t.id)}
                className={`rounded-md px-2 py-1 text-[11px] font-medium transition-all duration-200 ${
                  activeThemeId === t.id
                    ? 'bg-gradient-to-r from-violet-600/70 to-indigo-600/70 text-white shadow-sm'
                    : 'text-white/40 hover:text-white/75 hover:bg-white/6'
                }`}>
                {t.name}
              </button>
            ))}
          </div>
        </div>

        <div className="w-px h-4 bg-white/10" />

        {/* Action buttons */}
        <button onClick={() => exportHtml(book, theme, pageSize)}
          className="pill-btn">
          <span>⬇️</span> Export
        </button>

        <button onClick={() => window.print()}
          className="pill-btn">
          <span>🖨️</span> Print
        </button>

        <button onClick={() => setShowCover(true)}
          className="pill-btn"
          style={{ borderColor: 'rgba(199,125,255,0.25)', color: '#c77dff', background: 'rgba(114,9,183,0.12)' }}>
          🎨 Cover
        </button>

        <button onClick={() => setShowPolish(true)}
          className="pill-btn btn-rainbow rounded-full font-semibold"
          style={{ color: 'white', padding: '5px 14px' }}>
          ✨ Polish
        </button>

        <GeminiSettings />
      </div>

      <TextPolishDialog
        text={fullText} book={book} theme={theme}
        onPolish={handlePolish}
        isOpen={showPolish}
        onClose={() => setShowPolish(false)}
      />
      <CoverPageDialog
        title={book.title} author={book.author}
        isOpen={showCover}
        onClose={() => setShowCover(false)}
        onApply={html => onCoverUpdate?.(html)}
      />
    </>
  );
}
