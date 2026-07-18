// Gemini API Configuration & Key Management

const GEMINI_API_KEY_STORAGE = 'docbook-gemini-api-key';
const GEMINI_MODEL_STORAGE = 'docbook-gemini-model';

export type GeminiModel = 'gemini-2.5-flash' | 'gemini-2.5-flash-lite-preview-06-17';

export const GEMINI_MODELS: { id: GeminiModel; label: string; description: string }[] = [
  {
    id: 'gemini-2.5-flash',
    label: 'Gemini 2.5 Flash',
    description: 'Best quality — recommended for polishing',
  },
  {
    id: 'gemini-2.5-flash-lite-preview-06-17',
    label: 'Gemini 2.5 Flash Lite',
    description: 'Faster & cheaper — good for large books',
  },
];

export interface GeminiConfig {
  apiKey: string;
  model: GeminiModel;
  isConfigured: boolean;
}

export function getStoredApiKey(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(GEMINI_API_KEY_STORAGE);
}

export function saveApiKey(apiKey: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(GEMINI_API_KEY_STORAGE, apiKey);
}

export function clearApiKey(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(GEMINI_API_KEY_STORAGE);
  localStorage.removeItem(GEMINI_MODEL_STORAGE);
}

export function getStoredModel(): GeminiModel {
  if (typeof window === 'undefined') return 'gemini-2.5-flash';
  const stored = localStorage.getItem(GEMINI_MODEL_STORAGE) as GeminiModel | null;
  return stored && GEMINI_MODELS.find(m => m.id === stored) ? stored : 'gemini-2.5-flash';
}

export function saveModel(model: GeminiModel): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(GEMINI_MODEL_STORAGE, model);
}

export function isGeminiConfigured(): boolean {
  return !!getStoredApiKey();
}

export function getGeminiConfig(): GeminiConfig {
  const apiKey = getStoredApiKey();
  return { apiKey: apiKey || '', model: getStoredModel(), isConfigured: !!apiKey };
}

export function isValidApiKey(key: string): boolean {
  return typeof key === 'string' && key.length > 20 && key.startsWith('AIza');
}
