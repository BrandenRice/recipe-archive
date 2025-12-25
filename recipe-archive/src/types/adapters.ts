/**
 * Adapter interfaces for storage, OCR, and export operations
 */

import type { Recipe, RecipeFilter } from './recipe';
import type { Template, PrintSize } from './template';

/**
 * Storage Adapter Interface
 * Defines an abstract interface for all data operations (create, read, update, delete, list)
 * Can be implemented for local storage or cloud backends
 */
export interface StorageAdapter {
  // Recipe operations
  createRecipe(recipe: Recipe): Promise<Recipe>;
  getRecipe(id: string): Promise<Recipe | null>;
  updateRecipe(id: string, recipe: Partial<Recipe>): Promise<Recipe>;
  deleteRecipe(id: string): Promise<void>;
  listRecipes(filter?: RecipeFilter): Promise<Recipe[]>;

  // Template operations
  createTemplate(template: Template): Promise<Template>;
  getTemplate(id: string): Promise<Template | null>;
  updateTemplate(id: string, template: Partial<Template>): Promise<Template>;
  deleteTemplate(id: string): Promise<void>;
  listTemplates(): Promise<Template[]>;

  // Bulk operations
  exportAll(): Promise<ExportData>;
  importAll(data: ExportData): Promise<ImportResult>;
}

/**
 * OCR Adapter Interface
 * Can be implemented by client-side or cloud-based OCR services
 */
export interface OCRAdapter {
  initialize(): Promise<void>;
  recognizeText(image: ImageSource): Promise<OCRResult>;
  terminate(): Promise<void>;
}

export type ImageSource = File | Blob | string; // string for base64 or URL

export interface OCRResult {
  text: string;
  confidence: number;
  inferredAuthor: string | null;
  blocks: TextBlock[];
}

export interface TextBlock {
  text: string;
  boundingBox: BoundingBox;
  confidence: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}


/**
 * Export Adapter Interface
 * Defines an abstract interface for generating output formats
 */
export interface ExportAdapter {
  exportToPDF(recipe: Recipe, template: Template): Promise<Blob>;
  exportToDOCX(recipe: Recipe, template: Template): Promise<Blob>;
  generatePrintDocument(
    recipe: Recipe,
    template: Template,
    options: PrintOptions
  ): Promise<Blob>;
}

export interface PrintOptions {
  size: PrintSize;
  duplexMode: 'simplex' | 'duplex-long' | 'duplex-short';
  copies: number;
}

/**
 * Export/Import data structures
 */
export interface ExportData {
  version: string;
  exportedAt: string;
  recipes: Recipe[];
  templates: Template[];
  tags: string[];
}

export interface ImportResult {
  success: boolean;
  recipesImported: number;
  templatesImported: number;
  errors: ImportError[];
}

export interface ImportError {
  type: 'recipe' | 'template';
  id: string;
  message: string;
}
