import type { Book } from "@/lib/book/docxProcessor";
import type { Theme } from "@/lib/book/themes";

export function BookPreview({ book, theme }: { book: Book; theme: Theme }) {
  return (
    <div
      className="flex-1 overflow-auto relative"
      style={{ 
        background: "linear-gradient(135deg, #1a1a1a 0%, #2d1a2d 50%, #1a1a2d 100%)",
        backgroundAttachment: "fixed"
      }}
    >
      {/* Subtle animated gradient overlay */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        background: 'radial-gradient(circle at 20% 50%, rgba(255,0,0,0.03) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(0,0,255,0.03) 0%, transparent 50%)',
        animation: 'stadium-light 8s ease-in-out infinite',
        zIndex: 0
      }}></div>
      
      <div style={{ position: 'relative', zIndex: 1 }}>
      <style>{`
        .book-page { background:${theme.pageBg}; color:${theme.pageColor}; font-family:${theme.fontBody}; }
        .book-page h1, .book-page h2, .book-page h3 { 
          font-family:${theme.fontDisplay}; 
          color:${theme.accent}; 
          page-break-inside: avoid;
          page-break-after: avoid;
        }
        .book-page p { font-size:17px; line-height:1.75; text-align:justify; text-indent:1.5em; margin:0 0 4px; }
        .book-page p:first-of-type:not(.translator-note):not(.verse) { text-indent:0; }
        .book-page p:first-of-type:not(.translator-note):not(.verse)::first-letter { 
          font-family:${theme.fontDisplay}; 
          font-size:56px; 
          float:left; 
          line-height:.9; 
          padding:6px 8px 0 0; 
          color:${theme.accent}; 
        }
        .book-page .no-drop-cap::first-letter { float: none; font-size: inherit; }
        .book-page .verse { 
          font-style: italic; 
          text-align: center; 
          margin: 2em 1.5em; 
          padding: 1em 0;
          line-height: 1.9;
          border-top: 1px solid ${theme.accent}; 
          border-bottom: 1px solid ${theme.accent}; 
          color: ${theme.accent};
        }
        .book-page .translator-note { 
          border-left: 4px solid ${theme.accent}; 
          padding-left: 1.5em; 
          margin: 1.5em 0; 
          font-style: italic; 
          opacity: 0.85;
          background: rgba(0, 0, 0, 0.02);
          page-break-inside: avoid;
        }
        .cover-title { font-family:${theme.fontDisplay}; color:${theme.accent}; }
        .chapter-num { font-family:${theme.fontDisplay}; color:${theme.accent}; letter-spacing:.3em; text-transform:uppercase; }
        .chapter-title { font-family:${theme.fontDisplay}; color:${theme.accent}; }
      `}</style>

      <div className="mx-auto flex max-w-3xl flex-col items-stretch gap-10 px-4 py-10 print:gap-0 print:py-0">
        {/* Cover */}
        <div
          className="book-page shadow-2xl"
          style={{ padding: "160px 60px", textAlign: "center", minHeight: 720 }}
        >
          <h1 className="cover-title no-drop-cap" style={{ fontSize: 56, margin: 0, fontWeight: 700 }}>
            {book.title}
          </h1>
          {book.author && (
            <div style={{ marginTop: 24, fontSize: 20, opacity: 0.7 }}>{book.author}</div>
          )}
        </div>

        {/* Chapters */}
        {book.chapters.map((c, i) => (
          <div
            key={i}
            className="book-page shadow-2xl"
            style={{ padding: "80px 72px", minHeight: 720 }}
          >
            <div
              className="chapter-num"
              style={{ fontSize: 12, textAlign: "center", marginBottom: 12 }}
            >
              Chapter {i + 1}
            </div>
            <h1
              className="chapter-title"
              style={{ fontSize: 42, textAlign: "center", margin: "0 0 48px", fontWeight: 700 }}
            >
              {c.title}
            </h1>
            <div dangerouslySetInnerHTML={{ __html: c.html }} />
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}
