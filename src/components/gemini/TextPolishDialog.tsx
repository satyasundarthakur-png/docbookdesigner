import { useState } from 'react';
import { Wand2, AlertCircle, CheckCircle } from 'lucide-react';
import type { PolishMode } from '@/lib/gemini/text-processor';
import { analyzeText } from '@/lib/gemini/text-processor';
import { processTextWithGemini } from '@/lib/gemini/service';
import { isConfigured } from '@/lib/gemini/config';

export interface TextPolishDialogProps {
  text: string;
  onPolish: (polishedText: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function TextPolishDialog({ text, onPolish, isOpen, onClose }: TextPolishDialogProps) {
  const [polishMode, setPolishMode] = useState<PolishMode>('comprehensive');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const analysis = analyzeText(text);

  const handlePolish = async () => {
    if (!isConfigured()) {
      setError('Gemini API key not configured. Please configure it in AI Settings.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProgress(0);

    try {
      const result = await processTextWithGemini(text, {
        mode: polishMode,
        onProgress: (prog, msg) => {
          setProgress(prog);
          setProgressMessage(msg);
        },
      });

      if (result.success && result.polishedText) {
        onPolish(result.polishedText);
        setProgress(100);
        setProgressMessage('✓ Polish complete!');
        setTimeout(onClose, 1000);
      } else {
        setError(result.error || 'Failed to polish text');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg border border-neutral-700 bg-neutral-900/95 p-6 shadow-xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-bold text-white">
            <Wand2 size={22} className="text-purple-400" />
            Polish with AI
          </h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white transition-colors">✕</button>
        </div>

        {/* Stats */}
        <div className="mb-4 rounded-lg bg-neutral-800/50 p-3 space-y-1 text-sm text-neutral-300">
          <div className="flex justify-between">
            <span>Words</span>
            <span className="text-purple-400">{analysis.wordCount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Chunks</span>
            <span className="text-purple-400">{analysis.chunkCount}</span>
          </div>
          <div className="flex justify-between">
            <span>Est. time</span>
            <span className="text-purple-400">{analysis.estimatedTime}</span>
          </div>
        </div>

        {/* Mode Selection */}
        <div className="mb-6 space-y-2">
          <label className="block text-sm font-semibold text-neutral-300">Polish Mode</label>
          {([
            { id: 'grammar' as PolishMode, label: 'Grammar & Clarity', desc: 'Fix errors and improve sentence flow' },
            { id: 'structure' as PolishMode, label: 'Structure', desc: 'Standardize headings and sections' },
            { id: 'style' as PolishMode, label: 'Writing Style', desc: 'Improve prose rhythm and word choice' },
            { id: 'comprehensive' as PolishMode, label: 'Comprehensive', desc: 'All improvements combined' },
          ]).map((mode) => (
            <label
              key={mode.id}
              className="flex items-start gap-3 rounded-lg border border-neutral-700 p-3 cursor-pointer hover:bg-neutral-800/50 transition-colors"
            >
              <input
                type="radio"
                name="polish-mode"
                value={mode.id}
                checked={polishMode === mode.id}
                onChange={(e) => setPolishMode(e.target.value as PolishMode)}
                className="mt-1"
              />
              <div>
                <div className="font-medium text-white">{mode.label}</div>
                <div className="text-xs text-neutral-400">{mode.desc}</div>
              </div>
            </label>
          ))}
        </div>

        {/* Progress */}
        {isProcessing && (
          <div className="mb-4 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-neutral-300">{progressMessage}</span>
              <span className="text-purple-400">{progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-neutral-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 flex gap-2 rounded-lg bg-red-500/20 p-3 text-sm text-red-300">
            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        {/* Success */}
        {progress === 100 && !isProcessing && !error && (
          <div className="mb-4 flex gap-2 rounded-lg bg-green-500/20 p-3 text-sm text-green-300">
            <CheckCircle size={18} className="flex-shrink-0 mt-0.5" />
            <div>Text polished successfully!</div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handlePolish}
            disabled={isProcessing}
            className="flex-1 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 font-medium text-white hover:from-purple-400 hover:to-pink-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
          >
            {isProcessing ? 'Processing…' : '✨ Polish Text'}
          </button>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="rounded-lg border border-neutral-700 px-4 py-2 text-neutral-300 hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
          >
            Cancel
          </button>
        </div>

        <p className="mt-4 text-xs text-neutral-600 text-center">
          Uses Google Gemini 2.5 Flash · Your API key stays in your browser
        </p>
      </div>
    </div>
  );
}
