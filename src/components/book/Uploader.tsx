import { useCallback, useState } from "react";

export function Uploader({ onFile }: { onFile: (f: File) => void }) {
  const [drag, setDrag] = useState(false);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files?.[0];
    if (f && f.name.toLowerCase().endsWith(".docx")) onFile(f);
  }, [onFile]);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#0a0a12] px-6">
      {/* Ambient orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      {/* Subtle grid */}
      <div className="absolute inset-0 z-0" style={{
        backgroundImage: `linear-gradient(rgba(199,125,255,0.03) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(199,125,255,0.03) 1px, transparent 1px)`,
        backgroundSize: '48px 48px',
      }} />

      <div className="relative z-10 flex flex-col items-center w-full max-w-lg">

        {/* Quill icon */}
        <div className="quill-float mb-8 select-none" style={{ fontSize: 64 }}>🪶</div>

        {/* Title */}
        <div className="ink-drop text-center mb-2">
          <h1 className="text-5xl font-bold tracking-tight leading-none mb-1">
            <span className="rainbow-text">DocBook</span>
            <span className="text-white/80"> Designer</span>
          </h1>
        </div>
        <p className="ink-drop ink-drop-delay-1 text-white/40 text-sm mb-10 tracking-wide text-center">
          Transform any Word document into a beautifully typeset book
        </p>

        {/* Drop zone */}
        <div className="ink-drop ink-drop-delay-2 w-full rainbow-border">
          <label
            onDragOver={e => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={onDrop}
            className="flex flex-col items-center justify-center gap-4 rounded-xl cursor-pointer transition-all duration-300 p-14"
            style={{
              background: drag
                ? 'rgba(114,9,183,0.18)'
                : 'rgba(14,14,26,0.9)',
              boxShadow: drag ? '0 0 40px rgba(199,125,255,0.2) inset' : 'none',
            }}
          >
            <div className="text-4xl transition-transform duration-300" style={{ transform: drag ? 'scale(1.15)' : 'scale(1)' }}>
              📄
            </div>
            <div className="text-center">
              <div className="text-white font-semibold text-lg mb-1">
                {drag ? 'Release to open' : 'Drop your .docx file here'}
              </div>
              <div className="text-white/35 text-xs">or click to browse</div>
            </div>
            <input type="file" accept=".docx" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
          </label>
        </div>

        {/* Feature pills */}
        <div className="ink-drop ink-drop-delay-3 flex gap-3 mt-8 flex-wrap justify-center">
          {[
            { icon: '🎨', label: '6 Themes' },
            { icon: '📐', label: 'A4 · A5 · Trade' },
            { icon: '✨', label: 'AI Polish' },
            { icon: '🎨', label: 'AI Cover' },
            { icon: '⬇️', label: 'Export & Print' },
          ].map(f => (
            <div key={f.label} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-white/50 border border-white/6"
              style={{ background: 'rgba(255,255,255,0.03)' }}>
              <span>{f.icon}</span>
              <span>{f.label}</span>
            </div>
          ))}
        </div>

        <p className="mt-8 text-xs text-white/20 text-center">
          Runs entirely in your browser · Your file never leaves your device
        </p>
      </div>
    </div>
  );
}
