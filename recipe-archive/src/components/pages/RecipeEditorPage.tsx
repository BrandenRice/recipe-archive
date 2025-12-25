/**
 * RecipeEditorPage - Page component for editing recipes
 * Requirements: 2.1, 2.2, 2.4, 2.6, 2.7, 3.1, 3.2, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RecipeEditor } from '../RecipeEditor';
import { PrintPreview } from '../PrintPreview';
import { IndexedDBStorageAdapter } from '../../adapters';
import type { Recipe, Template } from '../../types';

// Create a singleton storage adapter
const storage = new IndexedDBStorageAdapter();

export function RecipeEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<Recipe | undefined>(undefined);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState<string | null>(null);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  useEffect(() => {
    if (id) {
      loadRecipe(id);
    }
    loadTemplates();
  }, [id]);

  const loadRecipe = async (recipeId: string) => {
    try {
      setLoading(true);
      setError(null);
      const loadedRecipe = await storage.getRecipe(recipeId);
      if (loadedRecipe) {
        setRecipe(loadedRecipe);
      } else {
        setError('Recipe not found');
      }
    } catch (err) {
      setError('Failed to load recipe');
      console.error('Error loading recipe:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const loadedTemplates = await storage.listTemplates();
      setTemplates(loadedTemplates);
    } catch (err) {
      console.error('Error loading templates:', err);
    }
  };

  const handleSave = async (updatedRecipe: Recipe) => {
    try {
      if (id) {
        // Update existing recipe
        await storage.updateRecipe(id, updatedRecipe);
      } else {
        // Create new recipe
        await storage.createRecipe(updatedRecipe);
      }
      navigate('/');
    } catch (err) {
      console.error('Error saving recipe:', err);
      alert('Failed to save recipe. Please try again.');
    }
  };

  const handleCancel = () => {
    navigate('/');
  };

  const handlePrint = () => {
    setShowPrintPreview(true);
  };

  const handleClosePrintPreview = () => {
    setShowPrintPreview(false);
  };

  if (loading) {
    return (
      <div className="recipe-editor-page">
        <p>Loading recipe...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="recipe-editor-page">
        <p className="error">{error}</p>
        <button onClick={() => navigate('/')}>Back to Recipes</button>
      </div>
    );
  }

  return (
    <div className="recipe-editor-page">
      {/* Print button for existing recipes */}
      {recipe && (
        <div className="recipe-editor-toolbar">
          <button 
            type="button" 
            className="print-btn"
            onClick={handlePrint}
            title="Print or export recipe"
          >
            🖨️ Print / Export
          </button>
        </div>
      )}
      
      <RecipeEditor
        recipe={recipe}
        onSave={handleSave}
        onCancel={handleCancel}
      />

      {/* Print Preview Modal */}
      {showPrintPreview && recipe && (
        <PrintPreview
          recipe={recipe}
          templates={templates}
          onClose={handleClosePrintPreview}
        />
      )}
    </div>
  );
}

export default RecipeEditorPage;
