/**
 * CollectionList component - Displays collections in card grid layout
 * Requirements: 2.1, 4.1
 */

import { useState } from 'react';
import type { Collection } from '../types';
import { DeleteConfirmationDialog } from './DeleteConfirmationDialog';
import './CollectionList.css';

export interface CollectionListProps {
  collections: Collection[];
  onSelect: (collection: Collection) => void;
  onEdit: (collection: Collection) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
}

export function CollectionList({
  collections,
  onSelect,
  onEdit,
  onDelete,
  onCreate,
}: CollectionListProps) {
  const [collectionToDelete, setCollectionToDelete] = useState<Collection | null>(null);

  const handleDeleteClick = (e: React.MouseEvent, collection: Collection) => {
    e.stopPropagation();
    setCollectionToDelete(collection);
  };

  const handleConfirmDelete = () => {
    if (collectionToDelete) {
      onDelete(collectionToDelete.id);
      setCollectionToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setCollectionToDelete(null);
  };

  const handleEdit = (e: React.MouseEvent, collection: Collection) => {
    e.stopPropagation();
    onEdit(collection);
  };

  return (
    <div className="collection-list">
      <div className="collection-list-header">
        <h2>Collections</h2>
        <button
          type="button"
          className="create-collection-btn"
          onClick={onCreate}
        >
          + New Collection
        </button>
      </div>

      <div className="collection-cards">
        {collections.length === 0 ? (
          <div className="no-collections">
            No collections yet. Create one to organize your recipes!
          </div>
        ) : (
          collections.map(collection => (
            <CollectionCard
              key={collection.id}
              collection={collection}
              onSelect={onSelect}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
            />
          ))
        )}
      </div>

      {collectionToDelete && (
        <DeleteConfirmationDialog
          title="Delete Collection"
          message="Are you sure you want to delete this collection? Recipes in this collection will not be deleted."
          itemName={collectionToDelete.name}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}
    </div>
  );
}

interface CollectionCardProps {
  collection: Collection;
  onSelect: (collection: Collection) => void;
  onEdit: (e: React.MouseEvent, collection: Collection) => void;
  onDelete: (e: React.MouseEvent, collection: Collection) => void;
}

function CollectionCard({ collection, onSelect, onEdit, onDelete }: CollectionCardProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  const recipeCount = collection.recipeIds.length;

  return (
    <div className="collection-card" onClick={() => onSelect(collection)}>
      <div className="collection-card-header">
        <h3 className="collection-card-title">{collection.name}</h3>
        <div className="collection-card-actions">
          <button
            type="button"
            className="edit-btn"
            onClick={(e) => onEdit(e, collection)}
            title="Edit collection"
            aria-label={`Edit collection ${collection.name}`}
          >
            ✏️
          </button>
          <button
            type="button"
            className="delete-btn"
            onClick={(e) => onDelete(e, collection)}
            title="Delete collection"
            aria-label={`Delete collection ${collection.name}`}
          >
            ×
          </button>
        </div>
      </div>
      
      {collection.description && (
        <p className="collection-card-description">{collection.description}</p>
      )}
      
      <div className="collection-card-info">
        <span className="recipe-count">
          {recipeCount} {recipeCount === 1 ? 'recipe' : 'recipes'}
        </span>
      </div>
      
      <p className="collection-card-date">
        Updated: {formatDate(collection.updatedAt)}
      </p>
    </div>
  );
}

export default CollectionList;
