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
  signal?: AbortSignal;
  onProgress?: (progress: number, message: string) => void;
}

export interface ProcessResponse {
  success: boolean;
  polishedText?: string;
  error?: string;
  aborted?: boolean;
  chunksProcessed?: number;
  chunksSkipped?: number;
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

/** Minimum ratio of returned length to original length to accept a result as valid. */
const MIN_LENGTH_RATIO = 0.4;

class SafetyBlockError extends Error {
  constructor(reason?: string) {
    super(`Content was blocked by the AI provider's safety filter${reason ? ` (${reason})` : ''}.`);
    this.name = 'SafetyBlockError';
  }
}

// ── Gemini ───────────────────────────────────────────────────────────────────

async function callGemini(modelId: string, prompt: string, apiKey: string, signal?: AbortSignal): Promise<string> {
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

  const client = new GoogleGenerativeAI(apiKey);
  const model  = client.getGenerativeModel({ model: modelId });
  const response = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.3, topP: 0.9, maxOutputTokens: 8000 },
  });

  const res = response.response;

  // Detect safety blocks BEFORE calling .text(), which can silently
  // return '' when candidates are empty or filtered.
  const blockReason = (res as any)?.promptFeedback?.blockReason;
  if (blockReason) throw new SafetyBlockError(String(blockReason));

  const candidates = (res as any)?.candidates;
  if (!candidates || candidates.length === 0) throw new SafetyBlockError('no candidates returned');

  const finishReason = candidates[0]?.finishReason;
  if (finishReason === 'SAFETY' || finishReason === 'RECITATION') {
    throw new SafetyBlockError(String(finishReason));
  }

  const text = res.text().trim();
  if (!text) throw new SafetyBlockError('empty response');

  return text;
}

// ── Groq ─────────────────────────────────────────────────────────────────────

async function callGroq(modelId: string, prompt: string, apiKey: string, signal?: AbortSignal): Promise<string> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: modelId,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 8000,
    }),
    signal,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `Groq error ${response.status}`);
  }

  const data = await response.json();
  const choice = data.choices?.[0];
  const finishReason = choice?.finish_reason;
  if (finishReason === 'content_filter') throw new SafetyBlockError('content_filter');

  const text = (choice?.message?.content ?? '').trim();
  if (!text) throw new SafetyBlockError('empty response');

  return text;
}

// ── Unified ──────────────────────────────────────────────────────────────────

async function callAI(modelId: AIModel, prompt: string, signal?: AbortSignal): Promise<string> {
  const provider = getModelProvider(modelId);
  if (provider === 'groq') {
    const key = getStoredGroqKey();
    if (!key) throw new Error('Groq API key not set. Add it in ⚙️ AI Settings.');
    return callGroq(modelId, prompt, key, signal);
  } else {
    const key = getStoredGeminiKey();
    if (!key) throw new Error('Gemini API key not set. Add it in ⚙️ AI Settings.');
    return callGemini(modelId, prompt, key, signal);
  }
}

// ── Polish ───────────────────────────────────────────────────────────────────
//
// CRITICAL SAFETY GUARANTEE: this function must NEVER let a chunk's content
// be silently replaced with nothing. If a chunk's AI call fails for any
// reason (safety block, network error, empty response, or an implausibly
// short result), the ORIGINAL chunk text is kept instead, and the chunk is
// counted as "skipped" so the caller can inform the user. Content loss is
// treated as a bug, not an acceptable degradation.

export async function processTextWithGemini(
  text: string,
  options: ProcessOptions,
): Promise<ProcessResponse> {
  const modelId = options.model ?? getStoredModel();
  const startTime = Date.now();
  const chunks = chunkText(text);
  const processedChunks = new Map<string, string>();
  let skipped = 0;

  options.onProgress?.(0, `${chunks.length} chunk${chunks.length > 1 ? 's' : ''} · starting…`);

  for (let i = 0; i < chunks.length; i++) {
    if (options.signal?.aborted) {
      return {
        success: false,
        aborted: true,
        polishedText: reconstructText(text, processedChunks),
        chunksProcessed: i,
        chunksSkipped: skipped,
        totalTime: Date.now() - startTime,
        error: 'Stopped by user',
      };
    }

    const chunk = chunks[i];
    options.onProgress?.(Math.round((i / chunks.length) * 100), `Chunk ${i + 1} / ${chunks.length}…`);

    try {
      const prompt = `${getPolishModePrompt(options.mode)}\n\n---\n\n${chunk.content}`;
      const result  = await callAI(modelId, prompt, options.signal);

      // Guard against implausibly short results (silent truncation / partial block)
      if (result.length < chunk.content.length * MIN_LENGTH_RATIO) {
        // Keep the original — do not accept a suspiciously short "polish"
        skipped++;
      } else {
        processedChunks.set(chunk.id, result);
      }

      await new Promise(r => setTimeout(r, 200));
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        return {
          success: false,
          aborted: true,
          polishedText: reconstructText(text, processedChunks),
          chunksProcessed: i,
          chunksSkipped: skipped,
          totalTime: Date.now() - startTime,
          error: 'Stopped by user',
        };
      }
      // Any other per-chunk failure (including safety blocks): keep the
      // original chunk content, count it as skipped, and CONTINUE — never
      // drop content, never abort the whole book over one flagged chunk.
      skipped++;
    }
  }

  options.onProgress?.(100, 'Done');

  const polishedText = reconstructText(text, processedChunks);

  return {
    success: true,
    polishedText,
    chunksProcessed: chunks.length,
    chunksSkipped: skipped,
    totalTime: Date.now() - startTime,
    error: skipped > 0
      ? `${skipped} chunk${skipped > 1 ? 's were' : ' was'} left unchanged (AI declined or returned an invalid result — likely a safety filter on sensitive medical/safety content). Nothing was deleted.`
      : undefined,
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

