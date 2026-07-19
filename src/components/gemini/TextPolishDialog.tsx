import { useState, useRef } from 'react';
import { Wand2, AlertCircle, CheckCircle, Square, Pause, Play, Download, FileText } from 'lucide-react';
import type { PolishMode } from '@/lib/gemini/text-processor';
import { analyzeText } from '@/lib/gemini/text-processor';
import { processTextWithGemini } from '@/lib/gemini/service';
import { isConfigured, getStoredModel, AI_MODELS } from '@/lib/gemini/config';
import { exportPolishedText, exportHtml } from '@/lib/book/export';
import type { Book } from '@/lib/book/docxProcessor';
import type { Theme } from '@/lib/book/themes';

export interface TextPolishDialogProps {
  text: string;
  book: Book;
  theme: Theme;
  onPolish: (polishedText: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

type Status = 'idle' | 'running' | 'paused' | 'done' | 'stopped' | 'error';

const MODES: { id: PolishMode; label: string; desc: string }[] = [
  { id: 'grammar',       label: 'Grammar & Clarity', desc: 'Fix errors, improve sentence flow' },
  { id: 'structure',     label: 'Structure',          desc: 'Standardize headings and sections' },
  { id: 'style',         label: 'Writing Style',      desc: 'Improve prose rhythm and word choice' },
  { id: 'comprehensive', label: 'Comprehensive',       desc: 'All improvements combined' },
];

function buildPolishedBook(polishedText: string, book: Book): Book {
  const sections = polishedText.split(/^## /m).filter(Boolean);
  const updatedChapters = book.chapters.map((chapter, i) => {
    const section = sections[i];
    if (!section) return chapter;
    const newlineIdx = section.indexOf('\n');
    const body = newlineIdx >= 0 ? section.slice(newlineIdx + 1).trim() : '';
    const newHtml = body
      .split(/\n\n+/)
      .filter(Boolean)
      .map(para => `<p>${para.replace(/\n/g, '<br/>')}</p>`)
      .join('\n');
    return { ...chapter, html: newHtml || chapter.html };
  });
  return { ...book, chapters: updatedChapters };
}

export function TextPolishDialog({ text, book, theme, onPolish, isOpen, onClose }: TextPolishDialogProps) {
  // ALL hooks must be declared before any conditional return
  const [polishMode, setPolishMode] = useState<PolishMode>('comprehensive');
  const [status, setStatus] = useState<Status>('idle');
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [partialResult, setPartialResult] = useState<string | null>(null);
  const [polishedBook, setPolishedBook] = useState<Book | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const pausedRef = useRef(false);
  const pauseResolveRef = useRef<(() => void) | null>(null);

  // Safe early return AFTER all hooks
  if (!isOpen) return null;

  const analysis = analyzeText(text);
  const activeModel = AI_MODELS.find(m => m.id === (typeof window !== "undefined" ? getStoredModel() : "gemini-2.5-flash"));

  const resolvePause = () => {
    if (pauseResolveRef.current) {
      pauseResolveRef.current();
      pauseResolveRef.current = null;
    }
  };

  const handleStart = async () => {
    if (!isConfigured()) {
      setError('API key not configured. Set it in ⚙️ AI Settings.');
      setStatus('error');
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    pausedRef.current = false;
    setStatus('running');
    setError(null);
    setProgress(0);
    setPartialResult(null);
    setPolishedBook(null);

    const result = await processTextWithGemini(text, {
      mode: polishMode,
      signal: controller.signal,
      onProgress: async (prog, msg) => {
        // If paused, wait until resumed
        if (pausedRef.current) {
          await new Promise<void>(resolve => { pauseResolveRef.current = resolve; });
        }
        setProgress(prog);
        setProgressMessage(msg);
      },
    });

    if (result.aborted) {
      setStatus('stopped');
      setProgressMessage(`Stopped at ${result.chunksProcessed ?? 0} chunks`);
      if (result.polishedText) setPartialResult(result.polishedText);
    } else if (result.success && result.polishedText) {
      const pb = buildPolishedBook(result.polishedText, book);
      setPolishedBook(pb);
      onPolish(result.polishedText);
      setStatus('done');
      setProgress(100);
      setProgressMessage('Complete');
    } else {
      setStatus('error');
      setError(result.error ?? 'Failed to polish text');
    }
  };

  const handlePause = () => {
    pausedRef.current = true;
    setStatus('paused');
  };

  const handleResume = () => {
    pausedRef.current = false;
    setStatus('running');
    resolvePause();
  };

  const handleStop = () => {
    abortRef.current?.abort();
    pausedRef.current = false;
    resolvePause();
  };

  const handleReset = () => {
    setStatus('idle');
    setProgress(0);
    setProgressMessage('');
    setError(null);
    setPartialResult(null);
    setPolishedBook(null);
  };

  const isRunning = status === 'running';
  const isPaused  = status === 'paused';
  const isDone    = status === 'done';
  const isStopped = status === 'stopped';
  const isError   = status === 'error';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-neutral-700 bg-neutral-900 p-6 shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="flex items-center gap-2 text-lg font-bold text-white">
            <Wand2 size={20} className="text-purple-400" />
            Polish with AI
          </h2>
          <button onClick={onClose} disabled={isRunning}
            className="text-neutral-500 hover:text-white disabled:opacity-30 transition-colors text-xl leading-none">
            ✕
          </button>
        </div>

        {/* Stats */}
        <div className="mb-4 rounded-lg bg-neutral-800/60 px-4 py-3 text-sm space-y-1.5">
          <div className="flex justify-between text-neutral-300">
            <span>Words</span><span className="text-purple-400">{analysis.wordCount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-neutral-300">
            <span>Chunks</span><span className="text-purple-400">{analysis.chunkCount}</span>
          </div>
          <div className="flex justify-between text-neutral-300">
            <span>Est. time</span><span className="text-purple-400">{analysis.estimatedTime}</span>
          </div>
          <div className="flex justify-between text-neutral-300 border-t border-neutral-700 pt-1.5">
            <span>Model</span>
            <span className="text-neutral-400 text-xs">{activeModel?.label ?? 'Unknown'}</span>
          </div>
        </div>

        {/* Mode selection — idle only */}
        {status === 'idle' && (
          <div className="mb-5 space-y-1.5">
            <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Mode</div>
            {MODES.map(mode => (
              <label key={mode.id} className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${
                polishMode === mode.id ? 'border-purple-500 bg-purple-500/10' : 'border-neutral-700 hover:border-neutral-600'
              }`}>
                <input type="radio" name="polish-mode" value={mode.id}
                  checked={polishMode === mode.id}
                  onChange={() => setPolishMode(mode.id)}
                  className="mt-0.5 accent-purple-500" />
                <div>
                  <div className="text-sm font-medium text-white">{mode.label}</div>
                  <div className="text-xs text-neutral-500">{mode.desc}</div>
                </div>
              </label>
            ))}
          </div>
        )}

        {/* Progress bar */}
        {(isRunning || isPaused || isStopped || isDone) && (
          <div className="mb-4 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-neutral-300 truncate pr-2">{progressMessage || 'Starting…'}</span>
              <span className={isPaused ? 'text-yellow-400' : isStopped ? 'text-orange-400' : isDone ? 'text-green-400' : 'text-purple-400'}>
                {progress}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-neutral-800 overflow-hidden">
              <div className={`h-full transition-all duration-300 ${
                isPaused  ? 'bg-yellow-500' :
                isStopped ? 'bg-orange-500' :
                isDone    ? 'bg-green-500' :
                            'bg-gradient-to-r from-purple-500 to-pink-500'
              }`} style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* Error message */}
        {isError && error && (
          <div className="mb-4 flex gap-2 rounded-lg bg-red-500/15 p-3 text-sm text-red-300">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        {/* Done — save options */}
        {isDone && polishedBook && (
          <div className="mb-4 space-y-3">
            <div className="flex gap-2 rounded-lg bg-green-500/10 border border-green-500/30 p-3 text-sm text-green-300">
              <CheckCircle size={16} className="shrink-0 mt-0.5" />
              <div>Applied to preview. Save a copy:</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => exportPolishedText(polishedBook)}
                className="flex items-center justify-center gap-2 rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2.5 text-sm text-white hover:bg-neutral-700 transition-colors">
                <FileText size={15} /> Save .txt
              </button>
              <button onClick={() => exportHtml(polishedBook, theme)}
                className="flex items-center justify-center gap-2 rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2.5 text-sm text-white hover:bg-neutral-700 transition-colors">
                <Download size={15} /> Save .html
              </button>
            </div>
          </div>
        )}

        {/* Stopped — partial */}
        {isStopped && partialResult && (
          <div className="mb-4 rounded-lg bg-orange-500/10 border border-orange-500/30 p-3 text-sm text-orange-300">
            Partial result available. Apply or start over.
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          {status === 'idle' && (
            <button onClick={handleStart}
              className="flex-1 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500 transition-colors">
              ✨ Start Polish
            </button>
          )}

          {isRunning && <>
            <button onClick={handlePause}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-yellow-600/80 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-500 transition-colors">
              <Pause size={14} /> Pause
            </button>
            <button onClick={handleStop}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-red-700/70 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors">
              <Square size={13} /> Stop
            </button>
          </>}

          {isPaused && <>
            <button onClick={handleResume}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500 transition-colors">
              <Play size={14} /> Resume
            </button>
            <button onClick={handleStop}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-red-700/70 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors">
              <Square size={13} /> Stop
            </button>
          </>}

          {isStopped && <>
            {partialResult && (
              <button onClick={() => { onPolish(partialResult); onClose(); }}
                className="flex-1 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-500 transition-colors">
                Apply Partial
              </button>
            )}
            <button onClick={handleReset}
              className="flex-1 rounded-lg bg-neutral-700 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-600 transition-colors">
              Start Over
            </button>
          </>}

          {isError && (
            <button onClick={handleReset}
              className="flex-1 rounded-lg bg-neutral-700 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-600 transition-colors">
              Try Again
            </button>
          )}

          {isDone && (
            <button onClick={onClose}
              className="flex-1 rounded-lg bg-neutral-700 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-600 transition-colors">
              Close
            </button>
          )}

          {!isRunning && !isDone && (
            <button onClick={onClose}
              className="rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-400 hover:bg-neutral-800 transition-colors">
              {isPaused ? 'Abandon' : 'Cancel'}
            </button>
          )}
        </div>

        <p className="mt-4 text-xs text-neutral-600 text-center">
          API key stored locally · never sent to our servers
        </p>
      </div>
    </div>
  );
}
