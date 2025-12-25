/**
 * IndexedDB Storage Adapter
 * Implements StorageAdapter interface using IndexedDB for persistent storage
 * Requirements: 7.1, 7.2, 7.3, 8.2
 */

import type {
  StorageAdapter,
  ExportData,
  ImportResult,
  ImportError,
} from '../types/adapters';
import type { Recipe, RecipeFilter } from '../types/recipe';
import type { Template } from '../types/template';

const DB_NAME = 'recipe-archive';
const DB_VERSION = 1;
const RECIPES_STORE = 'recipes';
const TEMPLATES_STORE = 'templates';

export class IndexedDBStorageAdapter implements StorageAdapter {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize the IndexedDB database
   */
  private async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create recipes store with indexes
        if (!db.objectStoreNames.contains(RECIPES_STORE)) {
          const recipesStore = db.createObjectStore(RECIPES_STORE, { keyPath: 'id' });
          recipesStore.createIndex('title', 'title', { unique: false });
          recipesStore.createIndex('author', 'author', { unique: false });
          recipesStore.createIndex('createdAt', 'createdAt', { unique: false });
          recipesStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        // Create templates store
        if (!db.objectStoreNames.contains(TEMPLATES_STORE)) {
          const templatesStore = db.createObjectStore(TEMPLATES_STORE, { keyPath: 'id' });
          templatesStore.createIndex('name', 'name', { unique: false });
          templatesStore.createIndex('isDefault', 'isDefault', { unique: false });
        }
      };
    });

    return this.initPromise;
  }


  /**
   * Get a transaction for the specified store
   */
  private async getTransaction(
    storeName: string,
    mode: IDBTransactionMode
  ): Promise<IDBObjectStore> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');
    const transaction = this.db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  /**
   * Wrap IDBRequest in a Promise
   */
  private promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // ==================== Recipe Operations ====================

  async createRecipe(recipe: Recipe): Promise<Recipe> {
    const store = await this.getTransaction(RECIPES_STORE, 'readwrite');
    await this.promisifyRequest(store.add(recipe));
    return recipe;
  }

  async getRecipe(id: string): Promise<Recipe | null> {
    const store = await this.getTransaction(RECIPES_STORE, 'readonly');
    const result = await this.promisifyRequest(store.get(id));
    return result || null;
  }

  async updateRecipe(id: string, updates: Partial<Recipe>): Promise<Recipe> {
    const store = await this.getTransaction(RECIPES_STORE, 'readwrite');
    const existing = await this.promisifyRequest(store.get(id));
    
    if (!existing) {
      throw new Error(`Recipe with id ${id} not found`);
    }

    const updated: Recipe = {
      ...existing,
      ...updates,
      id, // Ensure ID cannot be changed
      updatedAt: new Date().toISOString(),
    };

    await this.promisifyRequest(store.put(updated));
    return updated;
  }

  async deleteRecipe(id: string): Promise<void> {
    const store = await this.getTransaction(RECIPES_STORE, 'readwrite');
    await this.promisifyRequest(store.delete(id));
  }

  async listRecipes(filter?: RecipeFilter): Promise<Recipe[]> {
    const store = await this.getTransaction(RECIPES_STORE, 'readonly');
    const recipes: Recipe[] = await this.promisifyRequest(store.getAll());

    if (!filter) {
      return recipes;
    }

    let filtered = recipes;

    // Apply tag filter
    if (filter.tags && filter.tags.length > 0) {
      if (filter.tagMatchMode === 'and') {
        filtered = filtered.filter(recipe =>
          filter.tags!.every(tag => recipe.tags.includes(tag))
        );
      } else {
        filtered = filtered.filter(recipe =>
          filter.tags!.some(tag => recipe.tags.includes(tag))
        );
      }
    }

    // Apply author filter
    if (filter.author) {
      filtered = filtered.filter(recipe => recipe.author === filter.author);
    }

    // Apply text search
    if (filter.searchText) {
      const searchLower = filter.searchText.toLowerCase();
      filtered = filtered.filter(recipe =>
        recipe.title.toLowerCase().includes(searchLower) ||
        recipe.ingredients.some(ing => ing.toLowerCase().includes(searchLower)) ||
        recipe.steps.some(step => step.toLowerCase().includes(searchLower))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
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

    return filtered;
  }


  // ==================== Template Operations ====================

  async createTemplate(template: Template): Promise<Template> {
    const store = await this.getTransaction(TEMPLATES_STORE, 'readwrite');
    await this.promisifyRequest(store.add(template));
    return template;
  }

  async getTemplate(id: string): Promise<Template | null> {
    const store = await this.getTransaction(TEMPLATES_STORE, 'readonly');
    const result = await this.promisifyRequest(store.get(id));
    return result || null;
  }

  async updateTemplate(id: string, updates: Partial<Template>): Promise<Template> {
    const store = await this.getTransaction(TEMPLATES_STORE, 'readwrite');
    const existing = await this.promisifyRequest(store.get(id));
    
    if (!existing) {
      throw new Error(`Template with id ${id} not found`);
    }

    const updated: Template = {
      ...existing,
      ...updates,
      id, // Ensure ID cannot be changed
      updatedAt: new Date().toISOString(),
    };

    await this.promisifyRequest(store.put(updated));
    return updated;
  }

  async deleteTemplate(id: string): Promise<void> {
    const store = await this.getTransaction(TEMPLATES_STORE, 'readwrite');
    const existing = await this.promisifyRequest(store.get(id));
    
    if (existing && existing.isDefault) {
      throw new Error('Cannot delete default template');
    }

    await this.promisifyRequest(store.delete(id));
  }

  async listTemplates(): Promise<Template[]> {
    const store = await this.getTransaction(TEMPLATES_STORE, 'readonly');
    return this.promisifyRequest(store.getAll());
  }

  // ==================== Bulk Operations ====================

  async exportAll(): Promise<ExportData> {
    const recipes = await this.listRecipes();
    const templates = await this.listTemplates();
    
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
    };
  }

  async importAll(data: ExportData): Promise<ImportResult> {
    const errors: ImportError[] = [];
    let recipesImported = 0;
    let templatesImported = 0;

    // Import recipes
    for (const recipe of data.recipes) {
      try {
        // Check if recipe already exists
        const existing = await this.getRecipe(recipe.id);
        if (existing) {
          await this.updateRecipe(recipe.id, recipe);
        } else {
          await this.createRecipe(recipe);
        }
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
        // Check if template already exists
        const existing = await this.getTemplate(template.id);
        if (existing) {
          await this.updateTemplate(template.id, template);
        } else {
          await this.createTemplate(template);
        }
        templatesImported++;
      } catch (error) {
        errors.push({
          type: 'template',
          id: template.id,
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      success: errors.length === 0,
      recipesImported,
      templatesImported,
      errors,
    };
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initPromise = null;
    }
  }

  /**
   * Clear all data (useful for testing)
   */
  async clear(): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([RECIPES_STORE, TEMPLATES_STORE], 'readwrite');
    
    await Promise.all([
      this.promisifyRequest(transaction.objectStore(RECIPES_STORE).clear()),
      this.promisifyRequest(transaction.objectStore(TEMPLATES_STORE).clear()),
    ]);
  }
}
