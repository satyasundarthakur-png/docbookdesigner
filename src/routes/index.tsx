import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { Uploader } from "@/components/book/Uploader";
import { Toolbar } from "@/components/book/Toolbar";
import { BookPreview } from "@/components/book/BookPreview";
import { processDocx, type Book } from "@/lib/book/docxProcessor";
import { THEMES } from "@/lib/book/themes";
import { PAGE_SIZES, DEFAULT_PAGE_SIZE, type PageSizeId } from "@/lib/book/pageSize";

export const Route = createFileRoute("/")({
  ssr: false,
  component: Index,
});

function Index() {
  const [book, setBook]                       = useState<Book | null>(null);
  const [themeId, setThemeId]                 = useState("classic");
  const [pageSizeId, setPageSizeId]           = useState<PageSizeId>(DEFAULT_PAGE_SIZE);
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState<string | null>(null);
  const [customCoverHtml, setCustomCoverHtml] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    setCustomCoverHtml(null);
    try {
      const buffer = await file.arrayBuffer();
      const data = await processDocx(buffer);
      if (!data.title || data.title === "Untitled Book") {
        data.title = file.name.replace(/\.docx$/i, "").replace(/[-_]/g, " ");
      }
      setBook(data);
    } catch (e) {
      console.error(e);
      setError("Failed to process the file. Please make sure it is a valid .docx.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleTextUpdate    = useCallback((b: Book)            => setBook(b),          []);
  const handleCoverUpdate   = useCallback((html: string)        => setCustomCoverHtml(html), []);
  const handleMetaChange    = useCallback((title: string, author: string) =>
    setBook(prev => prev ? { ...prev, title, author } : prev), []);

  if (loading) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-neutral-950 text-white">
      <div className="w-10 h-10 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
      <div className="text-neutral-300">Processing document…</div>
    </div>
  );

  if (error) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-neutral-950 px-4 text-white">
      <p className="text-center text-red-400">{error}</p>
      <button onClick={() => setError(null)}
        className="rounded-lg bg-neutral-800 px-5 py-2 text-sm hover:bg-neutral-700 transition-colors">
        Try Again
      </button>
    </div>
  );

  if (!book) return <Uploader onFile={handleFile} />;

  const theme    = THEMES[themeId];
  const pageSize = PAGE_SIZES[pageSizeId];

  return (
    <div className="flex h-screen flex-col bg-neutral-950">
      <Toolbar
        book={book} theme={theme} pageSize={pageSize}
        activeThemeId={themeId} activePageSizeId={pageSizeId}
        onThemeChange={setThemeId}
        onPageSizeChange={setPageSizeId}
        onReset={() => { setBook(null); setCustomCoverHtml(null); }}
        onTextUpdate={handleTextUpdate}
        onCoverUpdate={handleCoverUpdate}
      />
      <BookPreview
        book={book} theme={theme} pageSize={pageSize}
        customCoverHtml={customCoverHtml}
        onBookMetaChange={handleMetaChange}
      />
    </div>
  );
}
