/**
 * RecipeList component - Displays recipes with filtering and sorting
 * Requirements: 3.3, 3.4, 3.5, 6.1, 6.6, 6.7, 8.1, 8.5, 8.6
 */

import { useState, useMemo } from 'react';
import type { Recipe, RecipeFilter, Collection } from '../types';
import { filterAndSortRecipes, getCollectionsForRecipe } from '../services';
import './RecipeList.css';

export interface RecipeListProps {
  recipes: Recipe[];
  onSelect: (recipe: Recipe) => void;
  onDelete: (id: string) => void;
  onPrint?: (recipe: Recipe) => void;
  availableTags: string[];
  availableAuthors: string[];
  collections?: Collection[];
  onAddToCollection?: (recipe: Recipe) => void;
}

const defaultFilter: RecipeFilter = {
  tagMatchMode: 'and',
  sortBy: 'updatedAt',
  sortOrder: 'desc',
};

export function RecipeList({
  recipes,
  onSelect,
  onDelete,
  onPrint,
  availableTags,
  availableAuthors,
  collections = [],
  onAddToCollection,
}: RecipeListProps) {
  const [filter, setFilter] = useState<RecipeFilter>(defaultFilter);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedAuthor, setSelectedAuthor] = useState('');

  // Build the complete filter object
  const activeFilter: RecipeFilter = useMemo(() => ({
    ...filter,
    tags: selectedTags.length > 0 ? selectedTags : undefined,
    searchText: searchText.trim() || undefined,
    author: selectedAuthor || undefined,
  }), [filter, selectedTags, searchText, selectedAuthor]);

  // Apply filtering and sorting
  const filteredRecipes = useMemo(() => {
    return filterAndSortRecipes(recipes, activeFilter);
  }, [recipes, activeFilter]);

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleTagMatchModeChange = (mode: 'and' | 'or') => {
    setFilter(prev => ({ ...prev, tagMatchMode: mode }));
  };

  const handleSortChange = (sortBy: RecipeFilter['sortBy']) => {
    setFilter(prev => ({ ...prev, sortBy }));
  };

  const handleSortOrderChange = () => {
    setFilter(prev => ({ 
      ...prev, 
      sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' 
    }));
  };

  const handleClearFilters = () => {
    setSelectedTags([]);
    setSearchText('');
    setSelectedAuthor('');
    setFilter(defaultFilter);
  };

  const hasActiveFilters = selectedTags.length > 0 || searchText || selectedAuthor;

  return (
    <div className="recipe-list">
      <div className="recipe-list-controls">
        {/* Search */}
        <div className="filter-section">
          <label htmlFor="search-input">Search</label>
          <input
            id="search-input"
            type="text"
            placeholder="Search recipes..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="search-input"
          />
        </div>

        {/* Author filter */}
        <div className="filter-section">
          <label htmlFor="author-select">Author</label>
          <select
            id="author-select"
            value={selectedAuthor}
            onChange={(e) => setSelectedAuthor(e.target.value)}
            className="author-select"
          >
            <option value="">All Authors</option>
            {availableAuthors.map(author => (
              <option key={author} value={author}>{author}</option>
            ))}
          </select>
        </div>

        {/* Tag filters */}
        <div className="filter-section tags-section">
          <div className="tags-header">
            <label>Tags</label>
            <div className="tag-match-mode">
              <button
                type="button"
                className={`mode-btn ${filter.tagMatchMode === 'and' ? 'active' : ''}`}
                onClick={() => handleTagMatchModeChange('and')}
                title="Match ALL selected tags"
              >
                AND
              </button>
              <button
                type="button"
                className={`mode-btn ${filter.tagMatchMode === 'or' ? 'active' : ''}`}
                onClick={() => handleTagMatchModeChange('or')}
                title="Match ANY selected tag"
              >
                OR
              </button>
            </div>
          </div>
          <div className="tag-list">
            {availableTags.map(tag => (
              <button
                key={tag}
                type="button"
                className={`tag-btn ${selectedTags.includes(tag) ? 'selected' : ''}`}
                onClick={() => handleTagToggle(tag)}
              >
                {tag}
              </button>
            ))}
            {availableTags.length === 0 && (
              <span className="no-tags">No tags available</span>
            )}
          </div>
        </div>

        {/* Sort controls */}
        <div className="filter-section sort-section">
          <label htmlFor="sort-select">Sort by</label>
          <div className="sort-controls">
            <select
              id="sort-select"
              value={filter.sortBy}
              onChange={(e) => handleSortChange(e.target.value as RecipeFilter['sortBy'])}
              className="sort-select"
            >
              <option value="title">Title</option>
              <option value="author">Author</option>
              <option value="createdAt">Created Date</option>
              <option value="updatedAt">Updated Date</option>
            </select>
            <button
              type="button"
              className="sort-order-btn"
              onClick={handleSortOrderChange}
              title={filter.sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            >
              {filter.sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            type="button"
            className="clear-filters-btn"
            onClick={handleClearFilters}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Results count */}
      <div className="results-info">
        Showing {filteredRecipes.length} of {recipes.length} recipes
      </div>

      {/* Recipe cards */}
      <div className="recipe-cards">
        {filteredRecipes.length === 0 ? (
          <div className="no-recipes">
            {recipes.length === 0 
              ? 'No recipes yet. Create your first recipe!'
              : 'No recipes match your filters.'}
          </div>
        ) : (
          filteredRecipes.map(recipe => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onSelect={onSelect}
              onDelete={onDelete}
              onPrint={onPrint}
              collections={collections}
              onAddToCollection={onAddToCollection}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface RecipeCardProps {
  recipe: Recipe;
  onSelect: (recipe: Recipe) => void;
  onDelete: (id: string) => void;
  onPrint?: (recipe: Recipe) => void;
  collections?: Collection[];
  onAddToCollection?: (recipe: Recipe) => void;
}

function RecipeCard({ recipe, onSelect, onDelete, onPrint, collections = [], onAddToCollection }: RecipeCardProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Delete "${recipe.title}"?`)) {
      onDelete(recipe.id);
    }
  };

  const handlePrint = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPrint?.(recipe);
  };

  const handleAddToCollection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCollection?.(recipe);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  // Get collections that contain this recipe
  const recipeCollections = getCollectionsForRecipe(collections, recipe.id);

  return (
    <div className="recipe-card" onClick={() => onSelect(recipe)}>
      <div className="recipe-card-header">
        <h3 className="recipe-card-title">{recipe.title}</h3>
        <div className="recipe-card-actions">
          {onAddToCollection && (
            <button
              type="button"
              className="collection-btn"
              onClick={handleAddToCollection}
              title="Add to Collection"
            >
              📁
            </button>
          )}
          {onPrint && (
            <button
              type="button"
              className="print-btn"
              onClick={handlePrint}
              title="Print recipe"
            >
              🖨️
            </button>
          )}
          <button
            type="button"
            className="delete-btn"
            onClick={handleDelete}
            title="Delete recipe"
          >
            ×
          </button>
        </div>
      </div>
      {recipe.author && (
        <p className="recipe-card-author">by {recipe.author}</p>
      )}
      {recipe.tags.length > 0 && (
        <div className="recipe-card-tags">
          {recipe.tags.map(tag => (
            <span key={tag} className="recipe-tag">{tag}</span>
          ))}
        </div>
      )}
      {recipeCollections.length > 0 && (
        <div className="recipe-card-collections">
          {recipeCollections.map(collection => (
            <span key={collection.id} className="collection-badge">{collection.name}</span>
          ))}
        </div>
      )}
      <p className="recipe-card-date">
        Updated: {formatDate(recipe.updatedAt)}
      </p>
    </div>
  );
}

export default RecipeList;
