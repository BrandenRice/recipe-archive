/**
 * Property tests for Recipe Filtering and Sorting
 * Feature: recipe-archive
 * Tests Properties 6, 7
 * Validates: Requirements 3.3, 3.4, 3.5
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { filterRecipes, sortRecipes } from '../services/recipeFiltering';
import { arbitraryRecipe, arbitraryRecipeFilter } from './generators';

describe('Recipe Filtering and Sorting Property Tests', () => {
  /**
   * Property 6: Filtering Returns Only Matching Recipes
   * For any set of Recipes and any RecipeFilter:
   * - When tagMatchMode is 'and': all Recipes returned should contain ALL specified filter tags
   * - When tagMatchMode is 'or': all Recipes returned should contain AT LEAST ONE of the specified filter tags
   * - When author is specified: all Recipes returned should match the specified author
   * Feature: recipe-archive, Property 6: Filtering Returns Only Matching Recipes
   * Validates: Requirements 3.3, 3.4
   */
  it('Property 6: Filtering Returns Only Matching Recipes', () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryRecipe(), { minLength: 0, maxLength: 20 }),
        arbitraryRecipeFilter(),
        (recipes, filter) => {
          const filtered = filterRecipes(recipes, filter);

          // Verify all returned recipes match the filter criteria
          for (const recipe of filtered) {
            // Check tag filtering
            if (filter.tags && filter.tags.length > 0) {
              const recipeTags = recipe.tags.map(t => t.toLowerCase());
              const filterTags = filter.tags.map(t => t.toLowerCase());

              if (filter.tagMatchMode === 'and') {
                // AND mode: recipe must have ALL specified tags
                const hasAllTags = filterTags.every(tag => recipeTags.includes(tag));
                expect(hasAllTags).toBe(true);
              } else {
                // OR mode: recipe must have AT LEAST ONE of the specified tags
                const hasAnyTag = filterTags.some(tag => recipeTags.includes(tag));
                expect(hasAnyTag).toBe(true);
              }
            }

            // Check author filtering
            if (filter.author !== undefined && filter.author !== null) {
              const recipeAuthor = recipe.author?.toLowerCase() ?? '';
              const filterAuthor = filter.author.toLowerCase();
              expect(recipeAuthor).toBe(filterAuthor);
            }

            // Check text search filtering
            if (filter.searchText !== undefined && filter.searchText !== null && filter.searchText.trim() !== '') {
              const searchLower = filter.searchText.toLowerCase();
              const titleMatch = recipe.title.toLowerCase().includes(searchLower);
              const ingredientsMatch = recipe.ingredients.some(ing =>
                ing.toLowerCase().includes(searchLower)
              );
              const stepsMatch = recipe.steps.some(step =>
                step.toLowerCase().includes(searchLower)
              );
              expect(titleMatch || ingredientsMatch || stepsMatch).toBe(true);
            }
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 7: Sorting Orders Recipes Correctly
   * For any set of Recipes and any sort criteria (title, createdAt, updatedAt, author)
   * with sort order (asc/desc), the Recipes returned by sortRecipes should be ordered
   * such that for any two adjacent Recipes in the result, the first Recipe's sort field
   * value should be less than or equal to (for asc) or greater than or equal to (for desc)
   * the second Recipe's sort field value.
   * Feature: recipe-archive, Property 7: Sorting Orders Recipes Correctly
   * Validates: Requirements 3.5
   */
  it('Property 7: Sorting Orders Recipes Correctly', () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryRecipe(), { minLength: 0, maxLength: 20 }),
        arbitraryRecipeFilter(),
        (recipes, filter) => {
          const sorted = sortRecipes(recipes, filter);

          // Verify the sorted array has the same length as input
          expect(sorted.length).toBe(recipes.length);

          // Verify ordering for adjacent pairs
          for (let i = 0; i < sorted.length - 1; i++) {
            const current = sorted[i];
            const next = sorted[i + 1];

            let currentValue: string;
            let nextValue: string;

            switch (filter.sortBy) {
              case 'title':
                currentValue = current.title;
                nextValue = next.title;
                break;
              case 'createdAt':
                currentValue = current.createdAt;
                nextValue = next.createdAt;
                break;
              case 'updatedAt':
                currentValue = current.updatedAt;
                nextValue = next.updatedAt;
                break;
              case 'author':
                currentValue = current.author ?? '';
                nextValue = next.author ?? '';
                break;
            }

            const comparison = currentValue.localeCompare(nextValue);

            if (filter.sortOrder === 'asc') {
              // For ascending, current should be <= next
              expect(comparison).toBeLessThanOrEqual(0);
            } else {
              // For descending, current should be >= next
              expect(comparison).toBeGreaterThanOrEqual(0);
            }
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
