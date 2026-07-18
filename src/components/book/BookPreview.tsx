import type { Book } from "@/lib/book/docxProcessor";
import type { Theme } from "@/lib/book/themes";

export function BookPreview({ book, theme }: { book: Book; theme: Theme }) {
  return (
    <div
      className="flex-1 overflow-auto"
      style={{ background: "#1a1a1a" }}
    >
      <style>{`
        .book-page { background:${theme.pageBg}; color:${theme.pageColor}; font-family:${theme.fontBody}; }
        .book-page h2, .book-page h3 { font-family:${theme.fontDisplay}; color:${theme.accent}; }
        .book-page p { font-size:17px; line-height:1.75; text-align:justify; text-indent:1.5em; margin:0 0 4px; }
        .book-page p:first-of-type { text-indent:0; }
        .book-page p:first-of-type::first-letter { font-family:${theme.fontDisplay}; font-size:56px; float:left; line-height:.9; padding:6px 8px 0 0; color:${theme.accent}; }
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
          <h1 className="cover-title" style={{ fontSize: 56, margin: 0, fontWeight: 700 }}>
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
  );
}