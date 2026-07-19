// AI Service — Gemini + Groq

import { GoogleGenerativeAI } from '@google/generative-ai';
import { getPolishModePrompt, PolishMode, chunkText, reconstructText } from './text-processor';
import {
  getStoredGeminiKey,
  getStoredGroqKey,
  getStoredModel,
  getModelProvider,
  type AIModel,
} from './config';

export interface ProcessOptions {
  mode: PolishMode;
  model?: AIModel;
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

// ── Gemini ───────────────────────────────────────────────────────────────────

async function callGemini(modelId: string, prompt: string, apiKey: string): Promise<string> {
  const client = new GoogleGenerativeAI(apiKey);
  const model = client.getGenerativeModel({ model: modelId });
  const response = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.3, topP: 0.9, maxOutputTokens: 8000 },
  });
  return response.response.text().trim();
}

// ── Groq ─────────────────────────────────────────────────────────────────────

async function callGroq(modelId: string, prompt: string, apiKey: string): Promise<string> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: modelId,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 8000,
    }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `Groq error ${response.status}`);
  }
  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() ?? '';
}

// ── Unified ──────────────────────────────────────────────────────────────────

async function callAI(modelId: AIModel, prompt: string): Promise<string> {
  const provider = getModelProvider(modelId);
  if (provider === 'groq') {
    const key = getStoredGroqKey();
    if (!key) throw new Error('Groq API key not set. Add it in ⚙️ AI Settings.');
    return callGroq(modelId, prompt, key);
  } else {
    const key = getStoredGeminiKey();
    if (!key) throw new Error('Gemini API key not set. Add it in ⚙️ AI Settings.');
    return callGemini(modelId, prompt, key);
  }
}

// ── Polish ───────────────────────────────────────────────────────────────────

export async function processTextWithGemini(
  text: string,
  options: ProcessOptions,
): Promise<ProcessResponse> {
  const modelId = options.model ?? getStoredModel();
  const startTime = Date.now();
  const chunks = chunkText(text);
  const processedChunks = new Map<string, string>();

  options.onProgress?.(0, `${chunks.length} chunk${chunks.length > 1 ? 's' : ''} · starting…`);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    options.onProgress?.(Math.round((i / chunks.length) * 100), `Chunk ${i + 1} / ${chunks.length}…`);

    try {
      const prompt = `${getPolishModePrompt(options.mode)}\n\n---\n\n${chunk.content}`;
      const result = await callAI(modelId, prompt);
      processedChunks.set(chunk.id, result);
      await new Promise(r => setTimeout(r, 200));
    } catch (e) {
      // Fail fast — first error stops everything
      const msg = e instanceof Error ? e.message : 'Unknown error';
      return { success: false, error: msg };
    }
  }

  options.onProgress?.(100, 'Done');
  return {
    success: true,
    polishedText: reconstructText(text, processedChunks),
    chunksProcessed: chunks.length,
    totalTime: Date.now() - startTime,
  };
}

// ── Cover page ───────────────────────────────────────────────────────────────

export async function generateCoverPage(options: CoverPageOptions): Promise<CoverPageResponse> {
  try {
    const modelId = getStoredModel();
    const prompt = `Generate a beautiful self-contained HTML cover page for a book.
Title: ${options.title}
${options.author ? `Author: ${options.author}` : ''}
${options.genre ? `Genre: ${options.genre}` : ''}
${options.theme ? `Visual style: ${options.theme}` : ''}

Rules:
- Return ONLY a single <div> element with inline CSS — no full HTML document, no markdown, no code fences
- No <img> tags — use CSS gradients, borders, shapes for decoration
- Min-height 720px, centered layout, print-ready
- Include title prominently, author if provided, decorative elements matching genre/style
- You may include a <style> tag inside the div for Google Fonts @import`;

    const html = (await callAI(modelId, prompt))
      .replace(/^```html?\s*/i, '').replace(/\s*```$/, '').trim();

    return { success: true, html };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to generate cover' };
  }
}

// legacy compat
export const validateApiKey = async (_key: string) => true;
