// Text Processing & Chunking for Gemini API

export type PolishMode = 'grammar' | 'verses' | 'structure' | 'comprehensive';

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

    // Detect section types
    if (line.startsWith('## ')) {
      // Chapter break
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
      // Section break
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
      // Size limit reached
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

  // Add remaining chunk
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
 * Create a specialized system prompt based on polish mode
 */
export function getPolishModePrompt(mode: PolishMode): string {
  const basePrompt = `You are an expert editor specializing in academic, historical, and Ayurvedic literature. Your task is to polish the provided text for:

CRITICAL GUIDELINES:
1. DO NOT change core clinical meanings, traditional remedies, or herb/practice names
2. Enhance readability without losing the historical, authoritative voice
3. Preserve Indian English conventions and scholarly terminology
4. Maintain the original tone and perspective
5. Do not add new information or modernize outdated practices
6. Respect the structure and hierarchy of sections
7. Preserve all Sanskrit terms and medical terminology
8. Return ONLY the polished text without explanations`;

  const modeSpecific = {
    grammar: `\nFOCUS AREA: Grammar & Translation Flow
- Fix grammatical errors and awkward phrasing
- Improve sentence flow and clarity
- Correct translation inconsistencies
- Enhance punctuation for readability`,

    verses: `\nFOCUS AREA: Verse & Shloka Formatting
- Identify verses and format them as separate, centered blocks
- Preserve verse content exactly, only improving spacing/punctuation
- Use consistent formatting for all poetic/verse sections
- Add line breaks for readability without changing meaning`,

    structure: `\nFOCUS AREA: Document Structure
- Ensure consistent heading levels (##, ###, etc.)
- Standardize section formatting
- Fix orphaned paragraphs
- Maintain logical flow between sections`,

    comprehensive: `\nFOCUS AREA: Complete Polish
- Fix all grammatical issues
- Enhance translation flow
- Format verses appropriately
- Standardize structure and headings
- Improve overall readability`,
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
    if (processedContent) {
      result += processedContent + '\n\n';
    } else {
      result += chunk.content + '\n\n';
    }
  }

  return result.trim();
}

/**
 * Estimate processing time based on text length
 * Note: This is used internally by analyzeText() for UI display
 */
function estimateProcessingTime(textLength: number): string {
  const estimatedSeconds = Math.ceil(textLength / 50000) * 2;
  if (estimatedSeconds < 60) return `${estimatedSeconds}s`;
  return `${Math.ceil(estimatedSeconds / 60)}m ${estimatedSeconds % 60}s`;
}

/**
 * Detect if text contains verses/shlokas
 * Note: This is used internally by analyzeText() for UI display
 */
function detectVerses(text: string): number {
  const versePatterns = [
    /\*\*Sanskrit verse:\*\*/gi,
    /सं\w+/g, // Sanskrit text detection
    /"\s*[A-Z][^.]*['"]\s*$/gm, // Quoted verses
  ];

  let verseCount = 0;
  for (const pattern of versePatterns) {
    verseCount += (text.match(pattern) || []).length;
  }
  return verseCount;
}

/**
 * Format analysis for polishing recommendation
 * Used to display text statistics in the polish dialog
 */
export function analyzeText(text: string) {
  const wordCount = text.split(/\s+/).length;
  const charCount = text.length;
  const verseCount = detectVerses(text);
  const chunkCount = chunkText(text).length;

  return {
    wordCount,
    charCount,
    verseCount,
    chunkCount,
    estimatedTime: estimateProcessingTime(charCount),
  };
}
