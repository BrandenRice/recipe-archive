/**
 * Tag operations for recipes
 * Requirements: 3.1, 3.2, 3.6
 */

import type { Recipe } from '../types';

/**
 * Validates a tag string
 * - Must be non-empty after trimming
 * - Returns the trimmed, lowercase tag if valid
 * - Throws an error if invalid
 * 
 * Requirements: 3.6
 */
export function validateTag(tag: string): string {
  if (typeof tag !== 'string') {
    throw new Error('Tag must be a string');
  }
  
  const trimmed = tag.trim();
  
  if (trimmed.length === 0) {
    throw new Error('Tag cannot be empty or whitespace only');
  }
  
  return trimmed.toLowerCase();
}

/**
 * Adds a tag to a recipe
 * - Validates the tag (non-empty, trimmed)
 * - Normalizes to lowercase
 * - Prevents duplicate tags
 * - Returns a new Recipe object with the tag added
 * 
 * Requirements: 3.1, 3.6
 */
export function addTag(recipe: Recipe, tag: string): Recipe {
  const validatedTag = validateTag(tag);
  
  // Check if tag already exists (case-insensitive)
  const existingTags = recipe.tags.map(t => t.toLowerCase());
  if (existingTags.includes(validatedTag)) {
    // Tag already exists, return recipe unchanged
    return recipe;
  }
  
  return {
    ...recipe,
    tags: [...recipe.tags, validatedTag],
  };
}

/**
 * Removes a tag from a recipe
 * - Validates the tag (non-empty, trimmed)
 * - Performs case-insensitive removal
 * - Returns a new Recipe object with the tag removed
 * 
 * Requirements: 3.2
 */
export function removeTag(recipe: Recipe, tag: string): Recipe {
  const validatedTag = validateTag(tag);
  
  return {
    ...recipe,
    tags: recipe.tags.filter(t => t.toLowerCase() !== validatedTag),
  };
}
