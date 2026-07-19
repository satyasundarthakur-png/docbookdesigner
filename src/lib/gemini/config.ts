// AI Configuration & Key Management

const GEMINI_KEY_STORAGE = 'docbook-gemini-api-key';
const GROQ_KEY_STORAGE = 'docbook-groq-api-key';
const MODEL_STORAGE = 'docbook-ai-model';

export type AIProvider = 'gemini' | 'groq';

export type AIModel =
  | 'gemini-2.5-flash'
  | 'gemini-2.5-flash-lite'
  | 'llama-3.3-70b-versatile'
  | 'llama-3.1-8b-instant'
  | 'mixtral-8x7b-32768';

export const AI_MODELS: { id: AIModel; provider: AIProvider; label: string; description: string }[] = [
  { id: 'gemini-2.5-flash', provider: 'gemini', label: 'Gemini 2.5 Flash', description: 'Best quality' },
  { id: 'gemini-2.5-flash-lite', provider: 'gemini', label: 'Gemini 2.5 Flash Lite', description: 'Faster & cheaper' },
  { id: 'llama-3.3-70b-versatile', provider: 'groq', label: 'Llama 3.3 70B', description: 'Best Groq quality' },
  { id: 'llama-3.1-8b-instant', provider: 'groq', label: 'Llama 3.1 8B', description: 'Fastest Groq' },
  { id: 'mixtral-8x7b-32768', provider: 'groq', label: 'Mixtral 8x7B', description: 'Large context' },
];

export function getModelProvider(model: AIModel): AIProvider {
  return AI_MODELS.find(m => m.id === model)?.provider ?? 'gemini';
}

export function getStoredGeminiKey(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(GEMINI_KEY_STORAGE);
}
export function saveGeminiKey(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(GEMINI_KEY_STORAGE, key);
}

export function getStoredGroqKey(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(GROQ_KEY_STORAGE);
}
export function saveGroqKey(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(GROQ_KEY_STORAGE, key);
}

export function clearAllKeys(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(GEMINI_KEY_STORAGE);
  localStorage.removeItem(GROQ_KEY_STORAGE);
  localStorage.removeItem(MODEL_STORAGE);
}

export function getStoredModel(): AIModel {
  if (typeof window === 'undefined') return 'gemini-2.5-flash';
  const stored = localStorage.getItem(MODEL_STORAGE) as AIModel | null;
  return stored && AI_MODELS.find(m => m.id === stored) ? stored : 'gemini-2.5-flash';
}
export function saveModel(model: AIModel): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(MODEL_STORAGE, model);
}

export function isConfigured(): boolean {
  const model = getStoredModel();
  const provider = getModelProvider(model);
  return provider === 'gemini' ? !!getStoredGeminiKey() : !!getStoredGroqKey();
}
