// Gemini API Service

import { GoogleGenerativeAI } from '@google/generative-ai';
import { getPolishModePrompt, PolishMode, chunkText, reconstructText } from './text-processor';
import { getStoredApiKey, getStoredModel, type GeminiModel } from './config';

export interface ProcessOptions {
  mode: PolishMode;
  model?: GeminiModel;
  onProgress?: (progress: number, message: string) => void;
}

export interface ProcessResponse {
  success: boolean;
  polishedText?: string;
  error?: string;
  chunksProcessed?: number;
  totalTime?: number;
}

export interface CoverPageOptions {
  title: string;
  author?: string;
  genre?: string;
  theme?: string;
}

export interface CoverPageResponse {
  success: boolean;
  html?: string;
  error?: string;
}

/**
 * Process text using Gemini API with selected model
 */
export async function processTextWithGemini(
  text: string,
  options: ProcessOptions,
): Promise<ProcessResponse> {
  try {
    const apiKey = getStoredApiKey();
    if (!apiKey) {
      return { success: false, error: 'Gemini API key not configured. Please set it in AI Settings.' };
    }

    const modelId = options.model ?? getStoredModel();
    const startTime = Date.now();
    const client = new GoogleGenerativeAI(apiKey);
    const model = client.getGenerativeModel({ model: modelId });

    const chunks = chunkText(text);
    const processedChunks = new Map<string, string>();
    const errors: string[] = [];

    options.onProgress?.(0, `Using ${modelId} · ${chunks.length} chunk${chunks.length > 1 ? 's' : ''}…`);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const progress = Math.round((i / chunks.length) * 100);
      options.onProgress?.(progress, `Chunk ${i + 1} / ${chunks.length}…`);

      try {
        const response = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: `${getPolishModePrompt(options.mode)}\n\n---\n\n${chunk.content}` }] }],
          generationConfig: { temperature: 0.3, topP: 0.9, topK: 40, maxOutputTokens: 8000 },
        });

        processedChunks.set(chunk.id, response.response.text().trim());
        await new Promise((r) => setTimeout(r, 300));
      } catch (chunkError) {
        errors.push(`Chunk ${i + 1}: ${chunkError instanceof Error ? chunkError.message : 'Unknown error'}`);
        processedChunks.set(chunk.id, chunk.content);
      }
    }

    options.onProgress?.(100, 'Rebuilding document…');
    const polishedText = reconstructText(text, processedChunks);

    return {
      success: errors.length === 0,
      polishedText,
      chunksProcessed: chunks.length,
      totalTime: Date.now() - startTime,
      error: errors.length > 0 ? errors.join('; ') : undefined,
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to process text' };
  }
}

/**
 * Generate a styled HTML cover page using Gemini
 */
export async function generateCoverPage(options: CoverPageOptions): Promise<CoverPageResponse> {
  try {
    const apiKey = getStoredApiKey();
    if (!apiKey) {
      return { success: false, error: 'Gemini API key not configured.' };
    }

    const modelId = getStoredModel();
    const client = new GoogleGenerativeAI(apiKey);
    const model = client.getGenerativeModel({ model: modelId });

    const prompt = `Generate a beautiful, self-contained HTML cover page for a book with these details:
Title: ${options.title}
${options.author ? `Author: ${options.author}` : ''}
${options.genre ? `Genre: ${options.genre}` : ''}
${options.theme ? `Visual style: ${options.theme}` : ''}

Requirements:
- Return ONLY valid HTML — no markdown, no code fences, no explanation
- Must be a complete <div> element (not a full HTML document)
- Use only inline CSS — no external stylesheets or scripts
- Design should be elegant, print-ready, typographically excellent
- Use CSS gradients, borders, or geometric shapes for decoration — no <img> tags
- Include: title prominently, author name if provided, decorative elements that match the genre
- Min-height: 720px, centered layout, suitable as a printed book cover page
- Use web-safe fonts or Google Fonts @import inside a <style> tag within the div`;

    const response = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.8, maxOutputTokens: 4000 },
    });

    let html = response.response.text().trim();
    // Strip any accidental markdown code fences
    html = html.replace(/^```html?\s*/i, '').replace(/\s*```$/, '').trim();

    return { success: true, html };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to generate cover page' };
  }
}

/**
 * Validate API key
 */
export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    const client = new GoogleGenerativeAI(apiKey);
    const model = client.getGenerativeModel({ model: 'gemini-2.5-flash-lite-preview-06-17' });
    await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: 'Hi' }] }],
      generationConfig: { maxOutputTokens: 5 },
    });
    return true;
  } catch {
    return false;
  }
}
