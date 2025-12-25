/**
 * Property tests for Storage Adapter operations
 * Feature: recipe-archive
 * Tests Properties 1, 2, 8, 15
 * Validates: Requirements 2.2, 2.3, 4.2, 7.1, 7.2
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { LocalStorageAdapter } from '../adapters/LocalStorageAdapter';
import { arbitraryRecipe, arbitraryTemplate } from './generators';

/**
 * Test suite for storage adapters
 * Uses LocalStorageAdapter for testing since IndexedDB requires browser environment
 * Both adapters implement the same interface and logic
 */
describe('Storage Adapter Property Tests', () => {
  let storage: LocalStorageAdapter;

  beforeEach(() => {
    storage = new LocalStorageAdapter();
  });

  afterEach(async () => {
    await storage.clear();
  });

  /**
   * Property 1: Recipe Persistence Round-Trip
   * For any valid Recipe object, saving it to the Storage_Adapter and then
   * retrieving it by ID should produce an equivalent Recipe object
   * Feature: recipe-archive, Property 1: Recipe Persistence Round-Trip
   * Validates: Requirements 2.2, 7.1
   */
  it('Property 1: Recipe Persistence Round-Trip', async () => {
    await fc.assert(
      fc.asyncProperty(arbitraryRecipe(), async (recipe) => {
        // Save the recipe
        await storage.createRecipe(recipe);

        // Retrieve the recipe
        const retrieved = await storage.getRecipe(recipe.id);

        // Verify round-trip equivalence
        expect(retrieved).not.toBeNull();
        expect(retrieved!.id).toBe(recipe.id);
        expect(retrieved!.title).toBe(recipe.title);
        expect(retrieved!.author).toBe(recipe.author);
        expect(retrieved!.ingredients).toEqual(recipe.ingredients);
        expect(retrieved!.steps).toEqual(recipe.steps);
        expect(retrieved!.tags).toEqual(recipe.tags);
        expect(retrieved!.images).toEqual(recipe.images);
        expect(retrieved!.notes).toBe(recipe.notes);
        expect(retrieved!.sourceImage).toBe(recipe.sourceImage);
        expect(retrieved!.createdAt).toBe(recipe.createdAt);
        expect(retrieved!.updatedAt).toBe(recipe.updatedAt);

        // Clean up for next iteration
        await storage.deleteRecipe(recipe.id);

        return true;
      }),
      { numRuns: 100 }
    );
  });


  /**
   * Property 2: Recipe Deletion Removes Recipe
   * For any Recipe that exists in storage, after deletion, attempting to retrieve
   * that Recipe by ID should return null, and the Recipe should not appear in listRecipes results
   * Feature: recipe-archive, Property 2: Recipe Deletion Removes Recipe
   * Validates: Requirements 2.3
   */
  it('Property 2: Recipe Deletion Removes Recipe', async () => {
    await fc.assert(
      fc.asyncProperty(arbitraryRecipe(), async (recipe) => {
        // Create the recipe
        await storage.createRecipe(recipe);

        // Verify it exists
        const beforeDelete = await storage.getRecipe(recipe.id);
        expect(beforeDelete).not.toBeNull();

        // Delete the recipe
        await storage.deleteRecipe(recipe.id);

        // Verify getRecipe returns null
        const afterDelete = await storage.getRecipe(recipe.id);
        expect(afterDelete).toBeNull();

        // Verify recipe is not in listRecipes
        const allRecipes = await storage.listRecipes();
        const found = allRecipes.find(r => r.id === recipe.id);
        expect(found).toBeUndefined();

        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 8: Template Persistence Round-Trip
   * For any valid Template object, saving it to the Storage_Adapter and then
   * retrieving it by ID should produce an equivalent Template object
   * Feature: recipe-archive, Property 8: Template Persistence Round-Trip
   * Validates: Requirements 4.2
   */
  it('Property 8: Template Persistence Round-Trip', async () => {
    await fc.assert(
      fc.asyncProperty(arbitraryTemplate(), async (template) => {
        // Save the template
        await storage.createTemplate(template);

        // Retrieve the template
        const retrieved = await storage.getTemplate(template.id);

        // Verify round-trip equivalence
        expect(retrieved).not.toBeNull();
        expect(retrieved!.id).toBe(template.id);
        expect(retrieved!.name).toBe(template.name);
        expect(retrieved!.size).toEqual(template.size);
        expect(retrieved!.isDefault).toBe(template.isDefault);
        expect(retrieved!.sections).toEqual(template.sections);
        expect(retrieved!.margins).toEqual(template.margins);
        expect(retrieved!.createdAt).toBe(template.createdAt);
        expect(retrieved!.updatedAt).toBe(template.updatedAt);

        // Clean up for next iteration (only if not default)
        if (!template.isDefault) {
          await storage.deleteTemplate(template.id);
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 15: All Saved Recipes Are Retrievable
   * For any set of Recipes saved to storage, calling listRecipes() with no filter
   * should return all saved Recipes
   * Feature: recipe-archive, Property 15: All Saved Recipes Are Retrievable
   * Validates: Requirements 7.2
   */
  it('Property 15: All Saved Recipes Are Retrievable', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(arbitraryRecipe(), { minLength: 1, maxLength: 10 })
          // Ensure unique IDs
          .map(recipes => {
            const seen = new Set<string>();
            return recipes.filter(r => {
              if (seen.has(r.id)) return false;
              seen.add(r.id);
              return true;
            });
          })
          .filter(recipes => recipes.length > 0),
        async (recipes) => {
          // Save all recipes
          for (const recipe of recipes) {
            await storage.createRecipe(recipe);
          }

          // List all recipes
          const allRecipes = await storage.listRecipes();

          // Verify count matches
          expect(allRecipes.length).toBe(recipes.length);

          // Verify each saved recipe is present
          for (const recipe of recipes) {
            const found = allRecipes.find(r => r.id === recipe.id);
            expect(found).toBeDefined();
            expect(found!.title).toBe(recipe.title);
          }

          // Clean up
          for (const recipe of recipes) {
            await storage.deleteRecipe(recipe.id);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
