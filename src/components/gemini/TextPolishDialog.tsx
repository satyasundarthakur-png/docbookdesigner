import { useState, useRef, useCallback } from 'react';
import { Wand2, AlertCircle, CheckCircle, Square, Pause, Play } from 'lucide-react';
import type { PolishMode } from '@/lib/gemini/text-processor';
import { analyzeText } from '@/lib/gemini/text-processor';
import { processTextWithGemini } from '@/lib/gemini/service';
import { isConfigured, getStoredModel, AI_MODELS } from '@/lib/gemini/config';

export interface TextPolishDialogProps {
  text: string;
  onPolish: (polishedText: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

type Status = 'idle' | 'running' | 'paused' | 'done' | 'stopped' | 'error';

export function TextPolishDialog({ text, onPolish, isOpen, onClose }: TextPolishDialogProps) {
  const [polishMode, setPolishMode] = useState<PolishMode>('comprehensive');
  const [status, setStatus] = useState<Status>('idle');
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [partialResult, setPartialResult] = useState<string | null>(null);

  // AbortController ref for stop; pause flag ref checked between chunks
  const abortRef = useRef<AbortController | null>(null);
  const pausedRef = useRef(false);
  const pauseResolveRef = useRef<(() => void) | null>(null);

  if (!isOpen) return null;

  const analysis = analyzeText(text);
  const activeModel = AI_MODELS.find(m => m.id === getStoredModel());

  const waitIfPaused = () =>
    new Promise<void>(resolve => {
      if (!pausedRef.current) { resolve(); return; }
      pauseResolveRef.current = resolve;
    });

  const handleStart = useCallback(async () => {
    if (!isConfigured()) {
      setError('API key not configured. Set it in ⚙️ AI Settings.');
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    pausedRef.current = false;
    setStatus('running');
    setError(null);
    setProgress(0);
    setPartialResult(null);

    const result = await processTextWithGemini(text, {
      mode: polishMode,
      signal: controller.signal,
      onProgress: async (prog, msg) => {
        // Wait here if paused — progress callback is awaited between chunks
        await waitIfPaused();
        setProgress(prog);
        setProgressMessage(msg);
      },
    });

    if (result.aborted) {
      setStatus('stopped');
      setProgressMessage(`Stopped after ${result.chunksProcessed} chunk${(result.chunksProcessed ?? 0) !== 1 ? 's' : ''}`);
      if (result.polishedText) setPartialResult(result.polishedText);
    } else if (result.success && result.polishedText) {
      setStatus('done');
      setProgress(100);
      setProgressMessage('✓ Polish complete');
      onPolish(result.polishedText);
      setTimeout(onClose, 1200);
    } else {
      setStatus('error');
      setError(result.error ?? 'Failed to polish text');
    }
  }, [text, polishMode, onPolish, onClose]);

  const handlePause = () => {
    pausedRef.current = true;
    setStatus('paused');
    setProgressMessage(prev => prev + ' (paused)');
  };

  const handleResume = () => {
    pausedRef.current = false;
    setStatus('running');
    if (pauseResolveRef.current) {
      pauseResolveRef.current();
      pauseResolveRef.current = null;
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
    pausedRef.current = false;
    if (pauseResolveRef.current) { pauseResolveRef.current(); pauseResolveRef.current = null; }
  };

  const handleApplyPartial = () => {
    if (partialResult) { onPolish(partialResult); onClose(); }
  };

  const handleReset = () => {
    setStatus('idle');
    setProgress(0);
    setProgressMessage('');
    setError(null);
    setPartialResult(null);
  };

  const isRunning = status === 'running';
  const isPaused = status === 'paused';
  const isActive = isRunning || isPaused;
  const isDone = status === 'done';
  const isStopped = status === 'stopped';
  const isError = status === 'error';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-neutral-700 bg-neutral-900 p-6 shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="flex items-center gap-2 text-lg font-bold text-white">
            <Wand2 size={20} className="text-purple-400" />
            Polish with AI
          </h2>
          <button
            onClick={onClose}
            disabled={isRunning}
            className="text-neutral-500 hover:text-white disabled:opacity-30 transition-colors"
          >✕</button>
        </div>

        {/* Stats + active model */}
        <div className="mb-4 rounded-lg bg-neutral-800/60 px-4 py-3 text-sm space-y-1">
          <div className="flex justify-between text-neutral-300">
            <span>Words</span><span className="text-purple-400">{analysis.wordCount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-neutral-300">
            <span>Chunks</span><span className="text-purple-400">{analysis.chunkCount}</span>
          </div>
          <div className="flex justify-between text-neutral-300">
            <span>Est. time</span><span className="text-purple-400">{analysis.estimatedTime}</span>
          </div>
          <div className="flex justify-between text-neutral-300 border-t border-neutral-700 pt-1 mt-1">
            <span>Model</span><span className="text-neutral-400 text-xs">{activeModel?.label ?? 'Unknown'}</span>
          </div>
        </div>

        {/* Mode — only shown when idle */}
        {status === 'idle' && (
          <div className="mb-5 space-y-1.5">
            <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Mode</label>
            {([
              { id: 'grammar' as PolishMode, label: 'Grammar & Clarity', desc: 'Fix errors, improve sentence flow' },
              { id: 'structure' as PolishMode, label: 'Structure', desc: 'Standardize headings and sections' },
              { id: 'style' as PolishMode, label: 'Writing Style', desc: 'Improve prose rhythm and word choice' },
              { id: 'comprehensive' as PolishMode, label: 'Comprehensive', desc: 'All improvements combined' },
            ]).map(mode => (
              <label key={mode.id} className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${
                polishMode === mode.id ? 'border-purple-500 bg-purple-500/10' : 'border-neutral-700 hover:border-neutral-600'
              }`}>
                <input type="radio" name="polish-mode" value={mode.id}
                  checked={polishMode === mode.id}
                  onChange={e => setPolishMode(e.target.value as PolishMode)}
                  className="mt-0.5 accent-purple-500" />
                <div>
                  <div className="text-sm font-medium text-white">{mode.label}</div>
                  <div className="text-xs text-neutral-500">{mode.desc}</div>
                </div>
              </label>
            ))}
          </div>
        )}

        {/* Progress bar — shown while active or stopped/done */}
        {(isActive || isStopped || isDone) && (
          <div className="mb-4 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-neutral-300 truncate pr-2">{progressMessage}</span>
              <span className={isPaused ? 'text-yellow-400' : 'text-purple-400'}>{progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-neutral-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  isPaused ? 'bg-yellow-500' :
                  isStopped ? 'bg-orange-500' :
                  isDone ? 'bg-green-500' :
                  'bg-gradient-to-r from-purple-500 to-pink-500'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error */}
        {isError && error && (
          <div className="mb-4 flex gap-2 rounded-lg bg-red-500/15 p-3 text-sm text-red-300">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        {/* Success */}
        {isDone && (
          <div className="mb-4 flex gap-2 rounded-lg bg-green-500/15 p-3 text-sm text-green-300">
            <CheckCircle size={16} className="shrink-0 mt-0.5" />
            Polished successfully — applying…
          </div>
        )}

        {/* Partial result notice */}
        {isStopped && partialResult && (
          <div className="mb-4 rounded-lg bg-orange-500/10 border border-orange-500/30 p-3 text-sm text-orange-300">
            Partial result available ({progress}% processed). You can apply it or start over.
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          {/* Idle → Start */}
          {status === 'idle' && (
            <button onClick={handleStart}
              className="flex-1 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500 transition-colors">
              ✨ Start Polish
            </button>
          )}

          {/* Running → Pause + Stop */}
          {isRunning && (
            <>
              <button onClick={handlePause}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-yellow-600/80 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-500 transition-colors">
                <Pause size={15} /> Pause
              </button>
              <button onClick={handleStop}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-red-700/70 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors">
                <Square size={13} /> Stop
              </button>
            </>
          )}

          {/* Paused → Resume + Stop */}
          {isPaused && (
            <>
              <button onClick={handleResume}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500 transition-colors">
                <Play size={15} /> Resume
              </button>
              <button onClick={handleStop}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-red-700/70 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors">
                <Square size={13} /> Stop
              </button>
            </>
          )}

          {/* Stopped → Apply partial / Try again */}
          {isStopped && (
            <>
              {partialResult && (
                <button onClick={handleApplyPartial}
                  className="flex-1 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-500 transition-colors">
                  Apply Partial
                </button>
              )}
              <button onClick={handleReset}
                className="flex-1 rounded-lg bg-neutral-700 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-600 transition-colors">
                Start Over
              </button>
            </>
          )}

          {/* Error → Try again */}
          {isError && (
            <button onClick={handleReset}
              className="flex-1 rounded-lg bg-neutral-700 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-600 transition-colors">
              Try Again
            </button>
          )}

          {/* Close always visible when not running */}
          {!isRunning && !isDone && (
            <button onClick={onClose}
              className="rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-400 hover:bg-neutral-800 transition-colors">
              {isPaused ? 'Abandon' : 'Close'}
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
