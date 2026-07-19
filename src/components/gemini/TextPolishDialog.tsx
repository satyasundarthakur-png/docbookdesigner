import { useState, useRef } from 'react';
import { Square, Pause, Play, Download, FileText } from 'lucide-react';
import type { PolishMode } from '@/lib/gemini/text-processor';
import { analyzeText } from '@/lib/gemini/text-processor';
import { processTextWithGemini } from '@/lib/gemini/service';
import { isConfigured, getStoredModel, AI_MODELS } from '@/lib/gemini/config';
import { exportPolishedText, exportHtml } from '@/lib/book/export';
import type { Book } from '@/lib/book/docxProcessor';
import type { Theme } from '@/lib/book/themes';

export interface TextPolishDialogProps {
  text: string; book: Book; theme: Theme;
  onPolish: (polishedText: string) => void;
  isOpen: boolean; onClose: () => void;
}

type Status = 'idle' | 'running' | 'paused' | 'done' | 'stopped' | 'error';

const MODES: { id: PolishMode; label: string; desc: string; icon: string }[] = [
  { id: 'grammar',       icon: '✏️', label: 'Grammar & Clarity',  desc: 'Fix errors, improve sentence flow' },
  { id: 'structure',     icon: '🏗️', label: 'Structure',           desc: 'Standardize headings and sections' },
  { id: 'style',         icon: '🖊️', label: 'Writing Style',       desc: 'Improve prose rhythm and word choice' },
  { id: 'comprehensive', icon: '⚡', label: 'Comprehensive',        desc: 'All improvements combined' },
];

