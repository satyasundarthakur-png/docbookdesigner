import { useCallback, useState } from "react";

export function Uploader({ onFile }: { onFile: (f: File) => void }) {
  const [drag, setDrag] = useState(false);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDrag(false);
      const f = e.dataTransfer.files?.[0];
      if (f && f.name.toLowerCase().endsWith(".docx")) onFile(f);
    },
    [onFile],
  );

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 px-6 text-white overflow-hidden relative">
      {/* Background ambient circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="relative z-10">
        <div className="mb-10 text-center">
          <div className="mb-4 text-5xl">📚</div>
          <h1 className="mb-3 font-serif text-5xl font-bold tracking-tight text-white">
            DocBook Designer
          </h1>
          <p className="text-base text-neutral-400">
            Transform any Word document into a beautifully typeset book
          </p>
        </div>

        {/* Upload Area */}
        <label
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
          className={`
            flex w-full max-w-xl cursor-pointer flex-col items-center justify-center gap-4
            rounded-2xl border-2 border-dashed p-16 transition-all duration-300
            ${drag
              ? "border-amber-400 bg-amber-500/10 scale-105"
              : "border-neutral-700 bg-neutral-900/50 backdrop-blur-sm hover:border-neutral-500 hover:bg-neutral-800/50"
            }
          `}
        >
          <div className="text-5xl">📄</div>
          <div className="text-xl font-semibold text-white">Drop your .docx file here</div>
          <div className="text-sm text-neutral-500">or click to browse</div>
          <input
            type="file"
            accept=".docx"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
            }}
          />
        </label>

        {/* Feature highlights */}
        <div className="mt-10 grid grid-cols-3 gap-4 max-w-xl text-center">
          <div className="rounded-xl bg-neutral-900/60 p-4">
            <div className="text-xl mb-1">🎨</div>
            <div className="text-xs font-semibold text-neutral-300">Multiple Themes</div>
          </div>
          <div className="rounded-xl bg-neutral-900/60 p-4">
            <div className="text-xl mb-1">📖</div>
            <div className="text-xs font-semibold text-neutral-300">Auto Chapters</div>
          </div>
          <div className="rounded-xl bg-neutral-900/60 p-4">
            <div className="text-xl mb-1">⬇️</div>
            <div className="text-xs font-semibold text-neutral-300">Export & Print</div>
          </div>
        </div>

        <p className="mt-8 text-xs text-neutral-600 text-center">
          Runs entirely in your browser · No data leaves your device
        </p>
      </div>
    </div>
  );
}
