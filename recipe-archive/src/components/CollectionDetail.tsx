/**
 * CollectionDetail component - Displays collection details with recipe list
 * Requirements: 2.2, 2.3, 3.4, 5.1, 5.4
 */

import type { Collection, Recipe } from '../types';
import './CollectionDetail.css';

export interface CollectionDetailProps {
  collection: Collection;
  recipes: Recipe[];
  onBack: () => void;
  onRemoveRecipe: (recipeId: string) => void;
  onExportPDF: () => void;
  onExportJSON: () => void;
}

export function CollectionDetail({
  collection,
  recipes,
  onBack,
  onRemoveRecipe,
  onExportPDF,
  onExportJSON,
}: CollectionDetailProps) {
  // Filter recipes to only those in this collection
  const collectionRecipes = recipes.filter(recipe => 
    collection.recipeIds.includes(recipe.id)
  );

  const handleRemoveRecipe = (e: React.MouseEvent, recipeId: string, recipeTitle: string) => {
    e.stopPropagation();
    if (confirm(`Remove "${recipeTitle}" from this collection?`)) {
      onRemoveRecipe(recipeId);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  const isEmpty = collectionRecipes.length === 0;

  return (
    <div className="collection-detail">
      <div className="collection-detail-header">
        <button
          type="button"
          className="back-btn"
          onClick={onBack}
          aria-label="Back to collections"
        >
          ← Back
        </button>
        <div className="collection-detail-title-section">
          <h2 className="collection-detail-title">{collection.name}</h2>
          {collection.description && (
            <p className="collection-detail-description">{collection.description}</p>
          )}
        </div>
        <div className="collection-detail-actions">
          <button
            type="button"
            className="export-btn pdf-btn"
            onClick={onExportPDF}
            disabled={isEmpty}
            title={isEmpty ? 'No recipes to export' : 'Export as PDF'}
          >
            📄 Export PDF
          </button>
          <button
            type="button"
            className="export-btn json-btn"
            onClick={onExportJSON}
            disabled={isEmpty}
            title={isEmpty ? 'No recipes to export' : 'Export as JSON'}
          >
            📋 Export JSON
          </button>
        </div>
      </div>

      <div className="collection-detail-info">
        <span className="recipe-count-badge">
          {collectionRecipes.length} {collectionRecipes.length === 1 ? 'recipe' : 'recipes'}
        </span>
        <span className="collection-date">
          Updated: {formatDate(collection.updatedAt)}
        </span>
      </div>

      {isEmpty ? (
        <div className="empty-collection">
          <p>This collection is empty.</p>
          <p className="empty-hint">Add recipes from the Recipes page to get started.</p>
        </div>
      ) : (
        <div className="collection-recipes">
          {collectionRecipes.map(recipe => (
            <div key={recipe.id} className="collection-recipe-card">
              <div className="collection-recipe-info">
                <h4 className="collection-recipe-title">{recipe.title}</h4>
                {recipe.author && (
                  <p className="collection-recipe-author">by {recipe.author}</p>
                )}
                {recipe.tags.length > 0 && (
                  <div className="collection-recipe-tags">
                    {recipe.tags.map(tag => (
                      <span key={tag} className="recipe-tag">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                className="remove-recipe-btn"
                onClick={(e) => handleRemoveRecipe(e, recipe.id, recipe.title)}
                title="Remove from collection"
                aria-label={`Remove ${recipe.title} from collection`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CollectionDetail;
