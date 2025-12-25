/**
 * Unit tests for OCR Adapter
 * Tests author inference patterns and error handling
 * Requirements: 1.4, 1.5
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TesseractOCRAdapter } from '../adapters/TesseractOCRAdapter';

// Mock tesseract.js
vi.mock('tesseract.js', () => ({
  default: {},
  createWorker: vi.fn(),
}));

describe('TesseractOCRAdapter', () => {
  let adapter: TesseractOCRAdapter;

  beforeEach(() => {
    adapter = new TesseractOCRAdapter();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('inferAuthor', () => {
    it('should infer author from "By" pattern', () => {
      const text = 'Chocolate Chip Cookies\nBy Grandma Smith\nIngredients:';
      const author = adapter.inferAuthor(text);
      expect(author).toBe('Grandma Smith');
    });

    it('should infer author from "From" pattern', () => {
      const text = 'Apple Pie Recipe\nFrom: Mary Johnson\nPrep time: 30 min';
      const author = adapter.inferAuthor(text);
      expect(author).toBe('Mary Johnson');
    });

    it('should infer author from "Recipe by" pattern', () => {
      const text = 'Banana Bread\nRecipe by Chef Julia\nMakes 1 loaf';
      const author = adapter.inferAuthor(text);
      expect(author).toBe('Chef Julia');
    });

    it('should infer author from "Submitted by" pattern', () => {
      const text = 'Lasagna\nSubmitted by: Tony Romano\nServes 8';
      const author = adapter.inferAuthor(text);
      expect(author).toBe('Tony Romano');
    });

    it('should infer author from "Created by" pattern', () => {
      const text = 'Sourdough Bread\nCreated by Baker Bob\nRise time: 4 hours';
      const author = adapter.inferAuthor(text);
      expect(author).toBe('Baker Bob');
    });

    it('should infer author from possessive recipe pattern', () => {
      const text = "Grandma Rose's Recipe\nIngredients:\n1 cup flour";
      const author = adapter.inferAuthor(text);
      expect(author).toBe('Grandma Rose');
    });

    it('should infer author from possessive kitchen pattern', () => {
      const text = "From Sarah's Kitchen\n2 eggs\n1 cup sugar";
      const author = adapter.inferAuthor(text);
      expect(author).toBe("Sarah's Kitchen");
    });

    it('should return null when no author pattern is found', () => {
      const text = 'Simple Pancakes\nIngredients:\n2 cups flour\n2 eggs';
      const author = adapter.inferAuthor(text);
      expect(author).toBeNull();
    });

    it('should return null for empty text', () => {
      const author = adapter.inferAuthor('');
      expect(author).toBeNull();
    });

    it('should handle case-insensitive matching', () => {
      const text = 'Cookies\nBY JOHN DOE\nMix ingredients';
      const author = adapter.inferAuthor(text);
      expect(author).toBe('JOHN DOE');
    });

    it('should trim whitespace from inferred author', () => {
      const text = 'Cake\nBy:   Jane Doe   \nBake at 350';
      const author = adapter.inferAuthor(text);
      expect(author).toBe('Jane Doe');
    });

    it('should reject overly long author matches', () => {
      const longName = 'A'.repeat(150);
      const text = `Recipe\nBy ${longName}\nIngredients`;
      const author = adapter.inferAuthor(text);
      expect(author).toBeNull();
    });
  });

  describe('initialize and terminate', () => {
    it('should throw error when recognizeText called before initialize', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      await expect(adapter.recognizeText(mockFile)).rejects.toThrow(
        'OCR adapter not initialized'
      );
    });
  });
});
