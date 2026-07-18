import { useState } from 'react';
import { Lock, Eye, EyeOff, Trash2, Check, AlertCircle } from 'lucide-react';
import {
  getGeminiConfig,
  saveApiKey,
  clearApiKey,
  isValidApiKey,
} from '@/lib/gemini/config';
import { validateApiKey } from '@/lib/gemini/service';

export function GeminiSettings() {
  const [isOpen, setIsOpen] = useState(false);
  const [apiKey, setApiKey] = useState(getGeminiConfig().apiKey);
  const [showKey, setShowKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [validationStatus, setValidationStatus] = useState<
    'idle' | 'validating' | 'valid' | 'invalid'
  >('idle');
  const [statusMessage, setStatusMessage] = useState('');

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      setStatusMessage('Please enter an API key');
      return;
    }

    if (!isValidApiKey(apiKey)) {
      setStatusMessage('Invalid API key format');
      return;
    }

    setIsSaving(true);
    setValidationStatus('validating');

    try {
      const isValid = await validateApiKey(apiKey);
      if (isValid) {
        saveApiKey(apiKey);
        setValidationStatus('valid');
        setStatusMessage('✓ API key validated and saved');
        setTimeout(() => setIsOpen(false), 1500);
      } else {
        setValidationStatus('invalid');
        setStatusMessage('✗ API key is invalid or expired');
      }
    } catch (error) {
      setValidationStatus('invalid');
      setStatusMessage(
        `✗ Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearApiKey = () => {
    if (confirm('Are you sure? This will clear your saved Gemini API key.')) {
      clearApiKey();
      setApiKey('');
      setStatusMessage('API key cleared');
      setValidationStatus('idle');
    }
  };

  return (
    <div className="relative">
      {/* Settings Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-800 transition-all duration-300 btn-glow"
        title="Gemini AI Settings"
      >
        ⚙️ AI Settings
      </button>

      {/* Settings Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 rounded-lg border border-neutral-700 bg-neutral-900/95 backdrop-blur-sm p-6 shadow-xl z-50 glow-container">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Lock size={18} className="text-cyan-400" />
              Google Gemini Configuration
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-neutral-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          {/* API Key Input */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-neutral-300">
              API Key (Stored Locally)
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setValidationStatus('idle');
                }}
                placeholder="AIza..."
                className="w-full rounded-lg border border-neutral-700 bg-neutral-800/50 px-4 py-2 text-white placeholder-neutral-600 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 transition-all duration-300"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-200"
              >
                {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="text-xs text-neutral-500">
              Get your API key from{' '}
              <a
                href="https://ai.google.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300"
              >
                Google AI Studio
              </a>
              . Stored only in your browser.
            </p>
          </div>

          {/* Status Messages */}
          {statusMessage && (
            <div
              className={`mt-4 flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                validationStatus === 'valid'
                  ? 'bg-green-500/20 text-green-300'
                  : validationStatus === 'invalid'
                    ? 'bg-red-500/20 text-red-300'
                    : 'bg-blue-500/20 text-blue-300'
              }`}
            >
              {validationStatus === 'valid' ? (
                <Check size={16} />
              ) : validationStatus === 'invalid' ? (
                <AlertCircle size={16} />
              ) : validationStatus === 'validating' ? (
                <div className="animate-spin">⟳</div>
              ) : null}
              {statusMessage}
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex gap-2">
            <button
              onClick={handleSaveApiKey}
              disabled={isSaving}
              className="flex-1 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-2 font-medium text-white hover:from-green-400 hover:to-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 btn-glow"
            >
              {isSaving ? 'Validating...' : 'Save & Validate'}
            </button>
            <button
              onClick={handleClearApiKey}
              className="rounded-lg border border-neutral-700 px-4 py-2 text-neutral-300 hover:border-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-300"
              title="Clear saved API key"
            >
              <Trash2 size={18} />
            </button>
          </div>

          {/* Feature List */}
          <div className="mt-6 space-y-2 border-t border-neutral-700 pt-4">
            <p className="text-xs font-semibold text-neutral-300">Features:</p>
            <ul className="text-xs text-neutral-400 space-y-1">
              <li>✓ Grammar & translation flow</li>
              <li>✓ Verse & shloka formatting</li>
              <li>✓ Document structure optimization</li>
              <li>✓ Comprehensive text polish</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
