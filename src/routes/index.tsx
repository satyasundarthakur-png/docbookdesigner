import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { Uploader } from "@/components/book/Uploader";
import { Toolbar } from "@/components/book/Toolbar";
import { BookPreview } from "@/components/book/BookPreview";
import { processDocx, type Book } from "@/lib/book/docxProcessor";
import { THEMES } from "@/lib/book/themes";

export const Route = createFileRoute("/")({
  ssr: false,
  component: Index,
});

function Index() {
  const [book, setBook] = useState<Book | null>(null);
  const [themeId, setThemeId] = useState("classic");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const buffer = await file.arrayBuffer();
      const data = await processDocx(buffer);
      if (!data.title || data.title === "Untitled Book") {
        data.title = file.name.replace(/\.docx$/i, "");
      }
      setBook(data);
    } catch (e) {
      console.error(e);
      setError("Failed to process the file. Please make sure it is a valid .docx.");
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-neutral-950 text-white">
        <div className="animate-bounce text-6xl">📖</div>
        <div className="text-2xl font-semibold text-amber-400">Designing your book…</div>
        <div className="text-sm text-neutral-500">
          Parsing content, detecting chapters, applying theme
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-neutral-950 px-4 text-white">
        <div className="text-5xl">⚠️</div>
        <p className="text-center text-lg text-red-400">{error}</p>
        <button
          onClick={() => setError(null)}
          className="mt-4 rounded-lg bg-amber-500 px-6 py-2 font-semibold text-black hover:bg-amber-400"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!book) return <Uploader onFile={handleFile} />;

  const theme = THEMES[themeId];
  return (
    <div className="flex h-screen flex-col bg-neutral-950">
      <Toolbar
        book={book}
        theme={theme}
        activeThemeId={themeId}
        onThemeChange={setThemeId}
        onReset={() => setBook(null)}
      />
      <BookPreview book={book} theme={theme} />
    </div>
  );
}
