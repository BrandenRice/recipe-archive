/**
 * RecipeCreationMode component - Selector for OCR or Manual recipe creation
 * Requirements: 1.1, 2.1
 */

import './RecipeCreationMode.css';

export interface RecipeCreationModeProps {
  onSelectOCR: () => void;
  onSelectManual: () => void;
}

export function RecipeCreationMode({ onSelectOCR, onSelectManual }: RecipeCreationModeProps) {
  return (
    <div className="recipe-creation-mode">
      <h2>Create New Recipe</h2>
      <p className="mode-description">
        Choose how you'd like to create your recipe:
      </p>
      
      <div className="mode-options">
        <button 
          type="button" 
          className="mode-option" 
          onClick={onSelectOCR}
        >
          <div className="mode-icon">📷</div>
          <h3>Scan Recipe</h3>
          <p>Upload a photo of a handwritten or printed recipe and use OCR to extract the text</p>
        </button>

        <button 
          type="button" 
          className="mode-option" 
          onClick={onSelectManual}
        >
          <div className="mode-icon">✏️</div>
          <h3>Manual Entry</h3>
          <p>Type in your recipe details manually using the recipe editor</p>
        </button>
      </div>
    </div>
  );
}

export default RecipeCreationMode;
