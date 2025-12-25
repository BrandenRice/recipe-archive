/**
 * LocalStorage Adapter
 * Fallback implementation of StorageAdapter using localStorage
 * Used when IndexedDB is unavailable
 * Requirements: 7.1, 7.3
 */

import type {
  StorageAdapter,
  ExportData,
  ImportResult,
  ImportError,
} from '../types/adapters';
import type { Recipe, RecipeFilter } from '../types/recipe';
import type { Template } from '../types/template';
import type { Collection } from '../types/collection';

const RECIPES_KEY = 'recipe-archive-recipes';
const TEMPLATES_KEY = 'recipe-archive-templates';
const COLLECTIONS_KEY = 'recipe-archive-collections';
const SIZE_WARNING_THRESHOLD = 4 * 1024 * 1024; // 4MB warning threshold

export class LocalStorageAdapter implements StorageAdapter {
  private recipes: Map<string, Recipe> = new Map();
  private templates: Map<string, Template> = new Map();
  private collections: Map<string, Collection> = new Map();
  private initialized = false;

  /**
   * Initialize by loading data from localStorage
   */
  private init(): void {
    if (this.initialized) return;

    try {
      const recipesData = localStorage.getItem(RECIPES_KEY);
      if (recipesData) {
        const recipes: Recipe[] = JSON.parse(recipesData);
        recipes.forEach(recipe => this.recipes.set(recipe.id, recipe));
      }

      const templatesData = localStorage.getItem(TEMPLATES_KEY);
      if (templatesData) {
        const templates: Template[] = JSON.parse(templatesData);
        templates.forEach(template => this.templates.set(template.id, template));
      }

      const collectionsData = localStorage.getItem(COLLECTIONS_KEY);
      if (collectionsData) {
        const collections: Collection[] = JSON.parse(collectionsData);
        collections.forEach(collection => this.collections.set(collection.id, collection));
      }

      this.initialized = true;
    } catch (error) {
      console.error('Failed to load data from localStorage:', error);
      this.initialized = true;
    }
  }

  /**
   * Persist recipes to localStorage
   */
  private persistRecipes(): void {
    const data = JSON.stringify(Array.from(this.recipes.values()));
    this.checkStorageSize(data, 'recipes');
    localStorage.setItem(RECIPES_KEY, data);
  }

  /**
   * Persist templates to localStorage
   */
  private persistTemplates(): void {
    const data = JSON.stringify(Array.from(this.templates.values()));
    this.checkStorageSize(data, 'templates');
    localStorage.setItem(TEMPLATES_KEY, data);
  }

  /**
   * Persist collections to localStorage
   */
  private persistCollections(): void {
    const data = JSON.stringify(Array.from(this.collections.values()));
    this.checkStorageSize(data, 'collections');
    localStorage.setItem(COLLECTIONS_KEY, data);
  }

  /**
   * Check storage size and warn if approaching limits
   */
  private checkStorageSize(data: string, type: string): void {
    const size = new Blob([data]).size;
    if (size > SIZE_WARNING_THRESHOLD) {
      console.warn(
        `LocalStorage ${type} data is ${(size / 1024 / 1024).toFixed(2)}MB. ` +
        `Consider exporting data and clearing old items to avoid storage limits.`
      );
    }
  }


  // ==================== Recipe Operations ====================

  async createRecipe(recipe: Recipe): Promise<Recipe> {
    this.init();
    this.recipes.set(recipe.id, recipe);
    this.persistRecipes();
    return recipe;
  }

  async getRecipe(id: string): Promise<Recipe | null> {
    this.init();
    return this.recipes.get(id) || null;
  }

  async updateRecipe(id: string, updates: Partial<Recipe>): Promise<Recipe> {
    this.init();
    const existing = this.recipes.get(id);
    
    if (!existing) {
      throw new Error(`Recipe with id ${id} not found`);
    }

    const updated: Recipe = {
      ...existing,
      ...updates,
      id, // Ensure ID cannot be changed
      updatedAt: new Date().toISOString(),
    };

    this.recipes.set(id, updated);
    this.persistRecipes();
    return updated;
  }

  async deleteRecipe(id: string): Promise<void> {
    this.init();
    this.recipes.delete(id);
    this.persistRecipes();
  }

  async listRecipes(filter?: RecipeFilter): Promise<Recipe[]> {
    this.init();
    let recipes = Array.from(this.recipes.values());

    if (!filter) {
      return recipes;
    }

    // Apply tag filter
    if (filter.tags && filter.tags.length > 0) {
      if (filter.tagMatchMode === 'and') {
        recipes = recipes.filter(recipe =>
          filter.tags!.every(tag => recipe.tags.includes(tag))
        );
      } else {
        recipes = recipes.filter(recipe =>
          filter.tags!.some(tag => recipe.tags.includes(tag))
        );
      }
    }

    // Apply author filter
    if (filter.author) {
      recipes = recipes.filter(recipe => recipe.author === filter.author);
    }

    // Apply text search
    if (filter.searchText) {
      const searchLower = filter.searchText.toLowerCase();
      recipes = recipes.filter(recipe =>
        recipe.title.toLowerCase().includes(searchLower) ||
        recipe.ingredients.some(ing => ing.toLowerCase().includes(searchLower)) ||
        recipe.steps.some(step => step.toLowerCase().includes(searchLower))
      );
    }

    // Apply sorting
    recipes.sort((a, b) => {
      let comparison = 0;
      const sortBy = filter.sortBy || 'title';

      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'createdAt':
          comparison = a.createdAt.localeCompare(b.createdAt);
          break;
        case 'updatedAt':
          comparison = a.updatedAt.localeCompare(b.updatedAt);
          break;
        case 'author':
          comparison = (a.author || '').localeCompare(b.author || '');
          break;
      }

      return filter.sortOrder === 'desc' ? -comparison : comparison;
    });