function buildPolishedBook(polishedText: string, book: Book): Book {
  const sections = polishedText.split(/^## /m).filter(Boolean);
  const chapters = book.chapters.map((ch, i) => {
    const sec = sections[i]; if (!sec) return ch;
    const nl = sec.indexOf('\n');
    const body = nl >= 0 ? sec.slice(nl + 1).trim() : '';
    const html = body.split(/\n\n+/).filter(Boolean)
      .map(p => `<p>${p.replace(/\n/g, '<br/>')}</p>`).join('\n');
    return { ...ch, html: html || ch.html };
  });
  return { ...book, chapters };
}

export function TextPolishDialog({ text, book, theme, onPolish, isOpen, onClose }: TextPolishDialogProps) {
  const [polishMode, setPolishMode]   = useState<PolishMode>('comprehensive');
  const [status, setStatus]           = useState<Status>('idle');
  const [progress, setProgress]       = useState(0);
  const [progressMessage, setMsg]     = useState('');
  const [error, setError]             = useState<string | null>(null);
  const [partialResult, setPartial]   = useState<string | null>(null);
  const [polishedBook, setPolishedBook] = useState<Book | null>(null);

  const abortRef       = useRef<AbortController | null>(null);
  const pausedRef      = useRef(false);
  const pauseResolveRef = useRef<(() => void) | null>(null);

  if (!isOpen) return null;

  const analysis    = analyzeText(text);
  const activeModel = AI_MODELS.find(m => m.id === (typeof window !== 'undefined' ? getStoredModel() : 'gemini-2.5-flash'));

  const resolvePause = () => { if (pauseResolveRef.current) { pauseResolveRef.current(); pauseResolveRef.current = null; } };

  const handleStart = async () => {
    if (!isConfigured()) { setError('Set your API key in ⚙️ AI Settings first.'); setStatus('error'); return; }
    const ctrl = new AbortController();
    abortRef.current = ctrl; pausedRef.current = false;
    setStatus('running'); setError(null); setProgress(0); setPartial(null); setPolishedBook(null);

    const result = await processTextWithGemini(text, {
      mode: polishMode, signal: ctrl.signal,
      onProgress: async (prog, msg) => {
        if (pausedRef.current) await new Promise<void>(r => { pauseResolveRef.current = r; });
        setProgress(prog); setMsg(msg);
      },
    });

    if (result.aborted) {
      setStatus('stopped'); setMsg(`Stopped — ${result.chunksProcessed ?? 0} chunks processed`);
      if (result.polishedText) setPartial(result.polishedText);
    } else if (result.success && result.polishedText) {
      const pb = buildPolishedBook(result.polishedText, book);
      setPolishedBook(pb); onPolish(result.polishedText);
      setStatus('done'); setProgress(100); setMsg('Complete');
    } else {
      setStatus('error'); setError(result.error ?? 'Failed');
    }
  };

  const handlePause  = () => { pausedRef.current = true;  setStatus('paused'); };
  const handleResume = () => { pausedRef.current = false; setStatus('running'); resolvePause(); };
  const handleStop   = () => { abortRef.current?.abort(); pausedRef.current = false; resolvePause(); };
  const handleReset  = () => { setStatus('idle'); setProgress(0); setMsg(''); setError(null); setPartial(null); setPolishedBook(null); };

  const isRunning = status === 'running';
  const isPaused  = status === 'paused';
  const isDone    = status === 'done';
  const isStopped = status === 'stopped';
  const isError   = status === 'error';

  const barClass = isPaused ? 'bg-yellow-500' : isStopped ? 'bg-orange-500' : isDone ? 'bg-green-500' : 'progress-rainbow';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <div className="panel-glass w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
        style={{ boxShadow: '0 24px 80px rgba(114,9,183,0.3), 0 0 0 1px rgba(199,125,255,0.1)' }}>

        {/* Rainbow top bar */}
        <div className="h-0.5 progress-rainbow" />

        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">✨</span>
              <span className="rainbow-text font-bold text-base">Polish with AI</span>
            </div>
            <button onClick={onClose} disabled={isRunning}
              className="text-white/25 hover:text-white/60 disabled:opacity-20 transition-colors text-lg leading-none">✕</button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2 mb-5">
            {[
              { label: 'Words', value: analysis.wordCount.toLocaleString() },
              { label: 'Chunks', value: analysis.chunkCount },
              { label: 'Est.', value: analysis.estimatedTime },
              { label: 'Model', value: activeModel?.label?.split(' ').slice(-1)[0] ?? '—' },
            ].map(s => (
              <div key={s.label} className="rounded-xl bg-white/4 border border-white/6 px-2 py-2 text-center">
                <div className="text-xs font-semibold text-white/85">{s.value}</div>
                <div className="text-[10px] text-white/30 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Mode selector — idle only */}
          {status === 'idle' && (
            <div className="mb-5 space-y-1.5">
              <div className="text-[10px] font-semibold text-white/25 uppercase tracking-wider mb-2">Polish Mode</div>
              {MODES.map(m => (
                <label key={m.id} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 cursor-pointer transition-all ${
                  polishMode === m.id
                    ? 'bg-violet-500/15 border border-violet-500/25'
                    : 'border border-transparent hover:bg-white/4 hover:border-white/6'
                }`}>
                  <input type="radio" name="polish-mode" value={m.id}
                    checked={polishMode === m.id} onChange={() => setPolishMode(m.id)}
                    className="accent-violet-400" />
                  <span className="text-base">{m.icon}</span>
                  <div>
                    <div className="text-xs font-medium text-white/85">{m.label}</div>
                    <div className="text-[10px] text-white/35">{m.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          )}

          {/* Progress */}
          {(isRunning || isPaused || isStopped || isDone) && (
            <div className="mb-5">
              <div className="flex justify-between text-[11px] mb-2">
                <span className="text-white/50 truncate pr-2">{progressMessage || 'Starting…'}</span>
                <span className={isPaused ? 'text-yellow-400' : isStopped ? 'text-orange-400' : isDone ? 'text-green-400' : 'text-violet-400'}>
                  {progress}%
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-300 ${barClass}`}
                  style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {/* Error */}
          {isError && error && (
            <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-xs text-red-300">
              {error}
            </div>
          )}

          {/* Done — save options */}
          {isDone && polishedBook && (
            <div className="mb-4 space-y-2">
              <div className="rounded-xl bg-green-500/8 border border-green-500/20 px-4 py-3 text-xs text-green-300">
                ✓ Applied to preview — save a copy:
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => exportPolishedText(polishedBook)}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-white/75 hover:bg-white/10 transition-all">
                  <FileText size={13} /> Save .txt
                </button>
                <button onClick={() => exportHtml(polishedBook, theme)}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-white/75 hover:bg-white/10 transition-all">
                  <Download size={13} /> Save .html
                </button>
              </div>
            </div>
          )}

          {/* Stopped */}
          {isStopped && partialResult && (
            <div className="mb-4 rounded-xl bg-orange-500/8 border border-orange-500/20 px-4 py-3 text-xs text-orange-300">
              Partial result available. Apply it or start over.
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {status === 'idle' && (
              <button onClick={handleStart}
                className="flex-1 btn-rainbow rounded-xl py-2.5 text-sm font-semibold text-white">
                ✨ Start Polish
              </button>
            )}
            {isRunning && <>
              <button onClick={handlePause}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-yellow-500/15 border border-yellow-500/25 py-2.5 text-xs font-medium text-yellow-300 hover:bg-yellow-500/25 transition-all">
                <Pause size={13} /> Pause
              </button>
              <button onClick={handleStop}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-red-500/12 border border-red-500/20 py-2.5 text-xs font-medium text-red-300 hover:bg-red-500/22 transition-all">
                <Square size={12} /> Stop
              </button>
            </>}
            {isPaused && <>
              <button onClick={handleResume}
                className="flex-1 btn-rainbow flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-medium text-white">
                <Play size={13} /> Resume
              </button>
              <button onClick={handleStop}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-red-500/12 border border-red-500/20 py-2.5 text-xs font-medium text-red-300 hover:bg-red-500/22 transition-all">
                <Square size={12} /> Stop
              </button>
            </>}
            {isStopped && <>
              {partialResult && (
                <button onClick={() => { onPolish(partialResult); onClose(); }}
                  className="flex-1 rounded-xl bg-orange-500/15 border border-orange-500/25 py-2.5 text-xs font-medium text-orange-300 hover:bg-orange-500/25 transition-all">
                  Apply Partial
                </button>
              )}
              <button onClick={handleReset}
                className="flex-1 rounded-xl bg-white/6 border border-white/8 py-2.5 text-xs font-medium text-white/60 hover:bg-white/10 transition-all">
                Start Over
              </button>
            </>}
            {isError && (
              <button onClick={handleReset}
                className="flex-1 rounded-xl bg-white/6 border border-white/8 py-2.5 text-xs font-medium text-white/60 hover:bg-white/10 transition-all">
                Try Again
              </button>
            )}
            {isDone && (
              <button onClick={onClose}
                className="flex-1 rounded-xl bg-white/6 border border-white/8 py-2.5 text-xs font-medium text-white/60 hover:bg-white/10 transition-all">
                Close
              </button>
            )}
            {!isRunning && !isDone && (
              <button onClick={onClose}
                className="rounded-xl border border-white/8 px-4 py-2.5 text-xs text-white/30 hover:bg-white/4 transition-all">
                {isPaused ? 'Abandon' : 'Cancel'}
              </button>
            )}
          </div>

          <p className="mt-4 text-[10px] text-white/18 text-center">
            Key stored locally · never sent to our servers
          </p>
        </div>
      </div>
    </div>
  );
}
