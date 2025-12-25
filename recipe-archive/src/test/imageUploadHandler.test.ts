/**
 * Unit tests for Image Upload Handler
 * Tests file validation and processing
 * Requirements: 1.1
 */

import { describe, it, expect } from 'vitest';
import {
  validateImageFile,
  isSupportedImageType,
  ImageUploadHandler,
  SUPPORTED_IMAGE_TYPES,
} from '../services/imageUploadHandler';

describe('ImageUploadHandler', () => {
  describe('validateImageFile', () => {
    it('should accept JPEG files', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const result = validateImageFile(file);
      expect(result.valid).toBe(true);
      expect(result.file).toBe(file);
    });

    it('should accept PNG files', () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' });
      const result = validateImageFile(file);
      expect(result.valid).toBe(true);
    });

    it('should accept PDF files', () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const result = validateImageFile(file);
      expect(result.valid).toBe(true);
    });

    it('should reject unsupported file types', () => {
      const file = new File(['test'], 'test.gif', { type: 'image/gif' });
      const result = validateImageFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unsupported file type');
    });

    it('should reject files that are too large', () => {
      // Create a mock file with size > 50MB
      const largeContent = new ArrayBuffer(51 * 1024 * 1024);
      const file = new File([largeContent], 'large.jpg', { type: 'image/jpeg' });
      const result = validateImageFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('File too large');
    });
  });

  describe('isSupportedImageType', () => {
    it('should return true for image/jpeg', () => {
      expect(isSupportedImageType('image/jpeg')).toBe(true);
    });

    it('should return true for image/png', () => {
      expect(isSupportedImageType('image/png')).toBe(true);
    });

    it('should return true for application/pdf', () => {
      expect(isSupportedImageType('application/pdf')).toBe(true);
    });

    it('should return false for unsupported types', () => {
      expect(isSupportedImageType('image/gif')).toBe(false);
      expect(isSupportedImageType('image/webp')).toBe(false);
      expect(isSupportedImageType('text/plain')).toBe(false);
    });
  });

  describe('ImageUploadHandler class', () => {
    const handler = new ImageUploadHandler();

    it('should validate files correctly', () => {
      const validFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const result = handler.validate(validFile);
      expect(result.valid).toBe(true);
    });

    it('should return supported types', () => {
      const types = handler.getSupportedTypes();
      expect(types).toEqual(SUPPORTED_IMAGE_TYPES);
    });

    it('should return accept string for file inputs', () => {
      const acceptString = handler.getAcceptString();
      expect(acceptString).toContain('image/jpeg');
      expect(acceptString).toContain('image/png');
      expect(acceptString).toContain('application/pdf');
    });
  });
});
