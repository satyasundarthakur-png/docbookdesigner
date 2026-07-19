import { useState, useEffect, useRef } from "react";
import type { Book } from "@/lib/book/docxProcessor";
import type { Theme } from "@/lib/book/themes";
import type { PageSize } from "@/lib/book/pageSize";

// ── Page component: fixed size, content clips into overflow pages ─────────────
function Page({
  style, className = '', children,
}: { style: React.CSSProperties; className?: string; children: React.ReactNode }) {
  return (
    <div
      className={`shadow-2xl ${className}`}
      style={{
        ...style,
        overflow: 'hidden',
        flexShrink: 0,
        position: 'relative',
      }}
    >
      {children}
    </div>
  );
}

// ── Single chapter split into multiple fixed pages ───────────────────────────
function ChapterPages({
  chapter, index, pageStyle, contentHeightPx, chapterHeaderHeightPx, fontCss,
}: {
  chapter: { title: string; html: string };
  index: number;
  pageStyle: React.CSSProperties;
  contentHeightPx: number;
  chapterHeaderHeightPx: number;
  fontCss: string;
}) {
  const [pages, setPages] = useState<string[][]>([[chapter.html]]);
  const probeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const probe = probeRef.current;
    if (!probe) return;
    const children = Array.from(probe.children) as HTMLElement[];
    if (children.length === 0) { setPages([[chapter.html]]); return; }

    const result: string[][] = [];
    let current: string[] = [];
    let usedHeight = chapterHeaderHeightPx;
    const maxFirst = contentHeightPx - chapterHeaderHeightPx;
    const maxRest  = contentHeightPx;

    for (const el of children) {
      const h = el.getBoundingClientRect().height || el.offsetHeight || 24;
      const cap = result.length === 0 ? maxFirst : maxRest;
      if (usedHeight + h > cap && current.length > 0) {
        result.push(current);
        current = [];
        usedHeight = 0;
      }
      current.push(el.outerHTML);
      usedHeight += h;
    }
    if (current.length > 0) result.push(current);
    if (result.length === 0) result.push([chapter.html]);
    setPages(result);
  }, [chapter.html, contentHeightPx, chapterHeaderHeightPx, pageStyle.width, pageStyle.fontFamily]);

  return (
    <>
      {/* Off-screen measurement probe */}
      <div
        ref={probeRef}
        style={{
          position: 'fixed',
          left: -9999,
          top: 0,
          width: pageStyle.width,
          visibility: 'hidden',
          pointerEvents: 'none',
          fontFamily: pageStyle.fontFamily,
          fontSize: (pageStyle as any).fontSize,
          lineHeight: (pageStyle as any).lineHeight,
          padding: `0 ${pageStyle.paddingRight}px`,
          boxSizing: 'border-box',
        }}
        dangerouslySetInnerHTML={{ __html: chapter.html }}
      />

      {pages.map((pageHtml, pi) => (
        <Page key={`ch${index}-p${pi}`} style={pageStyle} className="bp">
          {/* Header only on first page of chapter */}
          {pi === 0 && (
            <div className="chap-header">
              <div className="chap-num">Chapter {index + 1}</div>
              <div className="chap-rule" />
              <div className="chap-title">{chapter.title}</div>
            </div>
          )}
          {/* Continuation label on subsequent pages */}
          {pi > 0 && (
            <div className="cont-label">{chapter.title}</div>
          )}
          <div
            className={pi === 0 ? 'body' : 'body body-cont'}
            dangerouslySetInnerHTML={{ __html: pageHtml.join('') }}
          />
        </Page>
      ))}
    </>
  );
}

