import { useState } from "react";
import type { Book } from "@/lib/book/docxProcessor";
import type { Theme } from "@/lib/book/themes";

export function BookPreview({
  book,
  theme,
  customCoverHtml,
  onBookMetaChange,
}: {
  book: Book;
  theme: Theme;
  customCoverHtml?: string | null;
  onBookMetaChange?: (title: string, author: string) => void;
}) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState(false);
  const [titleDraft, setTitleDraft] = useState(book.title);
  const [authorDraft, setAuthorDraft] = useState(book.author);

  const commitTitle = () => {
    setEditingTitle(false);
    if (titleDraft.trim()) onBookMetaChange?.(titleDraft.trim(), book.author);
  };
  const commitAuthor = () => {
    setEditingAuthor(false);
    onBookMetaChange?.(book.title, authorDraft.trim());
  };

  return (
    <div className="flex-1 overflow-auto bg-neutral-900">
      <style>{`
        .book-page { background:${theme.pageBg}; color:${theme.pageColor}; font-family:${theme.fontBody}; }
        .book-page h1,.book-page h2,.book-page h3{font-family:${theme.fontDisplay};color:${theme.accent};page-break-inside:avoid;page-break-after:avoid;}
        .book-page p{font-size:17px;line-height:1.75;text-align:justify;text-indent:1.5em;margin:0 0 4px;}
        .book-page p:first-of-type{text-indent:0;}
        .book-page p:first-of-type::first-letter{font-family:${theme.fontDisplay};font-size:54px;float:left;line-height:.9;padding:6px 8px 0 0;color:${theme.accent};}
        .book-page .no-drop-cap::first-letter{float:none;font-size:inherit;}
        .book-page .verse{font-style:italic;text-align:center;margin:2em 1.5em;padding:1em 0;line-height:1.9;border-top:1px solid ${theme.accent};border-bottom:1px solid ${theme.accent};color:${theme.accent};}
        .book-page .translator-note{border-left:4px solid ${theme.accent};padding-left:1.5em;margin:1.5em 0;font-style:italic;opacity:.85;page-break-inside:avoid;}
        .cover-title{font-family:${theme.fontDisplay};color:${theme.accent};}
        .chapter-num{font-family:${theme.fontDisplay};color:${theme.accent};letter-spacing:.3em;text-transform:uppercase;}
        .chapter-title{font-family:${theme.fontDisplay};color:${theme.accent};}
      `}</style>

      <div className="mx-auto flex max-w-3xl flex-col items-stretch gap-8 px-4 py-8 print:gap-0 print:py-0">

        {/* Cover */}
        {customCoverHtml ? (
          <div className="shadow-2xl rounded-sm overflow-hidden" dangerouslySetInnerHTML={{ __html: customCoverHtml }} />
        ) : (
          <div className="book-page shadow-2xl" style={{ padding: "140px 60px", textAlign: "center", minHeight: 720 }}>

            {/* Editable Title */}
            {editingTitle ? (
              <input
                autoFocus
                value={titleDraft}
                onChange={e => setTitleDraft(e.target.value)}
                onBlur={commitTitle}
                onKeyDown={e => { if (e.key === 'Enter') commitTitle(); if (e.key === 'Escape') setEditingTitle(false); }}
                className="w-full text-center bg-transparent border-b-2 border-dashed outline-none cover-title no-drop-cap"
                style={{ fontSize: 48, fontWeight: 700, color: theme.accent, fontFamily: theme.fontDisplay }}
              />
            ) : (
              <div className="group relative inline-block">
                <h1
                  className="cover-title no-drop-cap"
                  style={{ fontSize: 52, margin: 0, fontWeight: 700, cursor: 'text' }}
                  onClick={() => { setTitleDraft(book.title); setEditingTitle(true); }}
                >
                  {book.title}
                </h1>
                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  Click to edit title
                </span>
              </div>
            )}

            {/* Editable Author */}
            <div style={{ marginTop: 28 }}>
              {editingAuthor ? (
                <input
                  autoFocus
                  value={authorDraft}
                  onChange={e => setAuthorDraft(e.target.value)}
                  onBlur={commitAuthor}
                  onKeyDown={e => { if (e.key === 'Enter') commitAuthor(); if (e.key === 'Escape') setEditingAuthor(false); }}
                  placeholder="Author name…"
                  className="text-center bg-transparent border-b border-dashed outline-none w-64"
                  style={{ fontSize: 20, opacity: 0.7, color: theme.pageColor, fontFamily: theme.fontBody }}
                />
              ) : (
                <div className="group relative inline-block">
                  <div
                    style={{ fontSize: 20, opacity: 0.65, cursor: 'text', minWidth: 80, minHeight: 28 }}
                    onClick={() => { setAuthorDraft(book.author); setEditingAuthor(true); }}
                  >
                    {book.author || <span className="text-neutral-400 italic text-base">+ Add author</span>}
                  </div>
                  <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    Click to edit author
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Chapters */}
        {book.chapters.map((c, i) => (
          <div key={i} className="book-page shadow-2xl" style={{ padding: "72px 72px", minHeight: 720 }}>
            <div className="chapter-num" style={{ fontSize: 11, textAlign: "center", marginBottom: 10 }}>
              Chapter {i + 1}
            </div>
            <h1 className="chapter-title" style={{ fontSize: 38, textAlign: "center", margin: "0 0 44px", fontWeight: 700 }}>
              {c.title}
            </h1>
            <div dangerouslySetInnerHTML={{ __html: c.html }} />
          </div>
        ))}
      </div>
    </div>
  );
}
