/**
 * RecipeEditor component - Form for creating and editing recipes
 * Requirements: 2.1, 2.2, 2.4, 2.6, 2.7, 3.1, 3.2
 */

import { useState, useEffect } from 'react';
import type { Recipe, RecipeImage } from '../types';
import { validateTag, addTag, removeTag, updateRecipeTimestamp } from '../services';
import './RecipeEditor.css';

export interface RecipeEditorProps {
  recipe?: Recipe;
  onSave: (recipe: Recipe) => void;
  onCancel: () => void;
}

// Generate a unique ID
const generateId = () => crypto.randomUUID();

// Create a new empty recipe
const createEmptyRecipe = (): Recipe => ({
  id: generateId(),
  title: '',
  author: null,
  ingredients: [],
  steps: [],
  notes: null,
  images: [],
  tags: [],
  sourceImage: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export function RecipeEditor({ recipe, onSave, onCancel }: RecipeEditorProps) {
  const [formData, setFormData] = useState<Recipe>(recipe || createEmptyRecipe());
  const [ingredientsText, setIngredientsText] = useState('');
  const [stepsText, setStepsText] = useState('');
  const [newTag, setNewTag] = useState('');
  const [tagError, setTagError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!recipe;

  // Initialize text areas from recipe data
  useEffect(() => {
    if (recipe) {
      setIngredientsText(recipe.ingredients.join('\n'));
      setStepsText(recipe.steps.join('\n'));
    }
  }, [recipe]);

  const handleFieldChange = (field: keyof Recipe, value: string | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleIngredientsChange = (text: string) => {
    setIngredientsText(text);
    const ingredients = text.split('\n').filter(line => line.trim());
    setFormData(prev => ({ ...prev, ingredients }));
  };

  const handleStepsChange = (text: string) => {
    setStepsText(text);
    const steps = text.split('\n').filter(line => line.trim());
    setFormData(prev => ({ ...prev, steps }));
  };

  const handleAddTag = () => {
    try {
      const validatedTag = validateTag(newTag);
      
      // Check if tag already exists
      if (formData.tags.includes(validatedTag)) {
        setTagError('Tag already exists');
        return;
      }

      const updatedRecipe = addTag(formData, newTag.trim());
      setFormData(updatedRecipe);
      setNewTag('');
      setTagError(null);
    } catch (err) {
      setTagError(err instanceof Error ? err.message : 'Invalid tag');
    }
  };

  const handleRemoveTag = (tag: string) => {
    const updatedRecipe = removeTag(formData, tag);
    setFormData(updatedRecipe);
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const newImage: RecipeImage = {
        id: generateId(),
        data: base64,
        caption: null,
        position: 'inline',
      };
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, newImage],
      }));
    };
    reader.readAsDataURL(file);

    // Reset input
    e.target.value = '';
  };

  const handleRemoveImage = (imageId: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter(img => img.id !== imageId),
    }));
  };

  const handleImageCaptionChange = (imageId: string, caption: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.map(img =>
        img.id === imageId ? { ...img, caption: caption || null } : img
      ),
    }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (formData.ingredients.length === 0) {
      newErrors.ingredients = 'At least one ingredient is required';
    }

    if (formData.steps.length === 0) {
      newErrors.steps = 'At least one step is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    // Update timestamp
    const updatedRecipe = updateRecipeTimestamp(formData);
    onSave(updatedRecipe);
  };

  return (
    <form className="recipe-editor" onSubmit={handleSubmit}>
      <div className="editor-header">
        <h2>{isEditing ? 'Edit Recipe' : 'New Recipe'}</h2>
        <div className="editor-actions">
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            {isEditing ? 'Save Changes' : 'Create Recipe'}
          </button>
        </div>
      </div>

      {/* Title */}
      <div className="form-group">
        <label htmlFor="title">Title *</label>
        <input
          id="title"
          type="text"
          value={formData.title}
          onChange={(e) => handleFieldChange('title', e.target.value)}
          placeholder="Recipe title"
          className={errors.title ? 'error' : ''}
        />
        {errors.title && <span className="error-message">{errors.title}</span>}
      </div>

      {/* Author */}
      <div className="form-group">
        <label htmlFor="author">Author</label>
        <input
          id="author"
          type="text"
          value={formData.author || ''}
          onChange={(e) => handleFieldChange('author', e.target.value || null)}
          placeholder="Recipe author (optional)"
        />
      </div>

      {/* Tags */}
      <div className="form-group">
        <label>Tags</label>
        <div className="tags-input">
          <div className="tags-list">
            {formData.tags.map(tag => (
              <span key={tag} className="tag">
                {tag}
                <button
                  type="button"
                  className="tag-remove"
                  onClick={() => handleRemoveTag(tag)}
                  title="Remove tag"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="tag-add">
            <input
              type="text"
              value={newTag}
              onChange={(e) => {
                setNewTag(e.target.value);
                setTagError(null);
              }}
              onKeyDown={handleTagKeyDown}
              placeholder="Add a tag..."
              className={tagError ? 'error' : ''}
            />
            <button type="button" onClick={handleAddTag}>
              Add
            </button>
          </div>
          {tagError && <span className="error-message">{tagError}</span>}
        </div>
      </div>

      {/* Ingredients */}
      <div className="form-group">
        <label htmlFor="ingredients">Ingredients * (one per line)</label>
        <textarea
          id="ingredients"
          value={ingredientsText}
          onChange={(e) => handleIngredientsChange(e.target.value)}
          placeholder="Enter ingredients, one per line..."
          rows={6}
          className={errors.ingredients ? 'error' : ''}
        />
        {errors.ingredients && <span className="error-message">{errors.ingredients}</span>}
      </div>

      {/* Steps */}
      <div className="form-group">
        <label htmlFor="steps">Steps * (one per line)</label>
        <textarea
          id="steps"
          value={stepsText}
          onChange={(e) => handleStepsChange(e.target.value)}
          placeholder="Enter steps, one per line..."
          rows={8}
          className={errors.steps ? 'error' : ''}
        />
        {errors.steps && <span className="error-message">{errors.steps}</span>}
      </div>

      {/* Notes */}
      <div className="form-group">
        <label htmlFor="notes">Notes</label>
        <textarea
          id="notes"
          value={formData.notes || ''}
          onChange={(e) => handleFieldChange('notes', e.target.value || null)}
          placeholder="Additional notes (optional)..."
          rows={4}
        />
      </div>

      {/* Images */}
      <div className="form-group">
        <label>Images</label>
        <div className="images-section">
          <div className="images-grid">
            {formData.images.map(image => (
              <div key={image.id} className="image-item">
                <img src={image.data} alt={image.caption || 'Recipe image'} />
                <input
                  type="text"
                  value={image.caption || ''}
                  onChange={(e) => handleImageCaptionChange(image.id, e.target.value)}
                  placeholder="Caption (optional)"
                />
                <button
                  type="button"
                  className="image-remove"
                  onClick={() => handleRemoveImage(image.id)}
                  title="Remove image"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <label className="image-upload-btn">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
            + Add Image
          </label>
        </div>
      </div>
    </form>
  );
}

export default RecipeEditor;