    return recipes;
  }


  // ==================== Template Operations ====================

  async createTemplate(template: Template): Promise<Template> {
    this.init();
    this.templates.set(template.id, template);
    this.persistTemplates();
    return template;
  }

  async getTemplate(id: string): Promise<Template | null> {
    this.init();
    return this.templates.get(id) || null;
  }

  async updateTemplate(id: string, updates: Partial<Template>): Promise<Template> {
    this.init();
    const existing = this.templates.get(id);
    
    if (!existing) {
      throw new Error(`Template with id ${id} not found`);
    }

    const updated: Template = {
      ...existing,
      ...updates,
      id, // Ensure ID cannot be changed
      updatedAt: new Date().toISOString(),
    };

    this.templates.set(id, updated);
    this.persistTemplates();
    return updated;
  }

  async deleteTemplate(id: string): Promise<void> {
    this.init();
    const existing = this.templates.get(id);
    
    if (existing && existing.isDefault) {
      throw new Error('Cannot delete default template');
    }

    this.templates.delete(id);
    this.persistTemplates();
  }

  async listTemplates(): Promise<Template[]> {
    this.init();
    return Array.from(this.templates.values());
  }

  // ==================== Collection Operations ====================

  async createCollection(collection: Collection): Promise<Collection> {
    this.init();
    this.collections.set(collection.id, collection);
    this.persistCollections();
    return collection;
  }

  async getCollection(id: string): Promise<Collection | null> {
    this.init();
    return this.collections.get(id) || null;
  }

  async updateCollection(id: string, updates: Partial<Collection>): Promise<Collection> {
    this.init();
    const existing = this.collections.get(id);
    
    if (!existing) {
      throw new Error(`Collection with id ${id} not found`);
    }

    const updated: Collection = {
      ...existing,
      ...updates,
      id, // Ensure ID cannot be changed
      updatedAt: new Date().toISOString(),
    };

    this.collections.set(id, updated);
    this.persistCollections();
    return updated;
  }

  async deleteCollection(id: string): Promise<void> {
    this.init();
    this.collections.delete(id);
    this.persistCollections();
  }

  async listCollections(): Promise<Collection[]> {
    this.init();
    return Array.from(this.collections.values());
  }

  // ==================== Bulk Operations ====================

  async exportAll(): Promise<ExportData> {
    this.init();
    const recipes = Array.from(this.recipes.values());
    const templates = Array.from(this.templates.values());
    const collections = Array.from(this.collections.values());
    
    // Collect all unique tags from recipes
    const tagsSet = new Set<string>();
    recipes.forEach(recipe => {
      recipe.tags.forEach(tag => tagsSet.add(tag));
    });

    return {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      recipes,
      templates,
      tags: Array.from(tagsSet),
      collections,
    };
  }

  async importAll(data: ExportData): Promise<ImportResult> {
    this.init();
    const errors: ImportError[] = [];
    let recipesImported = 0;
    let templatesImported = 0;
    let collectionsImported = 0;

    // Import recipes
    for (const recipe of data.recipes) {
      try {
        this.recipes.set(recipe.id, recipe);
        recipesImported++;
      } catch (error) {
        errors.push({
          type: 'recipe',
          id: recipe.id,
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Import templates
    for (const template of data.templates) {
      try {
        this.templates.set(template.id, template);
        templatesImported++;
      } catch (error) {
        errors.push({
          type: 'template',
          id: template.id,
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Import collections (if present in export data)
    if (data.collections) {
      for (const collection of data.collections) {
        try {
          this.collections.set(collection.id, collection);
          collectionsImported++;
        } catch (error) {
          errors.push({
            type: 'collection',
            id: collection.id,
            message: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    }

    // Persist all changes
    this.persistRecipes();
    this.persistTemplates();
    this.persistCollections();

    return {
      success: errors.length === 0,
      recipesImported,
      templatesImported,
      collectionsImported,
      errors,
    };
  }

  /**
   * Clear all data (useful for testing)
   */
  async clear(): Promise<void> {
    this.recipes.clear();
    this.templates.clear();
    this.collections.clear();
    localStorage.removeItem(RECIPES_KEY);
    localStorage.removeItem(TEMPLATES_KEY);
    localStorage.removeItem(COLLECTIONS_KEY);
  }
}
