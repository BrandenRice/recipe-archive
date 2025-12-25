# Implementation Plan: Recipe Collections

## Overview

This implementation plan breaks down the recipe collections feature into incremental coding tasks. Each task builds on previous work, starting with data types and storage, then services, and finally UI components. Property-based tests are included as sub-tasks to validate correctness early.

## Tasks

- [x] 1. Define Collection data types
  - [x] 1.1 Create Collection interface in `src/types/collection.ts`
    - Define Collection interface with id, name, description, recipeIds, createdAt, updatedAt
    - Export from `src/types/index.ts`
    - _Requirements: 1.2, 7.1_

  - [x] 1.2 Extend ExportData interface to include collections
    - Add optional `collections?: Collection[]` field to ExportData in `src/types/adapters.ts`
    - _Requirements: 7.3, 7.4_

- [x] 2. Extend IndexedDB storage adapter for collections
  - [x] 2.1 Add collections object store to IndexedDB
    - Update DB_VERSION and add 'collections' store in `onupgradeneeded`
    - Create index on 'name' field
    - _Requirements: 7.1_

  - [x] 2.2 Implement collection CRUD operations in storage adapter
    - Add createCollection, getCollection, updateCollection, deleteCollection, listCollections methods
    - Follow existing pattern from recipe/template operations
    - _Requirements: 1.5, 4.2_

  - [ ]* 2.3 Write property test for collection persistence round-trip
    - **Property 3: Collection Persistence Round-Trip**
    - **Validates: Requirements 1.5**

  - [ ]* 2.4 Write property test for delete removes collection
    - **Property 9: Delete Removes Collection**
    - **Validates: Requirements 4.2**

  - [x] 2.5 Update exportAll and importAll to include collections
    - Modify exportAll to include collections in export data
    - Modify importAll to import collections with merge behavior
    - _Requirements: 7.3, 7.4_

  - [ ]* 2.6 Write property test for backup round-trip
    - **Property 12: Backup Round-Trip**
    - **Validates: Requirements 7.3, 7.4**

- [x] 3. Checkpoint - Ensure storage tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement collection operations service
  - [x] 4.1 Create `src/services/collectionOperations.ts` with core functions
    - Implement createCollection(name, description) function
    - Implement validateCollectionName(name) function
    - Implement sortCollections(collections) function
    - _Requirements: 1.2, 1.3, 1.4, 2.4_

  - [ ]* 4.2 Write property test for collection creation structure
    - **Property 1: Collection Creation Structure**
    - **Validates: Requirements 1.2**

  - [ ]* 4.3 Write property test for whitespace name rejection
    - **Property 2: Whitespace Name Rejection**
    - **Validates: Requirements 1.3, 1.4, 3.5**

  - [ ]* 4.4 Write property test for alphabetical sorting
    - **Property 4: Alphabetical Sorting**
    - **Validates: Requirements 2.4**

  - [x] 4.5 Implement recipe management functions
    - Implement addRecipeToCollection(collection, recipeId) function
    - Implement removeRecipeFromCollection(collection, recipeId) function
    - Implement getCollectionsForRecipe(collections, recipeId) function
    - _Requirements: 3.3, 3.4, 8.6_

  - [ ]* 4.6 Write property test for add recipe inclusion
    - **Property 6: Add Recipe Inclusion**
    - **Validates: Requirements 3.3, 8.3**

  - [ ]* 4.7 Write property test for remove recipe exclusion
    - **Property 7: Remove Recipe Exclusion**
    - **Validates: Requirements 3.4**

  - [ ]* 4.8 Write property test for add recipe idempotence
    - **Property 8: Add Recipe Idempotence**
    - **Validates: Requirements 3.6, 8.4**

  - [ ]* 4.9 Write property test for get collections for recipe
    - **Property 13: Get Collections For Recipe**
    - **Validates: Requirements 8.6**

  - [x] 4.10 Implement collection export function
    - Implement exportCollectionToJSON(collection, recipes) function
    - Filter recipes to only those in collection
    - _Requirements: 5.3_

  - [ ]* 4.11 Write property test for JSON export contains recipes
    - **Property 11: JSON Export Contains Recipes**
    - **Validates: Requirements 5.3**

  - [x] 4.12 Export service functions from `src/services/index.ts`
    - _Requirements: All service requirements_

- [x] 5. Checkpoint - Ensure service tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement Collections UI components
  - [x] 6.1 Create CollectionList component
    - Display collections in card grid layout
    - Show name, description, recipe count for each collection
    - Include create, edit, delete action buttons
    - _Requirements: 2.1, 4.1_

  - [x] 6.2 Create CollectionDetail component
    - Display collection name, description, and full recipe list
    - Include remove recipe buttons
    - Include export buttons (PDF, JSON)
    - Handle empty collection state
    - _Requirements: 2.2, 2.3, 3.4, 5.1, 5.4_

  - [x] 6.3 Create CollectionsPage component
    - Manage view mode (list vs detail)
    - Handle collection CRUD operations
    - Wire up storage adapter calls
    - _Requirements: 2.1, 2.2, 4.2, 4.4_

  - [x] 6.4 Create AddToCollectionModal component
    - Display list of all collections with checkmarks for membership
    - Allow selecting/deselecting collections
    - Include quick create new collection option
    - _Requirements: 8.2, 8.3, 8.4_

- [x] 7. Integrate collections with existing components
  - [x] 7.1 Add Collections tab to AppShell navigation
    - Add NavLink for "/collections" route
    - Style active state indicator
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 7.2 Add route for CollectionsPage in App.tsx
    - Add Route element for "/collections" path
    - _Requirements: 6.2_

  - [x] 7.3 Enhance RecipeCard with collection features
    - Add "Add to Collection" button
    - Display collection indicators (badges/tags)
    - Pass collections data as prop
    - _Requirements: 8.1, 8.5, 8.6_

  - [x] 7.4 Update RecipeList to pass collections to RecipeCard
    - Fetch collections on mount
    - Pass collections and handlers to RecipeCard
    - _Requirements: 8.5, 8.6_

- [x] 8. Implement collection update functionality
  - [x] 8.1 Add edit collection form/modal
    - Allow editing name and description
    - Validate name on submit
    - _Requirements: 3.1, 3.2, 3.5_

  - [ ]* 8.2 Write property test for update preserves changes
    - **Property 5: Update Preserves Changes**
    - **Validates: Requirements 3.1, 3.2**

- [x] 9. Implement delete with recipe preservation
  - [x] 9.1 Add delete confirmation dialog
    - Show confirmation before deletion
    - Handle cancel action
    - _Requirements: 4.1, 4.4_

  - [ ]* 9.2 Write property test for delete preserves recipes
    - **Property 10: Delete Preserves Recipes**
    - **Validates: Requirements 4.3**

- [x] 10. Add collection export functionality
  - [x] 10.1 Implement PDF export for collection
    - Generate PDF with all recipes using default template
    - Handle empty collection case
    - _Requirements: 5.2, 5.4_

  - [x] 10.2 Implement JSON export for collection
    - Generate JSON file with collection recipes
    - Trigger download
    - _Requirements: 5.3_

- [x] 11. Update backup operations for collections
  - [x] 11.1 Update backupOperations.ts to handle collections
    - Extend exportToJSON to include collections
    - Extend importFromJSON to validate and import collections
    - _Requirements: 7.3, 7.4_

- [x] 12. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