// ── Main BookPreview ─────────────────────────────────────────────────────────
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

  // Reset drafts when book changes
  useEffect(() => { setTitleDraft(book.title); }, [book.title]);
  useEffect(() => { setAuthorDraft(book.author); }, [book.author]);

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

  const contentWidth  = widthPx  - marginInnerPx - marginOuterPx;
  const contentHeight = heightPx - marginTopPx   - marginBottomPx;

  // Chapter header height: num + rule + title + gap (approximate, fixed)
  const chapterHeaderPx = Math.round(
    chapterNumPt * 1.333            // chapter number
    + leadingPx * 0.6               // gap after num
    + 1                             // rule
    + leadingPx * 0.9               // gap after rule
    + chapterTitlePx * 1.22         // title line height
    + leadingPx * 2                 // gap after title
  );

  const pageStyle: React.CSSProperties = {
    width:         widthPx,
    height:        heightPx,        // ← FIXED, not minHeight
    paddingTop:    marginTopPx,
    paddingBottom: marginBottomPx,
    paddingLeft:   marginInnerPx,
    paddingRight:  marginOuterPx,
    boxSizing:     'border-box',
    background:    theme.pageBg,
    color:         theme.pageColor,
    fontFamily:    theme.fontBody,
  };

  return (
    <div className="flex-1 overflow-auto" style={{ background: '#1a1a2e' }}>
      <style>{`
        .bp { font-size:${bodyFontSizePx}px; line-height:${leadingPx}px; }

        /* Body text */
        .body p {
          font-size:${bodyFontSizePx}px;
          line-height:${leadingPx}px;
          text-align:justify;
          text-indent:1.5em;
          margin:0 0 ${Math.round(leadingPx * 0.12)}px;
          orphans:3; widows:3;
        }
        .body p:first-of-type { text-indent:0; }
        .body p:first-of-type::first-letter {
          font-family:${theme.fontDisplay};
          font-size:${Math.round(bodyFontSizePx * 3.5)}px;
          float:left; line-height:0.82;
          padding:${Math.round(bodyFontSizePx * 0.28)}px ${Math.round(bodyFontSizePx * 0.55)}px 0 0;
          color:${theme.accent};
        }
        /* No drop cap on continuation pages */
        .body-cont p:first-of-type { text-indent:1.5em; }
        .body-cont p:first-of-type::first-letter { float:none; font-size:inherit; padding:0; color:inherit; }

        /* Headings */
        .body h2,.body-cont h2 {
          font-family:${theme.fontDisplay}; color:${theme.accent};
          font-size:${sectionTitlePx}px; line-height:${Math.round(sectionTitlePx*1.25)}px;
          margin:${Math.round(leadingPx*1.5)}px 0 ${Math.round(leadingPx*0.5)}px;
          font-weight:700; page-break-after:avoid;
        }
        .body h3,.body-cont h3 {
          font-family:${theme.fontDisplay}; color:${theme.accent};
          font-size:${Math.round(subSectionPt*1.333)}px;
          margin:${leadingPx}px 0 ${Math.round(leadingPx*0.4)}px;
          font-weight:700; page-break-after:avoid;
        }
        .body h4,.body-cont h4 {
          font-family:${theme.fontDisplay}; color:${theme.accent};
          font-size:${bodyFontSizePx}px;
          margin:${Math.round(leadingPx*0.8)}px 0 ${Math.round(leadingPx*0.3)}px;
          font-weight:700; font-style:italic; page-break-after:avoid;
        }

        /* Special blocks */
        .body .verse,.body-cont .verse {
          font-style:italic; text-align:center;
          margin:${Math.round(leadingPx*1.1)}px ${Math.round(contentWidth*0.07)}px;
          padding:${Math.round(leadingPx*0.55)}px 0;
          line-height:${Math.round(leadingPx*1.3)}px;
          border-top:1px solid ${theme.accent}; border-bottom:1px solid ${theme.accent};
          color:${theme.accent};
          font-size:${Math.round(bodyFontSizePx*0.94)}px;
        }
        .body .translator-note,.body-cont .translator-note {
          border-left:2px solid ${theme.accent};
          padding-left:${Math.round(contentWidth*0.06)}px;
          margin:${Math.round(leadingPx*0.9)}px 0;
          font-style:italic;
          font-size:${Math.round(bodyFontSizePx*0.92)}px;
          line-height:${Math.round(leadingPx*0.95)}px;
          opacity:.80;
        }
        .body blockquote,.body-cont blockquote {
          margin:${Math.round(leadingPx*0.9)}px ${Math.round(contentWidth*0.06)}px;
          font-size:${Math.round(bodyFontSizePx*0.94)}px;
          opacity:.85;
        }


        /* Caution box */
        .body .caution-box, .body-cont .caution-box {
          display:flex;
          gap:${Math.round(bodyFontSizePx * 0.6)}px;
          background:rgba(180,60,0,0.06);
          border-left:3px solid ${theme.accent};
          border-radius:0 4px 4px 0;
          padding:${Math.round(leadingPx * 0.55)}px ${Math.round(leadingPx * 0.7)}px;
          margin:${Math.round(leadingPx * 0.9)}px 0;
          font-size:${Math.round(bodyFontSizePx * 0.9)}px;
          line-height:${Math.round(leadingPx * 0.95)}px;
          page-break-inside:avoid;
        }
        .body .caution-icon, .body-cont .caution-icon {
          font-size:${Math.round(bodyFontSizePx * 1.1)}px;
          flex-shrink:0;
          margin-top:1px;
        }
        .body .caution-body, .body-cont .caution-body { flex:1; }

        /* Chapter header (first page only) */
        .chap-header { margin-bottom:0; }
        .chap-num {
          font-family:${theme.fontDisplay};
          font-size:${Math.round(chapterNumPt*1.333)}px;
          color:${theme.accent};
          text-align:center; letter-spacing:.25em; text-transform:uppercase;
          font-weight:700; line-height:1;
          margin-bottom:${Math.round(leadingPx*0.6)}px;
        }
        .chap-rule {
          width:${Math.round(contentWidth*0.18)}px; height:1px;
          background:${theme.accent}; margin:0 auto ${Math.round(leadingPx*0.9)}px; opacity:.4;
        }
        .chap-title {
          font-family:${theme.fontDisplay};
          font-size:${chapterTitlePx}px;
          line-height:${Math.round(chapterTitlePx*1.22)}px;
          color:${theme.accent};
          text-align:center; font-weight:700; font-style:italic;
          margin:0 0 ${Math.round(leadingPx*2)}px;
        }

        /* Continuation page label */
        .cont-label {
          font-family:${theme.fontDisplay};
          font-size:${Math.round(bodyFontSizePx*0.82)}px;
          color:${theme.accent};
          opacity:.45;
          text-align:right;
          font-style:italic;
          margin-bottom:${Math.round(leadingPx*1.2)}px;
          border-bottom:1px solid ${theme.accent};
          padding-bottom:${Math.round(leadingPx*0.4)}px;
          opacity:.3;
        }

        /* Cover */
        .cover-title {
          font-family:${theme.fontDisplay};
          font-size:${coverTitlePx}px;
          line-height:${Math.round(coverTitlePx*1.18)}px;
          color:${theme.accent}; font-weight:700; margin:0;
        }
        .cover-author {
          font-family:${theme.fontBody};
          font-size:${coverAuthorPx}px;
          color:${theme.pageColor}; opacity:.65; margin:0;
        }

        /* Print */
        @media print {
          @page { size:${cssWidth} ${cssHeight}; margin:${cssMargin}; }
          body { background:#fff !important; margin:0 !important; }
          .shadow-2xl { box-shadow:none !important; }
          .book-page { page-break-after:always; }
        }
      `}</style>

      <div className="flex flex-col items-center gap-5 py-8 print:gap-0 print:py-0"
        style={{ minWidth: widthPx + 48 }}>

        {/* ── Cover page ── */}
        {customCoverHtml ? (
          <Page style={{ ...pageStyle, padding: 0 }}>
            <div style={{ width:'100%', height:'100%' }} dangerouslySetInnerHTML={{ __html: customCoverHtml }} />
          </Page>
        ) : (
          <Page style={pageStyle} className="bp book-page">
            <div style={{ height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center' }}
              className="no-dropcap">
              <div style={{ width: contentWidth * 0.45, height: 1.5, background: theme.accent, opacity: .35, marginBottom: Math.round(coverTitlePx * 1.4) }} />

              {editingTitle ? (
                <input autoFocus value={titleDraft}
                  onChange={e => setTitleDraft(e.target.value)}
                  onBlur={commitTitle}
                  onKeyDown={e => { if (e.key==='Enter') commitTitle(); if (e.key==='Escape') setEditingTitle(false); }}
                  className="cover-title bg-transparent border-b-2 border-dashed outline-none text-center w-full"
                  style={{ fontFamily:theme.fontDisplay, fontSize:coverTitlePx, color:theme.accent }} />
              ) : (
                <div className="group relative cursor-text" onClick={() => { setTitleDraft(book.title); setEditingTitle(true); }}>
                  <h1 className="cover-title">{book.title}</h1>
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-white/30 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">click to edit</div>
                </div>
              )}

              <div style={{ width: contentWidth * 0.22, height: 1, background: theme.accent, opacity: .25, margin: `${Math.round(coverTitlePx * 0.7)}px auto` }} />

              {editingAuthor ? (
                <input autoFocus value={authorDraft} placeholder="Author name…"
                  onChange={e => setAuthorDraft(e.target.value)}
                  onBlur={commitAuthor}
                  onKeyDown={e => { if (e.key==='Enter') commitAuthor(); if (e.key==='Escape') setEditingAuthor(false); }}
                  className="cover-author bg-transparent border-b border-dashed outline-none text-center"
                  style={{ fontFamily:theme.fontBody, fontSize:coverAuthorPx, color:theme.pageColor, width: contentWidth * 0.65 }} />
              ) : (
                <div className="group relative cursor-text" onClick={() => { setAuthorDraft(book.author); setEditingAuthor(true); }}>
                  <p className="cover-author">{book.author || <span style={{ opacity:.3, fontStyle:'italic', fontSize: Math.round(coverAuthorPx*0.85) }}>+ Add author</span>}</p>
                  <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-white/30 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">click to edit</div>
                </div>
              )}

              <div style={{ width: contentWidth * 0.45, height: 1.5, background: theme.accent, opacity: .35, marginTop: Math.round(coverTitlePx * 1.4) }} />
            </div>
          </Page>
        )}

        {/* ── Chapters — each split into fixed pages ── */}
        {book.chapters.map((c, i) => (
          <ChapterPages
            key={i}
            chapter={c}
            index={i}
            pageStyle={{ ...pageStyle }}
            contentHeightPx={contentHeight}
            chapterHeaderHeightPx={chapterHeaderPx}
            fontCss=""
          />
        ))}

        <div style={{ height: 32 }} className="print:hidden" />
      </div>
    </div>
  );
}
