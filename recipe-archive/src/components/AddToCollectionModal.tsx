/**
 * AddToCollectionModal component - Modal for adding recipes to collections
 * Requirements: 8.2, 8.3, 8.4
 */

import { useState } from 'react';
import type { Collection } from '../types';
import { validateCollectionName, createCollection } from '../services';
import './AddToCollectionModal.css';

export interface AddToCollectionModalProps {
  recipeId: string;
  recipeTitle: string;
  collections: Collection[];
  onClose: () => void;
  onToggleCollection: (collectionId: string, isAdding: boolean) => void;
  onCreateCollection: (collection: Collection) => void;
}

export function AddToCollectionModal({
  recipeId,
  recipeTitle,
  collections,
  onClose,
  onToggleCollection,
  onCreateCollection,
}: AddToCollectionModalProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  // Check which collections contain this recipe
  const isInCollection = (collection: Collection) => {
    return collection.recipeIds.includes(recipeId);
  };

  const handleToggle = (collection: Collection) => {
    const isAdding = !isInCollection(collection);
    onToggleCollection(collection.id, isAdding);
  };

  const handleCreateCollection = () => {
    const validation = validateCollectionName(newCollectionName);
    if (!validation.valid) {
      setCreateError(validation.error || 'Invalid collection name');
      return;
    }

    const newCollection = createCollection(newCollectionName);
    onCreateCollection(newCollection);
    setNewCollectionName('');
    setShowCreateForm(false);
    setCreateError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateCollection();
    } else if (e.key === 'Escape') {
      setShowCreateForm(false);
      setNewCollectionName('');
      setCreateError(null);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="add-to-collection-modal" role="dialog" aria-labelledby="modal-title">
        <div className="modal-header">
          <h3 id="modal-title">Add to Collection</h3>
          <button
            type="button"
            className="close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        
        <p className="modal-subtitle">
          Select collections for "{recipeTitle}"
        </p>

        <div className="collections-list">
          {collections.length === 0 && !showCreateForm ? (
            <div className="no-collections-message">
              No collections yet. Create one below!
            </div>
          ) : (
            collections.map(collection => {
              const inCollection = isInCollection(collection);
              return (
                <div
                  key={collection.id}
                  className={`collection-item ${inCollection ? 'selected' : ''}`}
                  onClick={() => handleToggle(collection)}
                  role="checkbox"
                  aria-checked={inCollection}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleToggle(collection);
                    }
                  }}
                >
                  <span className="checkbox">
                    {inCollection ? '✓' : ''}
                  </span>
                  <span className="collection-name">{collection.name}</span>
                  <span className="recipe-count">
                    {collection.recipeIds.length} {collection.recipeIds.length === 1 ? 'recipe' : 'recipes'}
                  </span>
                </div>
              );
            })
          )}
        </div>

        <div className="modal-footer">
          {showCreateForm ? (
            <div className="create-form">
              <input
                type="text"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="New collection name"
                autoFocus
              />
              <div className="create-form-actions">
                <button
                  type="button"
                  className="cancel-create-btn"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewCollectionName('');
                    setCreateError(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="confirm-create-btn"
                  onClick={handleCreateCollection}
                >
                  Create
                </button>
              </div>
              {createError && (
                <div className="create-error">{createError}</div>
              )}
            </div>
          ) : (
            <button
              type="button"
              className="quick-create-btn"
              onClick={() => setShowCreateForm(true)}
            >
              + Create New Collection
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default AddToCollectionModal;
