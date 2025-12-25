/**
 * Property tests for Recipe data model generators
 * Feature: recipe-archive, Property 1: Recipe Persistence Round-Trip (generator validation)
 * Validates: Requirements 2.2, 7.1
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { arbitraryRecipe, arbitraryRecipeFilter } from './generators';

describe('Recipe Generator', () => {
  /**
   * Property 1: Recipe Persistence Round-Trip (generator only)
   * For any generated Recipe, it should have all required fields with valid values
   * The actual storage round-trip will be tested in task 2.3
   */
  it('generates valid Recipe objects with all required fields', () => {
    fc.assert(
      fc.property(arbitraryRecipe(), (recipe) => {
        // Verify all required fields exist
        expect(recipe.id).toBeDefined();
        expect(typeof recipe.id).toBe('string');
        expect(recipe.id.length).toBeGreaterThan(0);

        expect(recipe.title).toBeDefined();
        expect(typeof recipe.title).toBe('string');
        expect(recipe.title.trim().length).toBeGreaterThan(0);

        expect(recipe.author === null || typeof recipe.author === 'string').toBe(true);
        if (recipe.author !== null) {
          expect(recipe.author.trim().length).toBeGreaterThan(0);
        }

        expect(Array.isArray(recipe.ingredients)).toBe(true);
        expect(recipe.ingredients.length).toBeGreaterThan(0);
        recipe.ingredients.forEach(ing => {
          expect(typeof ing).toBe('string');
          expect(ing.trim().length).toBeGreaterThan(0);
        });

        expect(Array.isArray(recipe.steps)).toBe(true);
        expect(recipe.steps.length).toBeGreaterThan(0);
        recipe.steps.forEach(step => {
          expect(typeof step).toBe('string');
          expect(step.trim().length).toBeGreaterThan(0);
        });

        expect(recipe.notes === null || typeof recipe.notes === 'string').toBe(true);

        expect(Array.isArray(recipe.images)).toBe(true);
        recipe.images.forEach(img => {
          expect(img.id).toBeDefined();
          expect(typeof img.data).toBe('string');
          expect(['inline', 'header', 'footer']).toContain(img.position);
        });

        expect(Array.isArray(recipe.tags)).toBe(true);

        expect(recipe.sourceImage === null || typeof recipe.sourceImage === 'string').toBe(true);

        // Verify timestamps are valid ISO 8601
        expect(typeof recipe.createdAt).toBe('string');
        expect(new Date(recipe.createdAt).toISOString()).toBe(recipe.createdAt);

        expect(typeof recipe.updatedAt).toBe('string');
        expect(new Date(recipe.updatedAt).toISOString()).toBe(recipe.updatedAt);

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('generates valid RecipeFilter objects', () => {
    fc.assert(
      fc.property(arbitraryRecipeFilter(), (filter) => {
        expect(['and', 'or']).toContain(filter.tagMatchMode);
        expect(['title', 'createdAt', 'updatedAt', 'author']).toContain(filter.sortBy);
        expect(['asc', 'desc']).toContain(filter.sortOrder);

        if (filter.tags !== undefined) {
          expect(Array.isArray(filter.tags)).toBe(true);
        }

        if (filter.author !== undefined) {
          expect(typeof filter.author).toBe('string');
        }

        if (filter.searchText !== undefined) {
          expect(typeof filter.searchText).toBe('string');
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });
});
