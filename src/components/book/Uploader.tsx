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
      {/* Animated background gradient circles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="mb-10 text-center">
          {/* Football World Cup Animation */}
          <div className="mb-6 flex items-center justify-center">
            <div style={{
              animation: 'football-kick 2s ease-in-out infinite',
              fontSize: '4rem',
              display: 'inline-block'
            }}>
              ⚽
            </div>
          </div>

          <h1 className="mb-4 font-serif text-6xl font-bold tracking-tight">
            <span className="rainbow-text">DocBook Designer</span>
          </h1>
          
          <p className="text-lg text-neutral-300 mb-2">
            Transform your manuscripts into beautifully typeset books
          </p>
          <p className="text-sm text-neutral-500">
            With Ayurvedic text support & professional typography
          </p>
        </div>

        {/* Upload Area with Rainbow Glow */}
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
          className={`
            flex w-full max-w-2xl cursor-pointer flex-col items-center justify-center gap-4 
            rounded-3xl border-2 border-dashed p-20 transition-all duration-300
            rainbow-glow glow-interactive
            ${
              drag
                ? "border-cyan-400 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 scale-105"
                : "border-neutral-700 bg-neutral-900/50 backdrop-blur-sm hover:border-amber-400/80 hover:bg-neutral-800/50"
            }
          `}
          style={{
            boxShadow: drag ? '0 0 30px rgba(34, 197, 94, 0.5), 0 0 60px rgba(59, 130, 246, 0.3)' : 'none'
          }}
        >
          <div className="text-5xl animate-bounce">📄</div>
          <div className="text-2xl font-bold text-white">Drop your .docx here</div>
          <div className="text-neutral-400">or click to browse</div>
          
          {/* Decorative elements */}
          <div className="mt-4 flex gap-3 justify-center text-3xl opacity-60">
            <span style={{animation: 'float-bounce 3s ease-in-out infinite'}}>📖</span>
            <span style={{animation: 'float-bounce 3s ease-in-out infinite', animationDelay: '0.2s'}}>✨</span>
            <span style={{animation: 'float-bounce 3s ease-in-out infinite', animationDelay: '0.4s'}}>🎨</span>
          </div>

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

        {/* Feature highlights with glow */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
          <div className="glow-container p-4 text-center hover:scale-105 transition-transform duration-300">
            <div className="text-2xl mb-2">🏛️</div>
            <div className="text-sm font-semibold text-amber-300">Ayurvedic Theme</div>
            <p className="text-xs text-neutral-400 mt-1">Warm cream background with serif fonts</p>
          </div>
          
          <div className="glow-container p-4 text-center hover:scale-105 transition-transform duration-300">
            <div className="text-2xl mb-2">📖</div>
            <div className="text-sm font-semibold text-cyan-300">Verse Support</div>
            <p className="text-xs text-neutral-400 mt-1">Sanskrit verses with elegant formatting</p>
          </div>
          
          <div className="glow-container p-4 text-center hover:scale-105 transition-transform duration-300">
            <div className="text-2xl mb-2">✨</div>
            <div className="text-sm font-semibold text-green-300">Pro Typography</div>
            <p className="text-xs text-neutral-400 mt-1">Professional page breaks & styling</p>
          </div>
        </div>

        <p className="mt-12 text-xs text-neutral-600 text-center">
          ⚡ Everything runs in your browser • Your document never leaves your device • No data collection
        </p>
      </div>
    </div>
  );
}