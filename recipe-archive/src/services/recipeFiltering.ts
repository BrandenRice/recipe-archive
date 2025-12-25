/**
 * Recipe filtering and sorting logic
 * Requirements: 3.3, 3.4, 3.5
 */

import type { Recipe, RecipeFilter } from '../types';

/**
 * Filters recipes based on the provided filter criteria
 * - Tags: AND mode requires all tags, OR mode requires at least one tag
 * - Author: exact match (case-insensitive)
 * - SearchText: searches across title, ingredients, and steps
 * 
 * Requirements: 3.3, 3.4
 */
export function filterRecipes(recipes: Recipe[], filter: RecipeFilter): Recipe[] {
  return recipes.filter(recipe => {
    // Tag filtering
    if (filter.tags && filter.tags.length > 0) {
      const recipeTags = recipe.tags.map(t => t.toLowerCase());
      const filterTags = filter.tags.map(t => t.toLowerCase());
      
      if (filter.tagMatchMode === 'and') {
        // AND mode: recipe must have ALL specified tags
        const hasAllTags = filterTags.every(tag => recipeTags.includes(tag));
        if (!hasAllTags) return false;
      } else {
        // OR mode: recipe must have AT LEAST ONE of the specified tags
        const hasAnyTag = filterTags.some(tag => recipeTags.includes(tag));
        if (!hasAnyTag) return false;
      }
    }

    // Author filtering (case-insensitive exact match)
    if (filter.author !== undefined && filter.author !== null) {
      const recipeAuthor = recipe.author?.toLowerCase() ?? '';
      const filterAuthor = filter.author.toLowerCase();
      if (recipeAuthor !== filterAuthor) return false;
    }

    // Text search across title, ingredients, and steps
    if (filter.searchText !== undefined && filter.searchText !== null && filter.searchText.trim() !== '') {
      const searchLower = filter.searchText.toLowerCase();
      const titleMatch = recipe.title.toLowerCase().includes(searchLower);
      const ingredientsMatch = recipe.ingredients.some(ing => 
        ing.toLowerCase().includes(searchLower)
      );
      const stepsMatch = recipe.steps.some(step => 
        step.toLowerCase().includes(searchLower)
      );
      
      if (!titleMatch && !ingredientsMatch && !stepsMatch) return false;
    }

    return true;
  });
}

/**
 * Sorts recipes based on the provided sort criteria
 * Supports sorting by: title, createdAt, updatedAt, author
 * Supports ascending and descending order
 * 
 * Requirements: 3.5
 */
export function sortRecipes(recipes: Recipe[], filter: RecipeFilter): Recipe[] {
  const { sortBy, sortOrder } = filter;
  
  return [...recipes].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'createdAt':
        comparison = a.createdAt.localeCompare(b.createdAt);
        break;
      case 'updatedAt':
        comparison = a.updatedAt.localeCompare(b.updatedAt);
        break;
      case 'author':
        // Handle null authors - null values sort to the end
        const authorA = a.author ?? '';
        const authorB = b.author ?? '';
        comparison = authorA.localeCompare(authorB);
        break;
    }
    
    return sortOrder === 'desc' ? -comparison : comparison;
  });
}

/**
 * Applies both filtering and sorting to a list of recipes
 * This is the main entry point for recipe list operations
 */
export function filterAndSortRecipes(recipes: Recipe[], filter: RecipeFilter): Recipe[] {
  const filtered = filterRecipes(recipes, filter);
  return sortRecipes(filtered, filter);
}
