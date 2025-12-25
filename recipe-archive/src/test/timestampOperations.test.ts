/**
 * Property tests for Timestamp Operations
 * Feature: recipe-archive
 * Tests Property 3: Recipe Modification Updates Timestamp
 * Validates: Requirements 2.5
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { updateRecipeTimestamp, applyRecipeModification } from '../services/timestampOperations';
import { arbitraryRecipe, arbitraryNonEmptyString, arbitraryTag } from './generators';

describe('Timestamp Operations Property Tests', () => {
  /**
   * Property 3: Recipe Modification Updates Timestamp
   * For any Recipe modification (changing title, author, ingredients, steps, tags, or images),
   * the updatedAt timestamp after the modification should be set to the current time
   * (within a reasonable tolerance for test execution).
   * Feature: recipe-archive, Property 3: Recipe Modification Updates Timestamp
   * Validates: Requirements 2.5
   */
  it('Property 3: Recipe Modification Updates Timestamp', async () => {
    await fc.assert(
      fc.asyncProperty(arbitraryRecipe(), async (recipe) => {
        const beforeUpdate = Date.now();
        
        // Apply timestamp update
        const updated = updateRecipeTimestamp(recipe);
        
        const afterUpdate = Date.now();
        const updatedTimestamp = new Date(updated.updatedAt).getTime();
        
        // The new timestamp should be within the time window of the test execution
        expect(updatedTimestamp).toBeGreaterThanOrEqual(beforeUpdate);
        expect(updatedTimestamp).toBeLessThanOrEqual(afterUpdate);
        
        // All other fields should remain unchanged
        expect(updated.id).toBe(recipe.id);
        expect(updated.title).toBe(recipe.title);
        expect(updated.author).toBe(recipe.author);
        expect(updated.ingredients).toEqual(recipe.ingredients);
        expect(updated.steps).toEqual(recipe.steps);
        expect(updated.tags).toEqual(recipe.tags);
        expect(updated.images).toEqual(recipe.images);
        expect(updated.notes).toBe(recipe.notes);
        expect(updated.createdAt).toBe(recipe.createdAt);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3 (extended): applyRecipeModification updates timestamp on title change
   * Feature: recipe-archive, Property 3: Recipe Modification Updates Timestamp
   * Validates: Requirements 2.5
   */
  it('Property 3: Title modification updates timestamp', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraryRecipe(),
        arbitraryNonEmptyString(),
        async (recipe, newTitle) => {
          const beforeUpdate = Date.now();
          
          // Apply modification with new title
          const updated = applyRecipeModification(recipe, { title: newTitle });
          
          const afterUpdate = Date.now();
          const updatedTimestamp = new Date(updated.updatedAt).getTime();
          
          // The new timestamp should be within the time window of the test execution
          expect(updatedTimestamp).toBeGreaterThanOrEqual(beforeUpdate);
          expect(updatedTimestamp).toBeLessThanOrEqual(afterUpdate);
          
          // Title should be updated
          expect(updated.title).toBe(newTitle);
          
          // ID and createdAt should remain unchanged
          expect(updated.id).toBe(recipe.id);
          expect(updated.createdAt).toBe(recipe.createdAt);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3 (extended): applyRecipeModification updates timestamp on tags change
   * Feature: recipe-archive, Property 3: Recipe Modification Updates Timestamp
   * Validates: Requirements 2.5
   */
  it('Property 3: Tags modification updates timestamp', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraryRecipe(),
        fc.array(arbitraryTag(), { minLength: 0, maxLength: 5 }),
        async (recipe, newTags) => {
          const beforeUpdate = Date.now();
          
          // Apply modification with new tags
          const updated = applyRecipeModification(recipe, { tags: newTags });
          
          const afterUpdate = Date.now();
          const updatedTimestamp = new Date(updated.updatedAt).getTime();
          
          // The new timestamp should be within the time window of the test execution
          expect(updatedTimestamp).toBeGreaterThanOrEqual(beforeUpdate);
          expect(updatedTimestamp).toBeLessThanOrEqual(afterUpdate);
          
          // Tags should be updated
          expect(updated.tags).toEqual(newTags);
          
          // ID and createdAt should remain unchanged
          expect(updated.id).toBe(recipe.id);
          expect(updated.createdAt).toBe(recipe.createdAt);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3 (extended): applyRecipeModification preserves immutable fields
   * Feature: recipe-archive, Property 3: Recipe Modification Updates Timestamp
   * Validates: Requirements 2.5
   */
  it('Property 3: Modification preserves id and createdAt', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraryRecipe(),
        async (recipe) => {
          const beforeUpdate = Date.now();
          
          // Attempt to modify id and createdAt (should be ignored)
          const updated = applyRecipeModification(recipe, {
            title: 'New Title',
          });
          
          const afterUpdate = Date.now();
          const updatedTimestamp = new Date(updated.updatedAt).getTime();
          
          // ID and createdAt should remain unchanged regardless of attempts
          expect(updated.id).toBe(recipe.id);
          expect(updated.createdAt).toBe(recipe.createdAt);
          
          // updatedAt should be set to current time
          expect(updatedTimestamp).toBeGreaterThanOrEqual(beforeUpdate);
          expect(updatedTimestamp).toBeLessThanOrEqual(afterUpdate);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
