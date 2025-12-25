/**
 * Backup Operations Service
 * Provides JSON export and import functionality for recipe data backup
 * Requirements: 7.4, 7.5, 7.3 (collections)
 */

import type { Recipe } from '../types/recipe';
import type { Template } from '../types/template';
import type { Collection } from '../types/collection';
import type { ExportData, ImportResult, ImportError } from '../types/adapters';

/** Current export format version */
const EXPORT_VERSION = '1.0.0';

/**
 * Exports recipes, templates, and collections to a JSON backup format
 * Generates ExportData with version, timestamp, all recipes, templates, and collections
 * Requirements: 7.4, 7.3
 * 
 * @param recipes - Array of recipes to export
 * @param templates - Array of templates to export
 * @param collections - Optional array of collections to export
 * @returns ExportData object ready for JSON serialization
 */
export function exportToJSON(
  recipes: Recipe[],
  templates: Template[],
  collections?: Collection[]
): ExportData {
  // Collect all unique tags from recipes
  const tagsSet = new Set<string>();
  recipes.forEach(recipe => {
    recipe.tags.forEach(tag => tagsSet.add(tag));
  });

  return {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    recipes: recipes,
    templates: templates,
    tags: Array.from(tagsSet).sort(),
    collections: collections,
  };
}

/**
 * Validates that a value is a valid Recipe object
 */
function isValidRecipe(value: unknown): value is Recipe {
  if (typeof value !== 'object' || value === null) return false;
  
  const obj = value as Record<string, unknown>;
  
  return (
    typeof obj.id === 'string' &&
    typeof obj.title === 'string' &&
    (obj.author === null || typeof obj.author === 'string') &&
    Array.isArray(obj.ingredients) &&
    obj.ingredients.every((i: unknown) => typeof i === 'string') &&
    Array.isArray(obj.steps) &&
    obj.steps.every((s: unknown) => typeof s === 'string') &&
    (obj.notes === null || typeof obj.notes === 'string') &&
    Array.isArray(obj.images) &&
    Array.isArray(obj.tags) &&
    obj.tags.every((t: unknown) => typeof t === 'string') &&
    (obj.sourceImage === null || typeof obj.sourceImage === 'string') &&
    typeof obj.createdAt === 'string' &&
    typeof obj.updatedAt === 'string'
  );
}

/**
 * Validates that a value is a valid Template object
 */
function isValidTemplate(value: unknown): value is Template {
  if (typeof value !== 'object' || value === null) return false;
  
  const obj = value as Record<string, unknown>;
  
  return (
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.size === 'object' && obj.size !== null &&
    typeof obj.isDefault === 'boolean' &&
    Array.isArray(obj.sections) &&
    typeof obj.margins === 'object' && obj.margins !== null &&
    typeof obj.createdAt === 'string' &&
    typeof obj.updatedAt === 'string'
  );
}

/**
 * Validates that a value is a valid Collection object
 * Requirements: 7.4
 */
function isValidCollection(value: unknown): value is Collection {
  if (typeof value !== 'object' || value === null) return false;
  
  const obj = value as Record<string, unknown>;
  
  return (
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    (obj.description === null || typeof obj.description === 'string') &&
    Array.isArray(obj.recipeIds) &&
    obj.recipeIds.every((id: unknown) => typeof id === 'string') &&
    typeof obj.createdAt === 'string' &&
    typeof obj.updatedAt === 'string'
  );
}

/**
 * Validates the structure of ExportData
 */
function validateExportDataStructure(data: unknown): data is ExportData {
  if (typeof data !== 'object' || data === null) return false;
  
  const obj = data as Record<string, unknown>;
  
  return (
    typeof obj.version === 'string' &&
    typeof obj.exportedAt === 'string' &&
    Array.isArray(obj.recipes) &&
    Array.isArray(obj.templates) &&
    Array.isArray(obj.tags)
  );
}

/**
 * Imports recipes, templates, and collections from a JSON backup
 * Validates schema, handles duplicate IDs, returns ImportResult with details
 * Requirements: 7.5, 7.4
 * 
 * @param jsonData - Raw JSON data (string or parsed object)
 * @param existingRecipeIds - Set of existing recipe IDs to detect duplicates
 * @param existingTemplateIds - Set of existing template IDs to detect duplicates
 * @returns ImportResult with validated recipes, templates, collections, and any errors
 */
