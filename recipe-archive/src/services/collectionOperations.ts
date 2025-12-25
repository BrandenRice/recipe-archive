/**
 * Collection operations service
 * Requirements: 1.2, 1.3, 1.4, 2.4, 3.3, 3.4, 3.6, 5.2, 5.3, 5.4, 8.3, 8.4, 8.6
 */

import type { Collection, Recipe, ExportData, Template } from '../types';
import { createDefaultTemplates } from './templateOperations';

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validation result type
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate collection name (non-empty, non-whitespace)
 * Requirements: 1.3, 1.4, 3.5
 */
export function validateCollectionName(name: string): ValidationResult {
  if (!name || name.trim().length === 0) {
    return {
      valid: false,
      error: 'Collection name cannot be empty or contain only whitespace',
    };
  }
  return { valid: true };
}

/**
 * Create a new collection
 * Requirements: 1.2
 */
export function createCollection(name: string, description?: string): Collection {
  const now = new Date().toISOString();
  
  return {
    id: generateId(),
    name: name.trim(),
    description: description?.trim() || null,
    recipeIds: [],
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Sort collections alphabetically by name
 * Requirements: 2.4
 */
export function sortCollections(collections: Collection[]): Collection[] {
  return [...collections].sort((a, b) => 
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  );
}

/**
 * Add recipe to collection (prevents duplicates)
 * Requirements: 3.3, 3.6, 8.3, 8.4
 */
export function addRecipeToCollection(collection: Collection, recipeId: string): Collection {
  if (collection.recipeIds.includes(recipeId)) {
    return collection; // Idempotent - no change if already present
  }
  
  return {
    ...collection,
    recipeIds: [...collection.recipeIds, recipeId],
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Remove recipe from collection
 * Requirements: 3.4
 */
export function removeRecipeFromCollection(collection: Collection, recipeId: string): Collection {
  if (!collection.recipeIds.includes(recipeId)) {
    return collection; // No change if not present
  }
  
  return {
    ...collection,
    recipeIds: collection.recipeIds.filter(id => id !== recipeId),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Get collections containing a specific recipe
 * Requirements: 8.6
 */
export function getCollectionsForRecipe(collections: Collection[], recipeId: string): Collection[] {
  return collections.filter(collection => collection.recipeIds.includes(recipeId));
}

/**
 * Export collection recipes to JSON
 * Requirements: 5.3
 */
export function exportCollectionToJSON(collection: Collection, recipes: Recipe[]): ExportData {
  const collectionRecipes = recipes.filter(recipe => 
    collection.recipeIds.includes(recipe.id)
  );
  
  // Extract unique tags from collection recipes
  const tags = [...new Set(collectionRecipes.flatMap(recipe => recipe.tags))];
  
  return {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    recipes: collectionRecipes,
    templates: [],
    tags,
    collections: [collection],
  };
}


/**
 * Export result for collection PDF export
 */
export interface CollectionPDFExportResult {
  success: boolean;
  blob?: Blob;
  error?: string;
  recipesExported: number;
}

/**
 * Export collection recipes to PDF
 * Requirements: 5.2, 5.4
 * 
 * Generates a PDF containing all recipes in the collection using the default template.
 * Returns an error message if the collection is empty.
 */
export async function exportCollectionToPDF(
  collection: Collection,
  recipes: Recipe[],
  customTemplate?: Template
): Promise<CollectionPDFExportResult> {
  // Filter recipes to only those in this collection
  const collectionRecipes = recipes.filter(recipe => 
    collection.recipeIds.includes(recipe.id)
  );
  
  // Handle empty collection case (Requirement 5.4)
  if (collectionRecipes.length === 0) {
    return {
      success: false,
      error: 'No recipes to export. Add recipes to this collection first.',
      recipesExported: 0,
    };
  }
  
  try {
    // Get the default template (Letter size) or use custom template
    const template = customTemplate || getDefaultTemplate();
    
    // For a single recipe, export directly using createMultiRecipePDF (works for 1 recipe too)
    const blob = await createMultiRecipePDF(collectionRecipes, template);
    
    return {
      success: true,
      blob,
      recipesExported: collectionRecipes.length,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to generate PDF',
      recipesExported: 0,
    };
  }
}

/**
 * Get the default template for PDF export
 * Uses Letter size as the default
 */
function getDefaultTemplate(): Template {
  const defaultTemplates = createDefaultTemplates();
  // Prefer Letter size, fall back to first available
  return defaultTemplates.find(t => t.size.name === 'Letter') || defaultTemplates[0];
}

/**
 * Create a multi-page PDF with all recipes
 * Each recipe gets its own page
 */
async function createMultiRecipePDF(
  recipes: Recipe[],
  template: Template
): Promise<Blob> {
  // Import jsPDF for multi-page document creation
  const { jsPDF } = await import('jspdf');
  
  const { width, height } = template.size;
  const doc = new jsPDF({
    orientation: width > height ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [width, height],
  });
  
  for (let i = 0; i < recipes.length; i++) {
    if (i > 0) {
      doc.addPage([width, height], width > height ? 'landscape' : 'portrait');
    }
    
    // Render recipe to current page
    renderRecipeToPage(doc, recipes[i], template);
  }
  
  return doc.output('blob');
}

/**
 * Render a single recipe to the current page of a jsPDF document
 */
function renderRecipeToPage(doc: InstanceType<typeof import('jspdf').jsPDF>, recipe: Recipe, template: Template): void {
  const { width, height } = template.size;
  const { margins } = template;
  
  // Calculate printable area
  const printableWidth = width - margins.left - margins.right;
  const printableHeight = height - margins.top - margins.bottom;
  
  // Sort sections by zIndex for proper layering
  const sortedSections = [...template.sections].sort((a, b) => a.zIndex - b.zIndex);
  
  for (const section of sortedSections) {
    renderSection(doc, section, recipe, {
      printableWidth,
      printableHeight,
      marginLeft: margins.left,
      marginTop: margins.top,
    });
  }
}

/**
 * Render a single template section to the document
 */
function renderSection(
  doc: InstanceType<typeof import('jspdf').jsPDF>,
  section: import('../types').TemplateSection,
  recipe: Recipe,
  bounds: { printableWidth: number; printableHeight: number; marginLeft: number; marginTop: number }
): void {
  const { printableWidth, printableHeight, marginLeft, marginTop } = bounds;
  
  // Convert percentage positions to absolute positions
  const x = marginLeft + (section.position.x / 100) * printableWidth;
  const y = marginTop + (section.position.y / 100) * printableHeight;
  const sectionWidth = (section.size.width / 100) * printableWidth;
  const sectionHeight = (section.size.height / 100) * printableHeight;
  
  // Apply background color if specified
  if (section.style.backgroundColor) {
    const bgColor = hexToRgb(section.style.backgroundColor);
    doc.setFillColor(bgColor.r, bgColor.g, bgColor.b);
    doc.rect(x, y, sectionWidth, sectionHeight, 'F');
  }
  
  // Apply border if specified
  if (section.style.border) {
    const borderColor = hexToRgb(section.style.border.color);
    doc.setDrawColor(borderColor.r, borderColor.g, borderColor.b);
    doc.setLineWidth(section.style.border.width * 0.35);
    doc.rect(x, y, sectionWidth, sectionHeight, 'S');
  }
  
  // Get content for this section
  const content = getSectionContent(section.type, recipe);
  if (!content) return;
  
  // Apply text styling
  const textColor = hexToRgb(section.style.color);
  doc.setTextColor(textColor.r, textColor.g, textColor.b);
  doc.setFontSize(section.style.fontSize);
  
  // Set font weight
  if (section.style.fontWeight === 'bold') {
    doc.setFont(section.style.fontFamily, 'bold');
  } else {
    doc.setFont(section.style.fontFamily, 'normal');
  }
  
  // Calculate text position with padding
  const padding = section.style.padding;
  const textX = x + padding;
  const textY = y + padding + section.style.fontSize * 0.35;
  const maxWidth = sectionWidth - (padding * 2);
  
  // Render text with alignment
  const lines = doc.splitTextToSize(content, maxWidth);
  let currentY = textY;
  
  for (const line of lines) {
    let lineX = textX;
    
    if (section.style.textAlign === 'center') {
      const lineWidth = doc.getTextWidth(line);
      lineX = x + (sectionWidth - lineWidth) / 2;
    } else if (section.style.textAlign === 'right') {
      const lineWidth = doc.getTextWidth(line);
      lineX = x + sectionWidth - padding - lineWidth;
    }
    
    doc.text(line, lineX, currentY);
    currentY += section.style.fontSize * 0.4;
  }
}

/**
 * Get the content for a specific section type from the recipe
 */
function getSectionContent(type: import('../types').TemplateSection['type'], recipe: Recipe): string {
  switch (type) {
    case 'title':
      return recipe.title;
    case 'author':
      return recipe.author || '';
    case 'ingredients':
      return recipe.ingredients.map((ing, i) => `${i + 1}. ${ing}`).join('\n');
    case 'steps':
      return recipe.steps.map((step, i) => `${i + 1}. ${step}`).join('\n');
    case 'notes':
      return recipe.notes || '';
    case 'image':
      return '';
    default:
      return '';
  }
}

/**
 * Convert hex color string to RGB values
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    };
  }
  return { r: 0, g: 0, b: 0 };
}

/**
 * Trigger download of a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
