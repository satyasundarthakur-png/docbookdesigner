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
    <div className="flex flex-wrap items-center gap-3 border-b border-neutral-800 bg-neutral-950 px-4 py-3 text-white">
      <button
        onClick={onReset}
        className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-800"
      >
        ← New file
      </button>
      <div className="mx-2 truncate text-sm text-neutral-400">
        <span className="font-semibold text-white">{book.title}</span>
        <span className="mx-2 text-neutral-600">·</span>
        {book.chapters.length} chapters
      </div>
      <div className="ml-auto flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-lg bg-neutral-900 p-1">
          {Object.values(THEMES).map((t) => (
            <button
              key={t.id}
              onClick={() => onThemeChange(t.id)}
              className={`rounded-md px-3 py-1 text-xs transition ${
                activeThemeId === t.id
                  ? "bg-amber-500 text-black"
                  : "text-neutral-300 hover:bg-neutral-800"
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
        <button
          onClick={() => exportHtml(book, theme)}
          className="rounded-lg bg-amber-500 px-4 py-1.5 text-sm font-semibold text-black hover:bg-amber-400"
        >
          Export HTML
        </button>
        <button
          onClick={() => window.print()}
          className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-800"
        >
          Print / PDF
        </button>
      </div>
    </div>
  );
}