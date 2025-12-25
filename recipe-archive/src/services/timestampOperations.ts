/**
 * Timestamp Operations Service
 * Handles timestamp updates for recipe modifications
 * Requirements: 2.5
 */

import type { Recipe } from '../types/recipe';

/**
 * Updates the updatedAt timestamp on a recipe
 * Should be called whenever a recipe is modified
 * 
 * @param recipe - The recipe to update
 * @returns A new recipe object with updated timestamp
 */
export function updateRecipeTimestamp(recipe: Recipe): Recipe {
  return {
    ...recipe,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Creates a recipe modification with updated timestamp
 * Merges updates into the recipe and sets the updatedAt timestamp
 * 
 * @param recipe - The original recipe
 * @param updates - Partial recipe updates to apply
 * @returns A new recipe object with updates and new timestamp
 */
export function applyRecipeModification(
  recipe: Recipe,
  updates: Partial<Omit<Recipe, 'id' | 'createdAt'>>
): Recipe {
  return {
    ...recipe,
    ...updates,
    id: recipe.id, // Ensure ID cannot be changed
    createdAt: recipe.createdAt, // Ensure createdAt cannot be changed
    updatedAt: new Date().toISOString(),
  };
}
