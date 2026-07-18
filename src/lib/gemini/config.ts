// Gemini API Configuration & Key Management

const GEMINI_API_KEY_STORAGE = 'docbook-gemini-api-key';

export interface GeminiConfig {
  apiKey: string;
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
}

export function isGeminiConfigured(): boolean {
  return !!getStoredApiKey();
}

export function getGeminiConfig(): GeminiConfig {
  const apiKey = getStoredApiKey();
  return { apiKey: apiKey || '', isConfigured: !!apiKey };
}

export function isValidApiKey(key: string): boolean {
  return typeof key === 'string' && key.length > 20 && key.startsWith('AIza');
}
