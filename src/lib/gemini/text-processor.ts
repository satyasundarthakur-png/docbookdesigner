// Text Processing & Chunking for Gemini API

export type PolishMode = 'grammar' | 'structure' | 'style' | 'comprehensive';

export interface TextChunk {
  id: string;
  content: string;
  type: 'chapter' | 'section' | 'paragraph';
  startIndex: number;
  endIndex: number;
}

export interface ProcessingResult {
  polishedText: string;
  chunksProcessed: number;
  totalTime: number;
  errors: string[];
}

/**
 * Split text into logical chunks for processing
 * Prioritizes chapter breaks (##) and section breaks (###)
 */
export function chunkText(text: string, chunkSizeChars = 8000): TextChunk[] {
  const chunks: TextChunk[] = [];
  const lines = text.split('\n');
  let currentChunk = '';
  let currentType: 'chapter' | 'section' | 'paragraph' = 'paragraph';
  let chunkStartIndex = 0;
  let globalIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineWithNewline = line + '\n';

    if (line.startsWith('## ')) {
      if (currentChunk.trim()) {
        chunks.push({
          id: `chunk-${chunks.length}`,
          content: currentChunk.trim(),
          type: currentType,
          startIndex: chunkStartIndex,
          endIndex: globalIndex,
        });
        currentChunk = '';
      }
      currentType = 'chapter';
      currentChunk = line;
      chunkStartIndex = globalIndex;
    } else if (line.startsWith('### ')) {
      if (currentChunk.trim() && currentType !== 'section') {
        chunks.push({
          id: `chunk-${chunks.length}`,
          content: currentChunk.trim(),
          type: currentType,
          startIndex: chunkStartIndex,
          endIndex: globalIndex,
        });
        currentChunk = '';
      }
      currentType = 'section';
      currentChunk = line;
      chunkStartIndex = globalIndex;
    } else if (currentChunk.length + lineWithNewline.length > chunkSizeChars) {
      if (currentChunk.trim()) {
        chunks.push({
          id: `chunk-${chunks.length}`,
          content: currentChunk.trim(),
          type: currentType,
          startIndex: chunkStartIndex,
          endIndex: globalIndex,
        });
      }
      currentChunk = line;
      currentType = 'paragraph';
      chunkStartIndex = globalIndex;
    } else {
      currentChunk += lineWithNewline;
    }

    globalIndex += lineWithNewline.length;
  }

  if (currentChunk.trim()) {
    chunks.push({
      id: `chunk-${chunks.length}`,
      content: currentChunk.trim(),
      type: currentType,
      startIndex: chunkStartIndex,
      endIndex: globalIndex,
    });
  }

  return chunks;
}

/**
 * Create a system prompt based on polish mode
 */
export function getPolishModePrompt(mode: PolishMode): string {
  const basePrompt = `You are an expert book editor. Polish the provided text according to the focus area below.

RULES:
1. Preserve the author's voice and intent
2. Do not add new content or change meaning
3. Keep all headings, structure markers (##, ###), and formatting intact
4. Return ONLY the polished text — no explanations, no metadata`;

  const modeSpecific = {
    grammar: `\nFOCUS: Grammar & Clarity
- Fix grammar, spelling, and punctuation errors
- Improve sentence clarity and flow
- Remove redundant words`,

    structure: `\nFOCUS: Structure & Headings
- Ensure consistent heading levels
- Fix orphaned paragraphs
- Standardize section formatting`,

    style: `\nFOCUS: Writing Style
- Improve prose rhythm and readability
- Vary sentence length for better flow
- Enhance word choice without changing meaning`,

    comprehensive: `\nFOCUS: Full Polish
- Fix grammar and punctuation
- Improve clarity and flow
- Enhance writing style
- Standardize structure`,
  };

  return basePrompt + modeSpecific[mode];
}

/**
 * Reconstruct text from processed chunks
 */
export function reconstructText(
  originalText: string,
  processedChunks: Map<string, string>,
): string {
  const chunks = chunkText(originalText);
  let result = '';
  for (const chunk of chunks) {
    const processedContent = processedChunks.get(chunk.id);
    // SAFETY: never allow an empty/whitespace-only processed value to
    // erase original content. `??` only guards null/undefined — an empty
    // string from a blocked/failed AI call would otherwise pass through
    // and silently delete this chunk. Always fall back to the original
    // chunk content unless the processed result has real content.
    const safe = (processedContent && processedContent.trim().length > 0)
      ? processedContent
      : chunk.content;
    result += safe + '\n\n';
  }
  return result.trim();
}

function estimateProcessingTime(textLength: number): string {
  const estimatedSeconds = Math.ceil(textLength / 50000) * 2;
  if (estimatedSeconds < 60) return `${estimatedSeconds}s`;
  return `${Math.ceil(estimatedSeconds / 60)}m ${estimatedSeconds % 60}s`;
}

export function analyzeText(text: string) {
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const charCount = text.length;
  const chunkCount = chunkText(text).length;
  return {
    wordCount,
    charCount,
    chunkCount,
    estimatedTime: estimateProcessingTime(charCount),
  };
}
