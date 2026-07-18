import type { Book } from "@/lib/book/docxProcessor";
import { THEMES, type Theme } from "@/lib/book/themes";
import { exportHtml } from "@/lib/book/export";

export function Toolbar({
  book,
  theme,
  activeThemeId,
  onThemeChange,
  onReset,
}: {
  book: Book;
  theme: Theme;
  activeThemeId: string;
  onThemeChange: (id: string) => void;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-neutral-700 bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 px-4 py-4 text-white backdrop-blur-sm">
      {/* Back Button with Glow */}
      <button
        onClick={onReset}
        className="rounded-lg border border-neutral-700 px-4 py-2 text-sm font-medium hover:border-cyan-400/60 hover:bg-neutral-800/60 transition-all duration-300 btn-glow group"
        title="Start with a new document"
      >
        <span className="group-hover:text-cyan-300 transition-colors">← New file</span>
      </button>

      {/* Book Info */}
      <div className="mx-4 truncate text-sm text-neutral-300 border-l border-neutral-700 pl-4">
        <span className="font-bold bg-gradient-to-r from-amber-300 to-orange-300 bg-clip-text text-transparent">
          {book.title}
        </span>
        <span className="mx-2 text-neutral-600">·</span>
        <span className="text-neutral-400">{book.chapters.length} chapters</span>
      </div>

      {/* Right Section */}
      <div className="ml-auto flex flex-wrap items-center gap-3">
        
        {/* Theme Selector with Rainbow Glow */}
        <div className="flex gap-1 rounded-xl bg-neutral-900/50 p-1.5 backdrop-blur-sm border border-neutral-800/50 rainbow-glow-subtle">
          {Object.values(THEMES).map((t) => (
            <button
              key={t.id}
              onClick={() => onThemeChange(t.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-300 ${
                activeThemeId === t.id
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-lg shadow-amber-500/50 scale-105"
                  : "text-neutral-300 hover:text-white hover:bg-neutral-800/60"
              }`}
              title={t.name}
            >
              {t.name}
            </button>
          ))}
        </div>

        {/* Export Button with Rainbow Pulse */}
        <button
          onClick={() => {
            exportHtml(book, theme);
            // Celebration animation trigger
            const el = document.activeElement as HTMLElement;
            if (el) {
              el.style.animation = 'rainbow-pulse 0.6s ease-out';
            }
          }}
          className="rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 px-5 py-2 text-sm font-bold text-white hover:from-green-400 hover:to-emerald-400 transition-all duration-300 btn-glow shadow-lg shadow-green-500/50 hover:shadow-green-400/70 transform hover:scale-105"
          title="Export as HTML file"
        >
          <span>⬇️ Export HTML</span>
        </button>

        {/* Print Button with Rainbow Glow */}
        <button
          onClick={() => {
            window.print();
          }}
          className="rounded-lg border border-neutral-600 px-4 py-2 text-sm font-medium text-neutral-100 hover:border-blue-400/60 hover:bg-neutral-800/60 hover:text-blue-300 transition-all duration-300 btn-glow"
          title="Print or save as PDF"
        >
          🖨️ Print / PDF
        </button>

        {/* World Cup Celebration Indicator */}
        <div className="ml-2 text-2xl world-cup-glow" title="World Cup Quality Typography">
          ⚽
        </div>
      </div>
    </div>
  );
}