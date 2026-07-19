import { useState } from "react";
import type { Book } from "@/lib/book/docxProcessor";
import type { Theme } from "@/lib/book/themes";
import type { PageSize } from "@/lib/book/pageSize";

export function BookPreview({
  book, theme, pageSize, customCoverHtml, onBookMetaChange,
}: {
  book: Book; theme: Theme; pageSize: PageSize;
  customCoverHtml?: string | null;
  onBookMetaChange?: (title: string, author: string) => void;
}) {
  const [editingTitle, setEditingTitle]   = useState(false);
  const [editingAuthor, setEditingAuthor] = useState(false);
  const [titleDraft, setTitleDraft]       = useState(book.title);
  const [authorDraft, setAuthorDraft]     = useState(book.author);

  const commitTitle  = () => { setEditingTitle(false);  if (titleDraft.trim()) onBookMetaChange?.(titleDraft.trim(), book.author); };
  const commitAuthor = () => { setEditingAuthor(false); onBookMetaChange?.(book.title, authorDraft.trim()); };

  const {
    widthPx, heightPx,
    marginTopPx, marginBottomPx, marginInnerPx, marginOuterPx,
    bodyFontSizePx, leadingPx,
    chapterNumPt, chapterTitlePx, sectionTitlePx, subSectionPt,
    coverTitlePx, coverAuthorPx,
    cssWidth, cssHeight, cssMargin,
  } = pageSize;

  const contentWidth = widthPx - marginInnerPx - marginOuterPx;

  const pageStyle: React.CSSProperties = {
    width:          widthPx,
    minHeight:      heightPx,
    paddingTop:     marginTopPx,
    paddingBottom:  marginBottomPx,
    paddingLeft:    marginInnerPx,
    paddingRight:   marginOuterPx,
    boxSizing:      'border-box',
    background:     theme.pageBg,
    color:          theme.pageColor,
    fontFamily:     theme.fontBody,
  };

  return (
    <div className="flex-1 overflow-auto" style={{ background: '#1a1a2e' }}>
      <style>{`
        /* ── Type scale from page size ── */
        .bp { font-size:${bodyFontSizePx}px; line-height:${leadingPx}px; }
        .bp p {
          font-size:${bodyFontSizePx}px;
          line-height:${leadingPx}px;
          text-align:justify;
          text-indent:1.5em;
          margin:0 0 ${Math.round(leadingPx * 0.15)}px;
          orphans:3; widows:3;
        }
        .bp p:first-of-type { text-indent:0; }
        .bp p:first-of-type::first-letter {
          font-family:${theme.fontDisplay};
          font-size:${Math.round(bodyFontSizePx * 3.5)}px;
          float:left; line-height:0.82;
          padding:${Math.round(bodyFontSizePx * 0.28)}px ${Math.round(bodyFontSizePx * 0.55)}px 0 0;
          color:${theme.accent};
        }
        .bp .no-dropcap p:first-of-type::first-letter,
        .no-dropcap::first-letter { float:none; font-size:inherit; padding:0; }

        /* Headings */
        .bp h1,.bp h2,.bp h3,.bp h4 {
          font-family:${theme.fontDisplay};
          color:${theme.accent};
          page-break-after:avoid; page-break-inside:avoid;
        }
        .bp h2 { font-size:${sectionTitlePx}px; line-height:${Math.round(sectionTitlePx*1.25)}px; margin:${Math.round(leadingPx*1.5)}px 0 ${Math.round(leadingPx*0.5)}px; font-weight:700; }
        .bp h3 { font-size:${Math.round(subSectionPt*1.333)}px; margin:${leadingPx}px 0 ${Math.round(leadingPx*0.4)}px; font-weight:700; }
        .bp h4 { font-size:${bodyFontSizePx}px; margin:${Math.round(leadingPx*0.8)}px 0 ${Math.round(leadingPx*0.3)}px; font-weight:700; font-style:italic; }

        /* Verse / note */
        .bp .verse {
          font-style:italic; text-align:center;
          margin:${leadingPx * 1.2}px ${Math.round(contentWidth * 0.08)}px;
          padding:${Math.round(leadingPx * 0.6)}px 0;
          line-height:${Math.round(leadingPx * 1.3)}px;
          border-top:1px solid ${theme.accent};
          border-bottom:1px solid ${theme.accent};
          color:${theme.accent};
          font-size:${Math.round(bodyFontSizePx * 0.94)}px;
        }
        .bp .translator-note {
          border-left:2px solid ${theme.accent};
          padding-left:${Math.round(contentWidth * 0.06)}px;
          margin:${leadingPx}px 0;
          font-style:italic;
          font-size:${Math.round(bodyFontSizePx * 0.92)}px;
          line-height:${Math.round(leadingPx * 0.95)}px;
          opacity:.80;
          page-break-inside:avoid;
        }
        .bp blockquote {
          margin:${leadingPx}px ${Math.round(contentWidth * 0.06)}px;
          font-size:${Math.round(bodyFontSizePx * 0.94)}px;
          opacity:.85;
        }

        /* Chapter label / title */
        .chap-num {
          font-family:${theme.fontDisplay};
          font-size:${Math.round(chapterNumPt * 1.333)}px;
          color:${theme.accent};
          text-align:center;
          letter-spacing:.25em;
          text-transform:uppercase;
          font-weight:700;
          line-height:1;
          margin-bottom:${Math.round(leadingPx * 0.6)}px;
        }
        .chap-rule {
          width:${Math.round(contentWidth * 0.18)}px;
          height:1px;
          background:${theme.accent};
          margin:0 auto ${Math.round(leadingPx * 0.9)}px;
          opacity:.4;
        }
        .chap-title {
          font-family:${theme.fontDisplay};
          font-size:${chapterTitlePx}px;
          line-height:${Math.round(chapterTitlePx * 1.22)}px;
          color:${theme.accent};
          text-align:center;
          font-weight:700;
          font-style:italic;
          margin:0 0 ${Math.round(leadingPx * 2)}px;
          page-break-after:avoid;
        }

        /* Cover */
        .cover-title {
          font-family:${theme.fontDisplay};
          font-size:${coverTitlePx}px;
          line-height:${Math.round(coverTitlePx * 1.18)}px;
          color:${theme.accent};
          font-weight:700;
          margin:0;
        }
        .cover-author {
          font-family:${theme.fontBody};
          font-size:${coverAuthorPx}px;
          color:${theme.pageColor};
          opacity:.65;
          margin:0;
        }

        /* Print */
        @media print {
          @page { size:${cssWidth} ${cssHeight}; margin:${cssMargin}; }
          body { background:#fff !important; margin:0 !important; }
          .book-page { width:${cssWidth} !important; min-height:${cssHeight} !important; padding:0 !important; box-shadow:none !important; margin:0 !important; page-break-after:always; }
        }
      `}</style>

      {/* Page stack */}
      <div className="flex flex-col items-center gap-6 py-8 print:gap-0 print:py-0"
        style={{ minWidth: widthPx + 48 }}>

        {/* ── Cover ── */}
        {customCoverHtml ? (
          <div className="shadow-2xl overflow-hidden book-page"
            style={{ ...pageStyle, padding: 0 }}
            dangerouslySetInnerHTML={{ __html: customCoverHtml }} />
        ) : (
          <div className="book-page shadow-2xl no-dropcap bp"
            style={{ ...pageStyle, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', gap: 0 }}>

            {/* Top rule */}
            <div style={{ width: contentWidth * 0.45, height: 1.5, background: theme.accent, opacity: .35, marginBottom: Math.round(coverTitlePx * 1.4) }} />

            {/* Title */}
            {editingTitle ? (
              <input autoFocus value={titleDraft}
                onChange={e => setTitleDraft(e.target.value)}
                onBlur={commitTitle}
                onKeyDown={e => { if (e.key==='Enter') commitTitle(); if (e.key==='Escape') setEditingTitle(false); }}
                className="cover-title bg-transparent border-b-2 border-dashed outline-none text-center w-full"
                style={{ fontFamily: theme.fontDisplay, fontSize: coverTitlePx, color: theme.accent }} />
            ) : (
              <div className="group relative cursor-text" onClick={() => { setTitleDraft(book.title); setEditingTitle(true); }}>
                <h1 className="cover-title">{book.title}</h1>
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-white/30 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  click to edit
                </div>
              </div>
            )}

            {/* Mid rule */}
            <div style={{ width: contentWidth * 0.22, height: 1, background: theme.accent, opacity: .25, margin: `${Math.round(coverTitlePx * 0.7)}px auto` }} />

            {/* Author */}
            {editingAuthor ? (
              <input autoFocus value={authorDraft} placeholder="Author name…"
                onChange={e => setAuthorDraft(e.target.value)}
                onBlur={commitAuthor}
                onKeyDown={e => { if (e.key==='Enter') commitAuthor(); if (e.key==='Escape') setEditingAuthor(false); }}
                className="cover-author bg-transparent border-b border-dashed outline-none text-center"
                style={{ fontFamily: theme.fontBody, fontSize: coverAuthorPx, color: theme.pageColor, width: contentWidth * 0.65 }} />
            ) : (
              <div className="group relative cursor-text" onClick={() => { setAuthorDraft(book.author); setEditingAuthor(true); }}>
                <p className="cover-author">{book.author || <span style={{ opacity: .3, fontStyle:'italic', fontSize: Math.round(coverAuthorPx * 0.85) }}>+ Add author</span>}</p>
                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-white/30 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  click to edit
                </div>
              </div>
            )}

            {/* Bottom rule */}
            <div style={{ width: contentWidth * 0.45, height: 1.5, background: theme.accent, opacity: .35, marginTop: Math.round(coverTitlePx * 1.4) }} />
          </div>
        )}

        {/* ── Chapters ── */}
        {book.chapters.map((c, i) => (
          <div key={i} className="book-page shadow-2xl bp" style={pageStyle}>
            {/* Chapter label */}
            <div className="chap-num">Chapter {i + 1}</div>
            <div className="chap-rule" />
            {/* Chapter title — italic slanted per Krantz ChapTitleFont */}
            <div className="chap-title">{c.title}</div>
            {/* Body */}
            <div dangerouslySetInnerHTML={{ __html: c.html }} />
          </div>
        ))}

        <div style={{ height: 32 }} className="print:hidden" />
      </div>
    </div>
  );
}
