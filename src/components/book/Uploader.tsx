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
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 px-6 text-white">
      <div className="mb-10 text-center">
        <div className="mb-4 text-6xl">📖</div>
        <h1 className="mb-2 font-serif text-4xl font-bold tracking-tight text-amber-300">
          DocBook Designer
        </h1>
        <p className="text-neutral-400">
          Drop a Word document. Get a beautifully typeset book instantly.
        </p>
      </div>

      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        className={`flex w-full max-w-xl cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-16 transition ${
          drag
            ? "border-amber-400 bg-amber-400/10"
            : "border-neutral-700 bg-neutral-900 hover:border-amber-500/60 hover:bg-neutral-900/70"
        }`}
      >
        <div className="text-4xl">⬆️</div>
        <div className="text-lg font-semibold">Drop your .docx here</div>
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

      <p className="mt-8 text-xs text-neutral-600">
        Everything runs in your browser. Your document never leaves your device.
      </p>
    </div>
  );
}