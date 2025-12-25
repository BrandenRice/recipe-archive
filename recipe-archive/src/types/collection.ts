/**
 * Collection data types
 */

export interface Collection {
  id: string;
  name: string;
  description: string | null;
  recipeIds: string[];
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}
