/**
 * Recipe data types
 */

export interface Recipe {
  id: string;
  title: string;
  author: string | null;
  ingredients: string[];
  steps: string[];
  notes: string | null;
  images: RecipeImage[];
  tags: string[];
  sourceImage: string | null; // Original scanned image
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export interface RecipeImage {
  id: string;
  data: string; // Base64 encoded
  caption: string | null;
  position: 'inline' | 'header' | 'footer';
}

export interface RecipeFilter {
  tags?: string[];
  tagMatchMode: 'and' | 'or'; // 'and' by default
  author?: string;
  searchText?: string;
  sortBy: 'title' | 'createdAt' | 'updatedAt' | 'author';
  sortOrder: 'asc' | 'desc';
}
