/**
 * Image Upload Handler
 * Validates and processes uploaded images for OCR
 * Requirements: 1.1
 */

import type { ImageSource } from '../types';

/**
 * Supported image MIME types for OCR processing
 */
export const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'application/pdf',
] as const;

export type SupportedImageType = (typeof SUPPORTED_IMAGE_TYPES)[number];

/**
 * Result of image validation
 */
export interface ImageValidationResult {
  valid: boolean;
  error?: string;
  file?: File;
}

/**
 * Result of image processing for OCR
 */
export interface ProcessedImage {
  source: ImageSource;
  originalFile: File;
  type: SupportedImageType;
}

/**
 * Validates that a file is a supported image type for OCR
 */
export function validateImageFile(file: File): ImageValidationResult {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  if (!isSupportedImageType(file.type)) {
    return {
      valid: false,
      error: `Unsupported file type: ${file.type}. Supported types: JPEG, PNG, PDF`,
    };
  }

  // Check for reasonable file size (max 50MB)
  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum size: 50MB`,
    };
  }

  return { valid: true, file };
}

/**
 * Type guard for supported image types
 */
export function isSupportedImageType(type: string): type is SupportedImageType {
  return SUPPORTED_IMAGE_TYPES.includes(type as SupportedImageType);
}

/**
 * Processes an uploaded file for OCR
 * Converts the file to a format suitable for Tesseract.js
 */
export async function processImageForOCR(file: File): Promise<ProcessedImage> {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // For JPEG and PNG, we can pass the file directly to Tesseract
  // For PDF, we need to convert to an image first
  if (file.type === 'application/pdf') {
    // Convert PDF to image using canvas
    const imageSource = await convertPdfToImage(file);
    return {
      source: imageSource,
      originalFile: file,
      type: 'application/pdf',
    };
  }

  // For regular images, use the file directly
  return {
    source: file,
    originalFile: file,
    type: file.type as SupportedImageType,
  };
}

/**
 * Converts a PDF file to an image for OCR processing
 * Uses a simple approach - extracts first page as image
 */
async function convertPdfToImage(file: File): Promise<Blob> {
  // For PDF support, we'll convert to a blob URL that Tesseract can process
  // Note: Full PDF support would require pdf.js library
  // For now, we'll pass the PDF directly to Tesseract which has limited PDF support
  return file;
}

/**
 * Creates a data URL from a file for preview purposes
 */
export function createImagePreviewUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as data URL'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * ImageUploadHandler class for managing image uploads
 */
export class ImageUploadHandler {
  /**
   * Validate an uploaded file
   */
  validate(file: File): ImageValidationResult {
    return validateImageFile(file);
  }

  /**
   * Process an uploaded file for OCR
   */
  async process(file: File): Promise<ProcessedImage> {
    return processImageForOCR(file);
  }

  /**
   * Create a preview URL for an uploaded image
   */
  async createPreview(file: File): Promise<string> {
    return createImagePreviewUrl(file);
  }

  /**
   * Get list of supported file types
   */
  getSupportedTypes(): readonly string[] {
    return SUPPORTED_IMAGE_TYPES;
  }

  /**
   * Get accept string for file input elements
   */
  getAcceptString(): string {
    return SUPPORTED_IMAGE_TYPES.join(',');
  }
}
