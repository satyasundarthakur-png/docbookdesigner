// Gemini API Configuration & Key Management

const GEMINI_API_KEY_STORAGE = 'docbook-gemini-api-key';
const GEMINI_MODEL = 'gemini-2.5-flash';

export interface GeminiConfig {
  apiKey: string;
  isConfigured: boolean;
}

export const SYSTEM_PROMPT = `You are an expert editor specializing in academic, historical, and Ayurvedic literature. Your task is to polish the provided text for grammatical clarity, seamless translation flow, and consistent structure.

CRITICAL GUIDELINES:
1. DO NOT change the core clinical meanings, traditional remedies, or names of herbs/practices
2. Enhance readability without losing the historical, authoritative voice
3. Preserve Indian English conventions and scholarly terminology
4. For verses/shlokas: Format them as centered, italicized blocks
5. Fix translation awkwardness while maintaining cultural authenticity
6. Maintain the original tone and perspective of the author
7. Do not add new information or modernize outdated practices
8. Respect the structure and hierarchy of sections
9. Preserve all Sanskrit terms and medical terminology
10. Return ONLY the polished text without explanations or metadata

Format guidelines:
- Verses should be on separate lines, centered
- Use appropriate punctuation for clarity
- Maintain consistent tense and voice
- Preserve chapter and section breaks
- Keep all formatting markers (##, ###, etc.) intact`;

/**
 * Get the stored Gemini API key from localStorage
 */
export function getStoredApiKey(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(GEMINI_API_KEY_STORAGE);
}

/**
 * Save the Gemini API key to localStorage
 */
export function saveApiKey(apiKey: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(GEMINI_API_KEY_STORAGE, apiKey);
}

/**
 * Remove the stored Gemini API key
 */
export function clearApiKey(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(GEMINI_API_KEY_STORAGE);
}

/**
 * Check if Gemini API is configured
 */
export function isGeminiConfigured(): boolean {
  return !!getStoredApiKey();
}

/**
 * Get current configuration status
 */
export function getGeminiConfig(): GeminiConfig {
  const apiKey = getStoredApiKey();
  return {
    apiKey: apiKey || '',
    isConfigured: !!apiKey,
  };
}

/**
 * Validate API key format (basic check)
 */
export function isValidApiKey(key: string): boolean {
  return key && key.length > 20 && key.startsWith('AIza');
}
