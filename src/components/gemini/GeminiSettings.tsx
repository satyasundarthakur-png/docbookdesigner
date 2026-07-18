import { useState } from 'react';
import { Lock, Eye, EyeOff, Trash2, Check, AlertCircle } from 'lucide-react';
import {
  getGeminiConfig,
  saveApiKey,
  saveModel,
  clearApiKey,
  isValidApiKey,
  GEMINI_MODELS,
  type GeminiModel,
} from '@/lib/gemini/config';
import { validateApiKey } from '@/lib/gemini/service';

export function GeminiSettings() {
  const config = getGeminiConfig();
  const [isOpen, setIsOpen] = useState(false);
  const [apiKey, setApiKey] = useState(config.apiKey);
  const [selectedModel, setSelectedModel] = useState<GeminiModel>(config.model);
  const [showKey, setShowKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  const handleSave = async () => {
    if (!apiKey.trim()) { setStatusMessage('Please enter an API key'); return; }
    if (!isValidApiKey(apiKey)) { setStatusMessage('Invalid key format — must start with AIza'); return; }

    setIsSaving(true);
    setValidationStatus('validating');
    setStatusMessage('Validating…');

    try {
      const isValid = await validateApiKey(apiKey);
      if (isValid) {
        saveApiKey(apiKey);
        saveModel(selectedModel);
        setValidationStatus('valid');
        setStatusMessage('✓ Saved & validated');
        setTimeout(() => setIsOpen(false), 1200);
      } else {
        setValidationStatus('invalid');
        setStatusMessage('✗ API key invalid or expired');
      }
    } catch (error) {
      setValidationStatus('invalid');
      setStatusMessage(`✗ ${error instanceof Error ? error.message : 'Validation failed'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    if (!confirm('Clear saved API key?')) return;
    clearApiKey();
    setApiKey('');
    setStatusMessage('Cleared');
    setValidationStatus('idle');
  };

  // Save model immediately when changed (no re-validation needed)
  const handleModelChange = (model: GeminiModel) => {
    setSelectedModel(model);
    if (config.isConfigured) saveModel(model);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-800 transition-colors"
        title="AI Settings"
      >
        ⚙️ AI Settings
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-neutral-700 bg-neutral-900/98 backdrop-blur-sm p-5 shadow-2xl z-50">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-white flex items-center gap-2 text-sm">
              <Lock size={15} className="text-purple-400" />
              Gemini AI Settings
            </h3>
            <button onClick={() => setIsOpen(false)} className="text-neutral-500 hover:text-white transition-colors text-lg leading-none">✕</button>
          </div>

          {/* Model Selection */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Model</label>
            <div className="space-y-2">
              {GEMINI_MODELS.map((m) => (
                <label
                  key={m.id}
                  className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                    selectedModel === m.id
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-neutral-700 hover:border-neutral-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="gemini-model"
                    value={m.id}
                    checked={selectedModel === m.id}
                    onChange={() => handleModelChange(m.id)}
                    className="mt-0.5 accent-purple-500"
                  />
                  <div>
                    <div className="text-sm font-medium text-white">{m.label}</div>
                    <div className="text-xs text-neutral-400 mt-0.5">{m.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* API Key */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">API Key</label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => { setApiKey(e.target.value); setValidationStatus('idle'); setStatusMessage(''); }}
                placeholder="AIza…"
                className="w-full rounded-lg border border-neutral-700 bg-neutral-800/60 px-3 py-2 text-sm text-white placeholder-neutral-600 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500/30 transition-all"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
              >
                {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <p className="mt-1.5 text-xs text-neutral-600">
              Get key at{' '}
              <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300">
                aistudio.google.com
              </a>
              {' '}· Stored locally only
            </p>
          </div>

          {/* Status */}
          {statusMessage && (
            <div className={`mb-4 flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${
              validationStatus === 'valid' ? 'bg-green-500/15 text-green-300' :
              validationStatus === 'invalid' ? 'bg-red-500/15 text-red-300' :
              'bg-blue-500/15 text-blue-300'
            }`}>
              {validationStatus === 'valid' && <Check size={13} />}
              {validationStatus === 'invalid' && <AlertCircle size={13} />}
              {statusMessage}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 rounded-lg bg-purple-600 px-3 py-2 text-sm font-medium text-white hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? 'Validating…' : 'Save'}
            </button>
            <button
              onClick={handleClear}
              className="rounded-lg border border-neutral-700 px-3 py-2 text-neutral-400 hover:border-red-500/60 hover:text-red-400 transition-colors"
              title="Clear API key"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
