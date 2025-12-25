/**
 * ManualRecipeCreator component - Wrapper for creating recipes manually
 * Requirements: 2.1
 */

import { RecipeEditor } from './RecipeEditor';
import type { Recipe } from '../types';

export interface ManualRecipeCreatorProps {
  onSave: (recipe: Recipe) => void;
  onCancel: () => void;
  initialRecipe?: Recipe;
}

export function ManualRecipeCreator({ onSave, onCancel, initialRecipe }: ManualRecipeCreatorProps) {
  return (
    <RecipeEditor
      recipe={initialRecipe}
      onSave={onSave}
      onCancel={onCancel}
    />
  );
}

export default ManualRecipeCreator;
