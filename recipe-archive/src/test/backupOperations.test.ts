/**
 * Property tests for Backup Operations (Import/Export)
 * Feature: recipe-archive
 * Tests Property 14: Export/Import Round-Trip Preserves Data
 * Validates: Requirements 7.4, 7.5
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { exportToJSON, importFromJSON } from '../services/backupOperations';
import { arbitraryRecipe, arbitraryNonDefaultTemplate } from './generators';

describe('Backup Operations Property Tests', () => {
  /**
   * Property 14: Export/Import Round-Trip Preserves Data
   * For any collection of Recipes and Templates, exporting to JSON and then
   * importing from that JSON should result in an equivalent collection
   * (same number of recipes and templates, with matching content).
   * Feature: recipe-archive, Property 14: Export/Import Round-Trip Preserves Data
   * Validates: Requirements 7.4, 7.5
   */
  it('Property 14: Export/Import Round-Trip Preserves Data', () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryRecipe(), { minLength: 0, maxLength: 10 })
          // Ensure unique IDs
          .map(recipes => {
            const seen = new Set<string>();
            return recipes.filter(r => {
              if (seen.has(r.id)) return false;
              seen.add(r.id);
              return true;
            });
          }),
        fc.array(arbitraryNonDefaultTemplate(), { minLength: 0, maxLength: 5 })
          // Ensure unique IDs
          .map(templates => {
            const seen = new Set<string>();
            return templates.filter(t => {
              if (seen.has(t.id)) return false;
              seen.add(t.id);
              return true;
            });
          }),
        (recipes, templates) => {
          // Export to JSON
          const exportData = exportToJSON(recipes, templates);

          // Verify export structure
          expect(exportData.version).toBe('1.0.0');
          expect(exportData.exportedAt).toBeDefined();
          expect(exportData.recipes.length).toBe(recipes.length);
          expect(exportData.templates.length).toBe(templates.length);

          // Convert to JSON string and back (simulating file save/load)
          const jsonString = JSON.stringify(exportData);
          
          // Import from JSON
          const importResult = importFromJSON(jsonString);

          // Verify import success
          expect(importResult.success).toBe(true);
          expect(importResult.errors).toHaveLength(0);
          expect(importResult.recipesImported).toBe(recipes.length);
          expect(importResult.templatesImported).toBe(templates.length);

          // Verify recipe count matches
          expect(importResult.recipes.length).toBe(recipes.length);

          // Verify each recipe is preserved
          for (const originalRecipe of recipes) {
            const importedRecipe = importResult.recipes.find(r => r.id === originalRecipe.id);
            expect(importedRecipe).toBeDefined();
            expect(importedRecipe!.title).toBe(originalRecipe.title);
            expect(importedRecipe!.author).toBe(originalRecipe.author);
            expect(importedRecipe!.ingredients).toEqual(originalRecipe.ingredients);
            expect(importedRecipe!.steps).toEqual(originalRecipe.steps);
            expect(importedRecipe!.tags).toEqual(originalRecipe.tags);
            expect(importedRecipe!.notes).toBe(originalRecipe.notes);
            expect(importedRecipe!.createdAt).toBe(originalRecipe.createdAt);
            expect(importedRecipe!.updatedAt).toBe(originalRecipe.updatedAt);
          }

          // Verify template count matches
          expect(importResult.templates.length).toBe(templates.length);

          // Verify each template is preserved
          for (const originalTemplate of templates) {
            const importedTemplate = importResult.templates.find(t => t.id === originalTemplate.id);
            expect(importedTemplate).toBeDefined();
            expect(importedTemplate!.name).toBe(originalTemplate.name);
            expect(importedTemplate!.size).toEqual(originalTemplate.size);
            expect(importedTemplate!.isDefault).toBe(originalTemplate.isDefault);
            expect(importedTemplate!.sections).toEqual(originalTemplate.sections);
            expect(importedTemplate!.margins).toEqual(originalTemplate.margins);
            expect(importedTemplate!.createdAt).toBe(originalTemplate.createdAt);
            expect(importedTemplate!.updatedAt).toBe(originalTemplate.updatedAt);
          }

          // Verify tags are collected correctly
          const expectedTags = new Set<string>();
          recipes.forEach(r => r.tags.forEach(t => expectedTags.add(t)));
          expect(new Set(exportData.tags)).toEqual(expectedTags);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
