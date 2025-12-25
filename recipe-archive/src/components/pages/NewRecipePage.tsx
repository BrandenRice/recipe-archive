/**
 * NewRecipePage - Page component for creating new recipes
 * Requirements: 1.1, 2.1
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RecipeCreationMode } from '../RecipeCreationMode';
import { ManualRecipeCreator } from '../ManualRecipeCreator';
import { ImageUploader } from '../ImageUploader';
import { IndexedDBStorageAdapter } from '../../adapters';
import type { Recipe, OCRResult } from '../../types';

// Create a singleton storage adapter
const storage = new IndexedDBStorageAdapter();

type CreationMode = 'select' | 'ocr' | 'manual';

export function NewRecipePage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<CreationMode>('select');
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);

  const handleSelectOCR = () => {
    setMode('ocr');
  };

  const handleSelectManual = () => {
    setMode('manual');
  };

  const handleOCRComplete = (result: OCRResult) => {
    setOcrResult(result);
    // After OCR, switch to manual mode with pre-filled data
    setMode('manual');
  };

  const handleOCRError = (error: Error) => {
    console.error('OCR Error:', error);
    alert(`OCR failed: ${error.message}. You can try again or enter the recipe manually.`);
  };

  const handleSave = async (recipe: Recipe) => {
    try {
      await storage.createRecipe(recipe);
      navigate('/');
    } catch (err) {
      console.error('Error saving recipe:', err);
      alert('Failed to save recipe. Please try again.');
    }
  };

  const handleCancel = () => {
    if (mode === 'select') {
      navigate('/');
    } else {
      setMode('select');
      setOcrResult(null);
    }
  };

  // Create initial recipe from OCR result if available
  const getInitialRecipe = (): Recipe | undefined => {
    if (!ocrResult) return undefined;

    // Parse OCR text into recipe structure
    const lines = ocrResult.text.split('\n').filter(line => line.trim());
    
    return {
      id: crypto.randomUUID(),
      title: lines[0] || 'Untitled Recipe',
      author: ocrResult.inferredAuthor,
      ingredients: [],
      steps: lines.slice(1), // Rest of lines as steps (user can edit)
      notes: null,
      images: [],
      tags: [],
      sourceImage: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  return (
    <div className="new-recipe-page">
      {mode === 'select' && (
        <RecipeCreationMode
          onSelectOCR={handleSelectOCR}
          onSelectManual={handleSelectManual}
        />
      )}

      {mode === 'ocr' && (
        <ImageUploader
          onTextExtracted={handleOCRComplete}
          onError={handleOCRError}
          onCancel={handleCancel}
        />
      )}

      {mode === 'manual' && (
        <ManualRecipeCreator
          onSave={handleSave}
          onCancel={handleCancel}
          initialRecipe={getInitialRecipe()}
        />
      )}
    </div>
  );
}

export default NewRecipePage;
