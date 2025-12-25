/**
 * RecipeListPage - Page component for displaying recipe list
 * Requirements: 3.3, 3.4, 3.5, 7.4, 7.5
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { RecipeList } from '../RecipeList';
import { PrintPreview } from '../PrintPreview';
import { IndexedDBStorageAdapter } from '../../adapters';
import { exportToJSON, importFromJSON, createExportBlob, generateExportFilename } from '../../services/backupOperations';
import type { Recipe, Template } from '../../types';

// Create a singleton storage adapter
const storage = new IndexedDBStorageAdapter();

export function RecipeListPage() {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [loadedRecipes, loadedTemplates] = await Promise.all([
        storage.listRecipes(),
        storage.listTemplates(),
      ]);
      setRecipes(loadedRecipes);
      setTemplates(loadedTemplates);
    } catch (err) {
      setError('Failed to load recipes. Please try again.');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRecipe = (recipe: Recipe) => {
    navigate(`/recipe/${recipe.id}/edit`);
  };

  const handleDeleteRecipe = async (id: string) => {
    try {
      await storage.deleteRecipe(id);
      setRecipes(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error('Error deleting recipe:', err);
      alert('Failed to delete recipe. Please try again.');
    }
  };

  const handlePrintRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setShowPrintPreview(true);
  };

  const handleClosePrintPreview = () => {
    setShowPrintPreview(false);
    setSelectedRecipe(null);
  };

  // JSON Backup Export
  const handleExportBackup = () => {
    try {
      const exportData = exportToJSON(recipes, templates);
      const blob = createExportBlob(exportData);
      const filename = generateExportFilename();
      
      // Download the file
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setImportStatus(`Backup exported: ${filename}`);
      setTimeout(() => setImportStatus(null), 3000);
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export backup. Please try again.');
    }
  };

  // JSON Backup Import
  const handleImportBackup = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const result = importFromJSON(text);

      if (!result.success && result.errors.length > 0 && result.recipesImported === 0 && result.templatesImported === 0) {
        alert(`Import failed: ${result.errors.map(e => e.message).join(', ')}`);
        return;
      }

      // Import recipes
      for (const recipe of result.recipes) {
        try {
          const existing = await storage.getRecipe(recipe.id);
          if (existing) {
            await storage.updateRecipe(recipe.id, recipe);
          } else {
            await storage.createRecipe(recipe);
          }
        } catch (err) {
          console.error(`Failed to import recipe ${recipe.id}:`, err);
        }
      }

      // Import templates (skip defaults)
      for (const template of result.templates) {
        if (template.isDefault) continue;
        try {
          const existing = await storage.getTemplate(template.id);
          if (existing) {
            await storage.updateTemplate(template.id, template);
          } else {
            await storage.createTemplate(template);
          }
        } catch (err) {
          console.error(`Failed to import template ${template.id}:`, err);
        }
      }

      // Reload data
      await loadData();

      const statusMsg = `Imported ${result.recipesImported} recipes and ${result.templatesImported} templates`;
      setImportStatus(statusMsg);
      setTimeout(() => setImportStatus(null), 5000);

      if (result.errors.length > 0) {
        console.warn('Import warnings:', result.errors);
      }
    } catch (err) {
      console.error('Import error:', err);
      alert('Failed to import backup. Please check the file format.');
    }

    // Reset file input
    e.target.value = '';
  };

  // Extract unique tags and authors from recipes
  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    recipes.forEach(recipe => recipe.tags.forEach(tag => tags.add(tag)));
    return Array.from(tags).sort();
  }, [recipes]);

  const availableAuthors = useMemo(() => {
    const authors = new Set<string>();
    recipes.forEach(recipe => {
      if (recipe.author) authors.add(recipe.author);
    });
    return Array.from(authors).sort();
  }, [recipes]);

  if (loading) {
    return (
      <div className="recipe-list-page">
        <h2>My Recipes</h2>
        <p>Loading recipes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="recipe-list-page">
        <h2>My Recipes</h2>
        <p className="error">{error}</p>
        <button onClick={loadData}>Retry</button>
      </div>
    );
  }

  return (
    <div className="recipe-list-page">
      <div className="recipe-list-header">
        <h2>My Recipes</h2>
        <div className="backup-actions">
          <button 
            type="button" 
            className="backup-btn export-btn"
            onClick={handleExportBackup}
            title="Export all recipes and templates as JSON backup"
          >
            📤 Export Backup
          </button>
          <button 
            type="button" 
            className="backup-btn import-btn"
            onClick={handleImportBackup}
            title="Import recipes and templates from JSON backup"
          >
            📥 Import Backup
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      {importStatus && (
        <div className="import-status">
          {importStatus}
        </div>
      )}

      <RecipeList
        recipes={recipes}
        onSelect={handleSelectRecipe}
        onDelete={handleDeleteRecipe}
        onPrint={handlePrintRecipe}
        availableTags={availableTags}
        availableAuthors={availableAuthors}
      />

      {/* Print Preview Modal */}
      {showPrintPreview && selectedRecipe && (
        <PrintPreview
          recipe={selectedRecipe}
          templates={templates}
          onClose={handleClosePrintPreview}
        />
      )}
    </div>
  );
}

export default RecipeListPage;
