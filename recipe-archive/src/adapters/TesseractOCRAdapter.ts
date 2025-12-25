/**
 * Tesseract.js OCR Adapter
 * Implements OCRAdapter interface for client-side optical character recognition
 * Requirements: 1.2, 1.4, 8.3
 */

import Tesseract, { createWorker, Worker } from 'tesseract.js';
import type { OCRAdapter, OCRResult, TextBlock, ImageSource } from '../types';

/**
 * Patterns for inferring author from recipe text
 */
const AUTHOR_PATTERNS = [
  /(?:^|\n)\s*(?:by|from|recipe by|submitted by|created by|author)[:\s]+([^\n]+)/i,
  /(?:^|\n)\s*([^\n]+?)['']s\s+(?:recipe|kitchen|cookbook)/i,
  /(?:^|\n)\s*(?:grandma|grandpa|mom|dad|aunt|uncle)\s+([^\n]+?)['']s/i,
];

export class TesseractOCRAdapter implements OCRAdapter {
  private worker: Worker | null = null;
  private initialized = false;

  /**
   * Initialize the Tesseract.js worker
   */
  async initialize(): Promise<void> {
    if (this.initialized && this.worker) {
      return;
    }

    this.worker = await createWorker('eng');
    this.initialized = true;
  }

  /**
   * Recognize text from an image source
   */
  async recognizeText(image: ImageSource): Promise<OCRResult> {
    if (!this.initialized || !this.worker) {
      throw new Error('OCR adapter not initialized. Call initialize() first.');
    }

    const result = await this.worker.recognize(image);
    const text = result.data.text;
    const confidence = result.data.confidence;

    const blocks: TextBlock[] = result.data.blocks?.map((block) => ({
      text: block.text,
      boundingBox: {
        x: block.bbox.x0,
        y: block.bbox.y0,
        width: block.bbox.x1 - block.bbox.x0,
        height: block.bbox.y1 - block.bbox.y0,
      },
      confidence: block.confidence,
    })) ?? [];

    const inferredAuthor = this.inferAuthor(text);

    return {
      text,
      confidence,
      inferredAuthor,
      blocks,
    };
  }

  /**
   * Terminate the Tesseract.js worker and release resources
   */
  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.initialized = false;
    }
  }

  /**
   * Infer author from extracted text using common patterns
   * Patterns: "By", "From", "Recipe by", etc.
   */
  inferAuthor(text: string): string | null {
    for (const pattern of AUTHOR_PATTERNS) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const author = match[1].trim();
        // Filter out obviously invalid matches
        if (author.length > 0 && author.length < 100) {
          return author;
        }
      }
    }
    return null;
  }
}
