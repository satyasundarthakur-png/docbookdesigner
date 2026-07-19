import { useState } from "react";
import type { Book } from "@/lib/book/docxProcessor";
import type { Theme } from "@/lib/book/themes";
import type { PageSize } from "@/lib/book/pageSize";

export function BookPreview({
  book,
  theme,
  pageSize,
  customCoverHtml,
  onBookMetaChange,
}: {
  book: Book;
  theme: Theme;
  pageSize: PageSize;
  customCoverHtml?: string | null;
  onBookMetaChange?: (title: string, author: string) => void;
}) {
  const [editingTitle, setEditingTitle]   = useState(false);
  const [editingAuthor, setEditingAuthor] = useState(false);
  const [titleDraft, setTitleDraft]       = useState(book.title);
  const [authorDraft, setAuthorDraft]     = useState(book.author);

  const commitTitle = () => {
    setEditingTitle(false);
    if (titleDraft.trim()) onBookMetaChange?.(titleDraft.trim(), book.author);
  };
  const commitAuthor = () => {
    setEditingAuthor(false);
    onBookMetaChange?.(book.title, authorDraft.trim());
  };

  const {
    widthPx, heightPx,
    marginTopPx, marginBottomPx, marginOuterPx, marginInnerPx,
    bodyFontSize, lineHeight, chapterTitleSize, coverTitleSize,
    cssWidth, cssHeight, cssMargin,
  } = pageSize;

  // Inner content width (page minus margins)
  const contentWidth = widthPx - marginInnerPx - marginOuterPx;

  const pageStyle: React.CSSProperties = {
    width: widthPx,
    minHeight: heightPx,
    paddingTop: marginTopPx,
    paddingBottom: marginBottomPx,
    paddingLeft: marginInnerPx,
    paddingRight: marginOuterPx,
    boxSizing: 'border-box',
    background: theme.pageBg,
    color: theme.pageColor,
    fontFamily: theme.fontBody,
    position: 'relative',
  };

  return (
    <div className="flex-1 overflow-auto bg-neutral-800">
      <style>{`
        /* Screen styles */
        .book-page h1,.book-page h2,.book-page h3{font-family:${theme.fontDisplay};color:${theme.accent};page-break-inside:avoid;page-break-after:avoid;}
        .book-page p{font-size:${bodyFontSize}px;line-height:${lineHeight};text-align:justify;text-indent:1.5em;margin:0 0 3px;}
        .book-page p:first-of-type{text-indent:0;}
        .book-page p:first-of-type::first-letter{
          font-family:${theme.fontDisplay};
          font-size:${bodyFontSize * 3.8}px;
          float:left;line-height:.85;
          padding:4px 7px 0 0;
          color:${theme.accent};
        }
        .book-page .no-drop-cap p:first-of-type::first-letter,
        .no-drop-cap::first-letter{float:none;font-size:inherit;padding:0;}
        .book-page .verse{font-style:italic;text-align:center;margin:1.8em 1.2em;padding:.8em 0;line-height:1.9;border-top:1px solid ${theme.accent};border-bottom:1px solid ${theme.accent};color:${theme.accent};}
        .book-page .translator-note{border-left:3px solid ${theme.accent};padding-left:1.2em;margin:1.2em 0;font-style:italic;opacity:.82;page-break-inside:avoid;}
        .cover-title{font-family:${theme.fontDisplay};color:${theme.accent};}
        .chapter-num{font-family:${theme.fontDisplay};color:${theme.accent};letter-spacing:.3em;text-transform:uppercase;}
        .chapter-title{font-family:${theme.fontDisplay};color:${theme.accent};}

        /* Print styles — exact page size */
        @media print {
          @page { size:${cssWidth} ${cssHeight}; margin:${cssMargin}; }
          body { background:#fff !important; margin:0 !important; }
          .book-page {
            width:${cssWidth} !important;
            min-height:${cssHeight} !important;
            padding:0 !important;
            box-shadow:none !important;
            margin:0 !important;
            page-break-after:always;
          }
          .print-gap { display:none !important; }
        }
      `}</style>

      {/* Wrapper — centres pages, shows dark gutters between them */}
      <div
        className="mx-auto flex flex-col items-center gap-6 py-8 print:gap-0 print:py-0"
        style={{ width: widthPx + 32 }}
      >

        {/* Cover */}
        {customCoverHtml ? (
          <div
            className="shadow-2xl overflow-hidden"
            style={{ width: widthPx, minHeight: heightPx }}
            dangerouslySetInnerHTML={{ __html: customCoverHtml }}
          />
        ) : (
          <div className="book-page shadow-2xl no-drop-cap" style={{
            ...pageStyle,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
          }}>
            {/* Decorative top rule */}
            <div style={{ width: contentWidth * 0.4, height: 2, background: theme.accent, marginBottom: 40, opacity: 0.4 }} />

            {/* Editable Title */}
            {editingTitle ? (
              <input autoFocus value={titleDraft}
                onChange={e => setTitleDraft(e.target.value)}
                onBlur={commitTitle}
                onKeyDown={e => { if (e.key === 'Enter') commitTitle(); if (e.key === 'Escape') setEditingTitle(false); }}
                className="bg-transparent border-b-2 border-dashed outline-none text-center w-full cover-title"
                style={{ fontSize: coverTitleSize, fontWeight: 700, color: theme.accent, fontFamily: theme.fontDisplay }}
              />
            ) : (
              <div className="group relative">
                <h1 className="cover-title" style={{ fontSize: coverTitleSize, margin: 0, fontWeight: 700, cursor: 'text', lineHeight: 1.2 }}
                  onClick={() => { setTitleDraft(book.title); setEditingTitle(true); }}>
                  {book.title}
                </h1>
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  Click to edit
                </span>
              </div>
            )}

            {/* Thin rule between title and author */}
            <div style={{ width: contentWidth * 0.25, height: 1, background: theme.accent, margin: '24px auto', opacity: 0.35 }} />

            {/* Editable Author */}
            {editingAuthor ? (
              <input autoFocus value={authorDraft}
                onChange={e => setAuthorDraft(e.target.value)}
                onBlur={commitAuthor}
                onKeyDown={e => { if (e.key === 'Enter') commitAuthor(); if (e.key === 'Escape') setEditingAuthor(false); }}
                placeholder="Author name…"
                className="text-center bg-transparent border-b border-dashed outline-none"
                style={{ fontSize: bodyFontSize * 1.5, opacity: 0.7, color: theme.pageColor, fontFamily: theme.fontBody, width: contentWidth * 0.6 }}
              />
            ) : (
              <div className="group relative">
                <div style={{ fontSize: bodyFontSize * 1.5, opacity: 0.65, cursor: 'text', minHeight: bodyFontSize * 2 }}
                  onClick={() => { setAuthorDraft(book.author); setEditingAuthor(true); }}>
                  {book.author || <span className="text-neutral-400 italic" style={{ fontSize: bodyFontSize }}>+ Add author</span>}
                </div>
                <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  Click to edit
                </span>
              </div>
            )}

            {/* Bottom rule */}
            <div style={{ width: contentWidth * 0.4, height: 2, background: theme.accent, marginTop: 40, opacity: 0.4 }} />
          </div>
        )}

        {/* Chapters */}
        {book.chapters.map((c, i) => (
          <div key={i} className="book-page shadow-2xl" style={pageStyle}>
            {/* Chapter number */}
            <div className="chapter-num" style={{ fontSize: bodyFontSize * 0.75, textAlign: 'center', marginBottom: bodyFontSize * 0.8, letterSpacing: '0.3em' }}>
              Chapter {i + 1}
            </div>
            {/* Thin rule */}
            <div style={{ width: contentWidth * 0.2, height: 1, background: theme.accent, margin: '0 auto', opacity: 0.35, marginBottom: bodyFontSize * 1.5 }} />
            {/* Chapter title */}
            <h1 className="chapter-title" style={{ fontSize: chapterTitleSize, textAlign: 'center', margin: `0 0 ${bodyFontSize * 2.5}px`, fontWeight: 700, lineHeight: 1.2 }}>
              {c.title}
            </h1>
            {/* Body */}
            <div dangerouslySetInnerHTML={{ __html: c.html }} />
          </div>
        ))}

        {/* Bottom padding spacer */}
        <div className="print-gap" style={{ height: 32 }} />
      </div>
    </div>
  );
}