export function importFromJSON(
  jsonData: string | unknown,
  _existingRecipeIds: Set<string> = new Set(),
  _existingTemplateIds: Set<string> = new Set()
): ImportResult & { recipes: Recipe[]; templates: Template[]; collections: Collection[] } {
  const errors: ImportError[] = [];
  const validRecipes: Recipe[] = [];
  const validTemplates: Template[] = [];
  const validCollections: Collection[] = [];

  // Parse JSON if string
  let data: unknown;
  try {
    data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
  } catch {
    return {
      success: false,
      recipesImported: 0,
      templatesImported: 0,
      collectionsImported: 0,
      errors: [{ type: 'recipe', id: '', message: 'Invalid JSON format' }],
      recipes: [],
      templates: [],
      collections: [],
    };
  }

  // Validate basic structure
  if (!validateExportDataStructure(data)) {
    return {
      success: false,
      recipesImported: 0,
      templatesImported: 0,
      collectionsImported: 0,
      errors: [{ type: 'recipe', id: '', message: 'Invalid export data structure' }],
      recipes: [],
      templates: [],
      collections: [],
    };
  }

  // Track IDs seen in this import to detect duplicates within the import file
  const seenRecipeIds = new Set<string>();
  const seenTemplateIds = new Set<string>();
  const seenCollectionIds = new Set<string>();

  // Validate and collect recipes
  for (const recipe of data.recipes) {
    if (!isValidRecipe(recipe)) {
      errors.push({
        type: 'recipe',
        id: (recipe as Record<string, unknown>)?.id?.toString() || 'unknown',
        message: 'Invalid recipe schema: missing required fields',
      });
      continue;
    }

    // Check for duplicate ID within import file
    if (seenRecipeIds.has(recipe.id)) {
      errors.push({
        type: 'recipe',
        id: recipe.id,
        message: 'Duplicate recipe ID in import file',
      });
      continue;
    }
    seenRecipeIds.add(recipe.id);

    // Note: existing duplicates are handled by the storage adapter (update vs create)
    validRecipes.push(recipe);
  }

  // Validate and collect templates
  for (const template of data.templates) {
    if (!isValidTemplate(template)) {
      errors.push({
        type: 'template',
        id: (template as Record<string, unknown>)?.id?.toString() || 'unknown',
        message: 'Invalid template schema: missing required fields',
      });
      continue;
    }

    // Check for duplicate ID within import file
    if (seenTemplateIds.has(template.id)) {
      errors.push({
        type: 'template',
        id: template.id,
        message: 'Duplicate template ID in import file',
      });
      continue;
    }
    seenTemplateIds.add(template.id);

    // Note: existing duplicates are handled by the storage adapter (update vs create)
    validTemplates.push(template);
  }

  // Validate and collect collections (if present in export data)
  if (data.collections && Array.isArray(data.collections)) {
    for (const collection of data.collections) {
      if (!isValidCollection(collection)) {
        errors.push({
          type: 'collection',
          id: (collection as Record<string, unknown>)?.id?.toString() || 'unknown',
          message: 'Invalid collection schema: missing required fields',
        });
        continue;
      }

      // Check for duplicate ID within import file
      if (seenCollectionIds.has(collection.id)) {
        errors.push({
          type: 'collection',
          id: collection.id,
          message: 'Duplicate collection ID in import file',
        });
        continue;
      }
      seenCollectionIds.add(collection.id);

      // Note: existing duplicates are handled by the storage adapter (update vs create)
      validCollections.push(collection);
    }
  }

  return {
    success: errors.length === 0,
    recipesImported: validRecipes.length,
    templatesImported: validTemplates.length,
    collectionsImported: validCollections.length,
    errors,
    recipes: validRecipes,
    templates: validTemplates,
    collections: validCollections,
  };
}

/**
 * Creates a downloadable JSON file from ExportData
 * 
 * @param exportData - The export data to convert to a downloadable blob
 * @returns Blob containing the JSON data
 */
export function createExportBlob(exportData: ExportData): Blob {
  const jsonString = JSON.stringify(exportData, null, 2);
  return new Blob([jsonString], { type: 'application/json' });
}

/**
 * Generates a filename for the export based on current date
 * 
 * @returns Filename string in format "recipe-archive-backup-YYYY-MM-DD.json"
 */
export function generateExportFilename(): string {
  const date = new Date().toISOString().split('T')[0];
  return `recipe-archive-backup-${date}.json`;
}
