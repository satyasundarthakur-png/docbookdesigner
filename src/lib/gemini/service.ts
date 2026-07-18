// Gemini API Service for Text Processing

import { GoogleGenerativeAI } from '@google/generative-ai';
import { getPolishModePrompt, PolishMode, chunkText, reconstructText } from './text-processor';
import { getStoredApiKey } from './config';

export interface ProcessOptions {
  mode: PolishMode;
  onProgress?: (progress: number, message: string) => void;
  onChunkComplete?: (chunkId: string, content: string) => void;
}

export interface ProcessResponse {
  success: boolean;
  polishedText?: string;
  error?: string;
  chunksProcessed?: number;
  totalTime?: number;
}

/**
 * Process text using Gemini API
 */
export async function processTextWithGemini(
  text: string,
  options: ProcessOptions,
): Promise<ProcessResponse> {
  try {
    const apiKey = getStoredApiKey();
    if (!apiKey) {
      return {
        success: false,
        error: 'Gemini API key not configured. Please set it in settings.',
      };
    }

    const startTime = Date.now();
    const client = new GoogleGenerativeAI(apiKey);
    const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const chunks = chunkText(text);
    const processedChunks = new Map<string, string>();
    const errors: string[] = [];

    options.onProgress?.(0, `Processing ${chunks.length} chunks...`);

    // Process chunks sequentially
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const progress = Math.round((i / chunks.length) * 100);

      options.onProgress?.(
        progress,
        `Processing chunk ${i + 1}/${chunks.length}...`,
      );

      try {
        const response = await model.generateContent({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `${getPolishModePrompt(options.mode)}\n\n---\n\nText to polish:\n\n${chunk.content}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.3, // Lower temperature for consistency
            topP: 0.9,
            topK: 40,
            maxOutputTokens: 8000,
          },
        });

        const resultText = response.response.text().trim();
        processedChunks.set(chunk.id, resultText);
        options.onChunkComplete?.(chunk.id, resultText);

        // Add small delay to avoid rate limits
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (chunkError) {
        const errorMsg = `Chunk ${i + 1}: ${chunkError instanceof Error ? chunkError.message : 'Unknown error'}`;
        errors.push(errorMsg);
        // Keep original chunk if processing fails
        processedChunks.set(chunk.id, chunk.content);
      }
    }

    options.onProgress?.(100, 'Reconstructing document...');

    // Reconstruct text from processed chunks
    const polishedText = reconstructText(text, processedChunks);
    const totalTime = Date.now() - startTime;

    return {
      success: errors.length === 0,
      polishedText,
      chunksProcessed: chunks.length,
      totalTime,
      error: errors.length > 0 ? errors.join('; ') : undefined,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to process text with Gemini';

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Validate API key by attempting a simple request
 */
export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    const client = new GoogleGenerativeAI(apiKey);
    const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });

    await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: 'Test' }],
        },
      ],
      generationConfig: {
        maxOutputTokens: 10,
      },
    });

    return true;
  } catch {
    return false;
  }
}

/**
 * Get remaining quota info (if available)
 */
export async function checkApiHealth(apiKey: string): Promise<{
  isHealthy: boolean;
  message: string;
}> {
  try {
    const isValid = await validateApiKey(apiKey);
    return {
      isHealthy: isValid,
      message: isValid ? 'API is working correctly' : 'API key is invalid or expired',
    };
  } catch (error) {
    return {
      isHealthy: false,
      message: `API health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
