import { useState } from 'react';
import { Eye, EyeOff, Trash2 } from 'lucide-react';
import {
  getStoredGeminiKey, saveGeminiKey,
  getStoredGroqKey, saveGroqKey,
  clearAllKeys, getStoredModel, saveModel,
  AI_MODELS, getModelProvider, type AIModel,
} from '@/lib/gemini/config';

const safeGeminiKey = () => (typeof window !== 'undefined' ? getStoredGeminiKey() ?? '' : '');
const safeGroqKey   = () => (typeof window !== 'undefined' ? getStoredGroqKey()   ?? '' : '');
const safeModel     = () => (typeof window !== 'undefined' ? getStoredModel() : 'gemini-2.5-flash' as AIModel);

export function GeminiSettings() {
  const [isOpen, setIsOpen]               = useState(false);
  const [geminiKey, setGeminiKey]         = useState<string>(safeGeminiKey);
  const [groqKey, setGroqKey]             = useState<string>(safeGroqKey);
  const [selectedModel, setSelectedModel] = useState<AIModel>(safeModel);
  const [showGemini, setShowGemini]       = useState(false);
  const [showGroq, setShowGroq]           = useState(false);
  const [saved, setSaved]                 = useState(false);

  const geminiModels = AI_MODELS.filter(m => m.provider === 'gemini');
  const groqModels   = AI_MODELS.filter(m => m.provider === 'groq');
  const provider     = getModelProvider(selectedModel);

  const handleSave = () => {
    if (geminiKey.trim()) saveGeminiKey(geminiKey.trim());
    if (groqKey.trim())   saveGroqKey(groqKey.trim());
    saveModel(selectedModel);
    setSaved(true);
    setTimeout(() => { setSaved(false); setIsOpen(false); }, 900);
  };

  const handleClear = () => {
    if (!confirm('Clear all saved API keys?')) return;
    clearAllKeys(); setGeminiKey(''); setGroqKey(''); setSelectedModel('gemini-2.5-flash');
  };

  const handleModelChange = (m: AIModel) => {
    setSelectedModel(m);
    if (typeof window !== 'undefined') saveModel(m);
  };

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)}
        className="pill-btn"
        style={{ borderColor: 'rgba(199,125,255,0.2)', color: 'rgba(199,125,255,0.7)', background: 'rgba(114,9,183,0.08)' }}>
        ⚙️ AI
      </button>

      {isOpen && (
        <div className="panel-glass absolute right-0 top-full mt-2 w-72 rounded-2xl p-5 shadow-2xl z-50"
          style={{ boxShadow: '0 8px 40px rgba(114,9,183,0.25), 0 0 0 1px rgba(199,125,255,0.12)' }}>

          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="rainbow-text font-bold text-sm">AI Settings</div>
            <button onClick={() => setIsOpen(false)} className="text-white/30 hover:text-white/70 transition-colors text-lg leading-none">✕</button>
          </div>

          {/* Model groups */}
          <div className="mb-4">
            <div className="text-[10px] font-semibold text-white/25 uppercase tracking-wider mb-2">Gemini</div>
            <div className="space-y-1 mb-3">
              {geminiModels.map(m => (
                <label key={m.id} className={`flex items-center gap-2.5 rounded-xl px-3 py-2 cursor-pointer transition-all ${
                  selectedModel === m.id
                    ? 'bg-violet-500/15 border border-violet-500/30'
                    : 'border border-transparent hover:bg-white/4'
                }`}>
                  <input type="radio" name="ai-model" value={m.id} checked={selectedModel === m.id}
                    onChange={() => handleModelChange(m.id)} className="accent-violet-400" />
                  <div>
                    <div className="text-xs font-medium text-white/85">{m.label}</div>
                    <div className="text-[10px] text-white/35">{m.description}</div>
                  </div>
                </label>
              ))}
            </div>

            <div className="text-[10px] font-semibold text-white/25 uppercase tracking-wider mb-2">Groq</div>
            <div className="space-y-1">
              {groqModels.map(m => (
                <label key={m.id} className={`flex items-center gap-2.5 rounded-xl px-3 py-2 cursor-pointer transition-all ${
                  selectedModel === m.id
                    ? 'bg-orange-500/15 border border-orange-500/30'
                    : 'border border-transparent hover:bg-white/4'
                }`}>
                  <input type="radio" name="ai-model" value={m.id} checked={selectedModel === m.id}
                    onChange={() => handleModelChange(m.id)} className="accent-orange-400" />
                  <div>
                    <div className="text-xs font-medium text-white/85">{m.label}</div>
                    <div className="text-[10px] text-white/35">{m.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Key input */}
          {provider === 'gemini' && (
            <div className="mb-4">
              <div className="text-[10px] font-semibold text-white/25 uppercase tracking-wider mb-1.5">Gemini API Key</div>
              <div className="relative">
                <input type={showGemini ? 'text' : 'password'} value={geminiKey}
                  onChange={e => setGeminiKey(e.target.value)} placeholder="AIza…"
                  className="w-full rounded-xl border border-white/8 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/20 focus:border-violet-500/50 focus:outline-none focus:bg-white/8 transition-all" />
                <button onClick={() => setShowGemini(!showGemini)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                  {showGemini ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
              <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer"
                className="text-[10px] text-violet-400/70 hover:text-violet-400 mt-1 block transition-colors">
                aistudio.google.com →
              </a>
            </div>
          )}

          {provider === 'groq' && (
            <div className="mb-4">
              <div className="text-[10px] font-semibold text-white/25 uppercase tracking-wider mb-1.5">Groq API Key</div>
              <div className="relative">
                <input type={showGroq ? 'text' : 'password'} value={groqKey}
                  onChange={e => setGroqKey(e.target.value)} placeholder="gsk_…"
                  className="w-full rounded-xl border border-white/8 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/20 focus:border-orange-500/50 focus:outline-none focus:bg-white/8 transition-all" />
                <button onClick={() => setShowGroq(!showGroq)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                  {showGroq ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
              <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer"
                className="text-[10px] text-orange-400/70 hover:text-orange-400 mt-1 block transition-colors">
                console.groq.com →
              </a>
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={handleSave}
              className="flex-1 btn-rainbow rounded-xl py-2 text-xs font-semibold text-white transition-all">
              {saved ? '✓ Saved' : 'Save'}
            </button>
            <button onClick={handleClear}
              className="rounded-xl border border-white/8 px-3 py-2 text-white/30 hover:text-red-400 hover:border-red-500/30 transition-all">
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
