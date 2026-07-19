import { useState } from 'react';
import { Sparkles, AlertCircle } from 'lucide-react';
import { generateCoverPage } from '@/lib/gemini/service';
import { isConfigured, getStoredModel } from '@/lib/gemini/config';

export interface CoverPageDialogProps {
  title: string;
  author?: string;
  isOpen: boolean;
  onClose: () => void;
  onApply: (html: string) => void;
}

const GENRES = ['Fiction', 'Non-Fiction', 'Mystery', 'Romance', 'Science Fiction', 'Fantasy', 'Biography', 'Self-Help', 'Academic', 'Poetry', 'History', 'Business'];
const STYLES = ['Elegant & Minimal', 'Bold & Modern', 'Classic Literary', 'Dark & Dramatic', 'Warm & Earthy', 'Clean Academic'];

export function CoverPageDialog({ title, author, isOpen, onClose, onApply }: CoverPageDialogProps) {
  const [genre, setGenre] = useState('');
  const [style, setStyle] = useState('Elegant & Minimal');
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!isConfigured()) {
      setError('Gemini API key not configured. Please set it in ⚙️ AI Settings.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setPreviewHtml(null);

    const result = await generateCoverPage({
      title,
      author,
      genre: genre || undefined,
      theme: style,
    });

    setIsGenerating(false);

    if (result.success && result.html) {
      setPreviewHtml(result.html);
    } else {
      setError(result.error || 'Failed to generate cover page');
    }
  };

  const handleApply = () => {
    if (previewHtml) {
      onApply(previewHtml);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-xl border border-neutral-700 bg-neutral-900/98 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <h2 className="flex items-center gap-2 text-lg font-bold text-white">
            <Sparkles size={20} className="text-purple-400" />
            AI Cover Page Generator
          </h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white transition-colors text-xl leading-none">✕</button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left panel — controls */}
          <div className="w-64 shrink-0 p-5 border-r border-neutral-800 space-y-4 overflow-y-auto">
            {/* Book info (read-only) */}
            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">Book Title</label>
              <div className="text-sm text-white truncate font-medium">{title}</div>
            </div>

            {author && (
              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">Author</label>
                <div className="text-sm text-white">{author}</div>
              </div>
            )}

            {/* Genre */}
            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Genre (optional)</label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="">Any / Auto</option>
                {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            {/* Style */}
            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Visual Style</label>
              <div className="space-y-1.5">
                {STYLES.map((s) => (
                  <label key={s} className={`flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer transition-colors text-sm ${
                    style === s ? 'border-purple-500 bg-purple-500/10 text-white' : 'border-neutral-700 text-neutral-300 hover:border-neutral-600'
                  }`}>
                    <input type="radio" name="cover-style" value={s} checked={style === s} onChange={() => setStyle(s)} className="accent-purple-500" />
                    {s}
                  </label>
                ))}
              </div>
            </div>

            <div className="text-xs text-neutral-600 pt-1">
              Using: <span className="text-neutral-400">{getStoredModel().replace('gemini-', '').replace('-preview-06-17', ' Lite')}</span>
            </div>
          </div>

          {/* Right panel — preview */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-auto bg-neutral-950 p-4">
              {isGenerating && (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-neutral-400">
                  <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
                  <span className="text-sm">Generating cover…</span>
                </div>
              )}

              {!isGenerating && !previewHtml && !error && (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-neutral-600">
                  <Sparkles size={32} />
                  <span className="text-sm">Configure options then click Generate</span>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 rounded-lg bg-red-500/15 p-4 text-sm text-red-300 m-2">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              {previewHtml && !isGenerating && (
                <div
                  className="rounded-lg overflow-hidden shadow-lg"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              )}
            </div>

            {/* Footer actions */}
            <div className="px-5 py-4 border-t border-neutral-800 flex gap-3">
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex-1 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isGenerating ? 'Generating…' : previewHtml ? '↺ Regenerate' : '✨ Generate'}
              </button>

              {previewHtml && (
                <button
                  onClick={handleApply}
                  className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-500 transition-colors"
                >
                  ✓ Apply to Book
                </button>
              )}

              <button
                onClick={onClose}
                className="rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-400 hover:bg-neutral-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
