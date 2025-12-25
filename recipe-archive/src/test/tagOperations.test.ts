/**
 * Property tests for Tag Operations
 * Feature: recipe-archive
 * Tests Properties 4, 5
 * Validates: Requirements 3.1, 3.2
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { addTag, removeTag, validateTag } from '../services/tagOperations';
import { arbitraryRecipe, arbitraryTag } from './generators';

describe('Tag Operations Property Tests', () => {
  /**
   * Property 4: Tag Addition Associates Tag
   * For any Recipe and any valid tag string, after adding the tag to the Recipe,
   * the Recipe's tags array should contain that tag.
   * Feature: recipe-archive, Property 4: Tag Addition Associates Tag
   * Validates: Requirements 3.1
   */
  it('Property 4: Tag Addition Associates Tag', () => {
    fc.assert(
      fc.property(
        arbitraryRecipe(),
        arbitraryTag(),
        (recipe, tag) => {
          const updatedRecipe = addTag(recipe, tag);
          
          // The tag should be present in the updated recipe's tags (case-insensitive)
          const normalizedTag = tag.trim().toLowerCase();
          const tagsLower = updatedRecipe.tags.map(t => t.toLowerCase());
          
          expect(tagsLower).toContain(normalizedTag);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5: Tag Removal Disassociates Tag
   * For any Recipe with one or more tags, after removing a specific tag from the Recipe,
   * the Recipe's tags array should not contain that tag.
   * Feature: recipe-archive, Property 5: Tag Removal Disassociates Tag
   * Validates: Requirements 3.2
   */
  it('Property 5: Tag Removal Disassociates Tag', () => {
    fc.assert(
      fc.property(
        arbitraryRecipe().filter(r => r.tags.length > 0),
        (recipe) => {
          // Pick a random tag from the recipe to remove
          const tagToRemove = recipe.tags[Math.floor(Math.random() * recipe.tags.length)];
          const updatedRecipe = removeTag(recipe, tagToRemove);
          
          // The tag should not be present in the updated recipe's tags (case-insensitive)
          const normalizedTag = tagToRemove.trim().toLowerCase();
          const tagsLower = updatedRecipe.tags.map(t => t.toLowerCase());
          
          expect(tagsLower).not.toContain(normalizedTag);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
