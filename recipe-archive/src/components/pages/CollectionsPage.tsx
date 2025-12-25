/**
 * CollectionsPage - Page component for managing collections
 * Requirements: 2.1, 2.2, 4.2, 4.4
 */

import { useState, useEffect, useCallback } from 'react';
import { CollectionList } from '../CollectionList';
import { CollectionDetail } from '../CollectionDetail';
import { IndexedDBStorageAdapter } from '../../adapters';
import {
  createCollection,
  validateCollectionName,
  sortCollections,
  removeRecipeFromCollection,
  exportCollectionToJSON,
  exportCollectionToPDF,
  downloadBlob,
} from '../../services';
import type { Collection, Recipe } from '../../types';
import './CollectionsPage.css';

type ViewMode = 'list' | 'detail' | 'create' | 'edit';

export function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form state for create/edit
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const storage = new IndexedDBStorageAdapter();

  // Load collections and recipes on mount
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [loadedCollections, loadedRecipes] = await Promise.all([
        storage.listCollections(),
        storage.listRecipes(),
      ]);
      setCollections(sortCollections(loadedCollections));
      setRecipes(loadedRecipes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSelectCollection = (collection: Collection) => {
    setSelectedCollection(collection);
    setViewMode('detail');
  };

  const handleEditCollection = (collection: Collection) => {
    setSelectedCollection(collection);
    setFormName(collection.name);
    setFormDescription(collection.description || '');
    setFormError(null);
    setViewMode('edit');
  };

  const handleDeleteCollection = async (id: string) => {
    try {
      await storage.deleteCollection(id);
      setCollections(prev => sortCollections(prev.filter(c => c.id !== id)));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete collection');
    }
  };

  const handleCreateNew = () => {
    setSelectedCollection(null);
    setFormName('');
    setFormDescription('');
    setFormError(null);
    setViewMode('create');
  };

  const handleBack = () => {
    setViewMode('list');
    setSelectedCollection(null);
    setFormError(null);
  };

  const handleSaveCollection = async () => {
    // Validate name
    const validation = validateCollectionName(formName);
    if (!validation.valid) {
      setFormError(validation.error || 'Invalid collection name');
      return;
    }

    try {
      if (viewMode === 'create') {
        const newCollection = createCollection(formName, formDescription || undefined);
        const created = await storage.createCollection(newCollection);
        setCollections(prev => sortCollections([...prev, created]));
      } else if (viewMode === 'edit' && selectedCollection) {
        const updated = await storage.updateCollection(selectedCollection.id, {
          name: formName.trim(),
          description: formDescription.trim() || null,
        });
        setCollections(prev => sortCollections(prev.map(c => c.id === updated.id ? updated : c)));
      }
      setViewMode('list');
      setSelectedCollection(null);
      setFormError(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save collection');
    }
  };

  const handleRemoveRecipe = async (recipeId: string) => {
    if (!selectedCollection) return;

    try {
      const updatedCollection = removeRecipeFromCollection(selectedCollection, recipeId);
      const saved = await storage.updateCollection(selectedCollection.id, {
        recipeIds: updatedCollection.recipeIds,
      });
      setSelectedCollection(saved);
      setCollections(prev => sortCollections(prev.map(c => c.id === saved.id ? saved : c)));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to remove recipe');
    }
  };

  const handleExportPDF = async () => {
    if (!selectedCollection) return;
    
    // Get recipes in collection
    const collectionRecipes = recipes.filter(r => 
      selectedCollection.recipeIds.includes(r.id)
    );
    
    if (collectionRecipes.length === 0) {
      alert('No recipes to export');
      return;
    }

    try {
      const result = await exportCollectionToPDF(selectedCollection, recipes);
      
      if (!result.success) {
        alert(result.error || 'Failed to export PDF');
        return;
      }
      
      if (result.blob) {
        const filename = `collection-${selectedCollection.name.toLowerCase().replace(/\s+/g, '-')}.pdf`;
        downloadBlob(result.blob, filename);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to export collection as PDF');
    }
  };

  const handleExportJSON = async () => {
    if (!selectedCollection) return;
    
    const collectionRecipes = recipes.filter(r => 
      selectedCollection.recipeIds.includes(r.id)
    );
    
    if (collectionRecipes.length === 0) {
      alert('No recipes to export');
      return;
    }

    try {
      const exportData = exportCollectionToJSON(selectedCollection, recipes);
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const filename = `collection-${selectedCollection.name.toLowerCase().replace(/\s+/g, '-')}.json`;
      downloadBlob(blob, filename);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to export collection');
    }
  };

  if (loading) {
    return (
      <div className="collections-page">
        <div className="loading">Loading collections...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="collections-page">
        <div className="error">
          <p>{error}</p>
          <button onClick={loadData}>Retry</button>
        </div>
      </div>
    );
  }

  // Create/Edit form view
  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <div className="collections-page">
        <div className="collection-form">
          <h2>{viewMode === 'create' ? 'Create Collection' : 'Edit Collection'}</h2>
          
          <div className="form-group">
            <label htmlFor="collection-name">Name *</label>
            <input
              id="collection-name"
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Enter collection name"
              autoFocus
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="collection-description">Description</label>
            <textarea
              id="collection-description"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Enter optional description"
              rows={3}
            />
          </div>
          
          {formError && (
            <div className="form-error">{formError}</div>
          )}
          
          <div className="form-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={handleBack}
            >
              Cancel
            </button>
            <button
              type="button"
              className="save-btn"
              onClick={handleSaveCollection}
            >
              {viewMode === 'create' ? 'Create' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Detail view
  if (viewMode === 'detail' && selectedCollection) {
    return (
      <div className="collections-page">
        <CollectionDetail
          collection={selectedCollection}
          recipes={recipes}
          onBack={handleBack}
          onRemoveRecipe={handleRemoveRecipe}
          onExportPDF={handleExportPDF}
          onExportJSON={handleExportJSON}
        />
      </div>
    );
  }

  // List view (default)
  return (
    <div className="collections-page">
      <CollectionList
        collections={collections}
        onSelect={handleSelectCollection}
        onEdit={handleEditCollection}
        onDelete={handleDeleteCollection}
        onCreate={handleCreateNew}
      />
    </div>
  );
}

export default CollectionsPage;
