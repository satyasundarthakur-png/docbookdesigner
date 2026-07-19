import { useState } from 'react';
import { Eye, EyeOff, Trash2 } from 'lucide-react';
import {
  getStoredGeminiKey, saveGeminiKey,
  getStoredGroqKey, saveGroqKey,
  clearAllKeys,
  getStoredModel, saveModel,
  AI_MODELS, getModelProvider,
  type AIModel,
} from '@/lib/gemini/config';

// Safe lazy readers — return '' / default on SSR
const safeGeminiKey = () => (typeof window !== 'undefined' ? getStoredGeminiKey() ?? '' : '');
const safeGroqKey   = () => (typeof window !== 'undefined' ? getStoredGroqKey()   ?? '' : '');
const safeModel     = () => (typeof window !== 'undefined' ? getStoredModel() : 'gemini-2.5-flash' as AIModel);

export function GeminiSettings() {
  const [isOpen, setIsOpen]           = useState(false);
  const [geminiKey, setGeminiKey]     = useState<string>(safeGeminiKey);
  const [groqKey, setGroqKey]         = useState<string>(safeGroqKey);
  const [selectedModel, setSelectedModel] = useState<AIModel>(safeModel);
  const [showGemini, setShowGemini]   = useState(false);
  const [showGroq, setShowGroq]       = useState(false);
  const [saved, setSaved]             = useState(false);

  const geminiModels = AI_MODELS.filter(m => m.provider === 'gemini');
  const groqModels   = AI_MODELS.filter(m => m.provider === 'groq');

  const handleSave = () => {
    if (geminiKey.trim()) saveGeminiKey(geminiKey.trim());
    if (groqKey.trim())   saveGroqKey(groqKey.trim());
    saveModel(selectedModel);
    setSaved(true);
    setTimeout(() => { setSaved(false); setIsOpen(false); }, 1000);
  };

  const handleClear = () => {
    if (!confirm('Clear all saved API keys?')) return;
    clearAllKeys();
    setGeminiKey('');
    setGroqKey('');
    setSelectedModel('gemini-2.5-flash');
  };

  const handleModelChange = (model: AIModel) => {
    setSelectedModel(model);
    if (typeof window !== 'undefined') saveModel(model);
  };

  const provider = getModelProvider(selectedModel);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-800 transition-colors"
      >
        ⚙️ AI Settings
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-neutral-700 bg-neutral-900 p-5 shadow-2xl z-50">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-white text-sm">AI Settings</h3>
            <button onClick={() => setIsOpen(false)} className="text-neutral-500 hover:text-white transition-colors">✕</button>
          </div>

          {/* Model selector */}
          <div className="mb-5">
            <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Model</div>

            <div className="mb-1.5 text-xs text-neutral-500">Gemini</div>
            <div className="space-y-1.5 mb-3">
              {geminiModels.map(m => (
                <label key={m.id} className={`flex items-start gap-2.5 rounded-lg border px-3 py-2 cursor-pointer transition-colors ${
                  selectedModel === m.id ? 'border-purple-500 bg-purple-500/10' : 'border-neutral-700 hover:border-neutral-600'
                }`}>
                  <input type="radio" name="ai-model" value={m.id} checked={selectedModel === m.id}
                    onChange={() => handleModelChange(m.id)} className="mt-0.5 accent-purple-500" />
                  <div>
                    <div className="text-sm text-white">{m.label}</div>
                    <div className="text-xs text-neutral-500">{m.description}</div>
                  </div>
                </label>
              ))}
            </div>

            <div className="mb-1.5 text-xs text-neutral-500">Groq</div>
            <div className="space-y-1.5">
              {groqModels.map(m => (
                <label key={m.id} className={`flex items-start gap-2.5 rounded-lg border px-3 py-2 cursor-pointer transition-colors ${
                  selectedModel === m.id ? 'border-orange-500 bg-orange-500/10' : 'border-neutral-700 hover:border-neutral-600'
                }`}>
                  <input type="radio" name="ai-model" value={m.id} checked={selectedModel === m.id}
                    onChange={() => handleModelChange(m.id)} className="mt-0.5 accent-orange-500" />
                  <div>
                    <div className="text-sm text-white">{m.label}</div>
                    <div className="text-xs text-neutral-500">{m.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Key input — only relevant provider */}
          {provider === 'gemini' && (
            <div className="mb-4">
              <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">Gemini API Key</div>
              <div className="relative">
                <input type={showGemini ? 'text' : 'password'} value={geminiKey}
                  onChange={e => setGeminiKey(e.target.value)} placeholder="AIza…"
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white placeholder-neutral-600 focus:border-purple-500 focus:outline-none" />
                <button onClick={() => setShowGemini(!showGemini)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300">
                  {showGemini ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <p className="mt-1 text-xs text-neutral-600">
                <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300">aistudio.google.com</a>
              </p>
            </div>
          )}

          {provider === 'groq' && (
            <div className="mb-4">
              <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">Groq API Key</div>
              <div className="relative">
                <input type={showGroq ? 'text' : 'password'} value={groqKey}
                  onChange={e => setGroqKey(e.target.value)} placeholder="gsk_…"
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white placeholder-neutral-600 focus:border-orange-500 focus:outline-none" />
                <button onClick={() => setShowGroq(!showGroq)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300">
                  {showGroq ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <p className="mt-1 text-xs text-neutral-600">
                <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer"
                  className="text-orange-400 hover:text-orange-300">console.groq.com</a>
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={handleSave}
              className="flex-1 rounded-lg bg-neutral-700 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-600 transition-colors">
              {saved ? '✓ Saved' : 'Save'}
            </button>
            <button onClick={handleClear}
              className="rounded-lg border border-neutral-700 px-3 py-2 text-neutral-400 hover:border-red-500/60 hover:text-red-400 transition-colors" title="Clear all keys">
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
