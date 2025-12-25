# Implementation Plan: Recipe Archive

## Overview

This implementation plan builds the Recipe Archive application incrementally, starting with core data models and storage, then adding OCR, filtering, templates, and export functionality. Each task builds on previous work, with property tests validating correctness at each stage.

## Tasks

- [x] 1. Project Setup and Core Data Models
  - [x] 1.1 Initialize React + TypeScript project with Vite
    - Set up project structure with src/components, src/services, src/adapters, src/types
    - Configure TypeScript strict mode
    - Install dependencies: react, typescript, fast-check, tesseract.js, jspdf, docx
    - _Requirements: 8.1, 8.2_

  - [x] 1.2 Implement core data types and interfaces
    - Create Recipe, Template, PrintSize, RecipeFilter interfaces
    - Create StorageAdapter, OCRAdapter, ExportAdapter interfaces
    - Define PRINT_SIZES constant with all supported sizes
    - _Requirements: 7.3, 8.1, 8.3, 8.4_

  - [x] 1.3 Write property test for Recipe data model validation
    - **Property 1: Recipe Persistence Round-Trip** (generator only, storage tested in 2.3)
    - Create arbitraryRecipe() generator for valid Recipe objects
    - _Requirements: 2.2, 7.1_

- [x] 2. Storage Layer Implementation
  - [x] 2.1 Implement IndexedDB Storage Adapter
    - Create IndexedDBStorageAdapter implementing StorageAdapter interface
    - Implement createRecipe, getRecipe, updateRecipe, deleteRecipe, listRecipes
    - Implement createTemplate, getTemplate, updateTemplate, deleteTemplate, listTemplates
    - Implement exportAll, importAll for backup/restore
    - _Requirements: 7.1, 7.2, 7.3, 8.2_

  - [x] 2.2 Implement localStorage fallback
    - Create LocalStorageAdapter as fallback when IndexedDB unavailable
    - Implement same interface with size warnings for large data
    - _Requirements: 7.1, 7.3_

  - [x] 2.3 Write property tests for storage operations
    - **Property 1: Recipe Persistence Round-Trip**
    - **Property 2: Recipe Deletion Removes Recipe**
    - **Property 8: Template Persistence Round-Trip**
    - **Property 15: All Saved Recipes Are Retrievable**
    - _Requirements: 2.2, 2.3, 4.2, 7.1, 7.2_

- [x] 3. Checkpoint - Storage Layer
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Recipe Filtering and Sorting
  - [x] 4.1 Implement recipe filtering logic
    - Create filterRecipes function with AND/OR tag matching
    - Implement author filtering
    - Implement text search across title, ingredients, steps
    - _Requirements: 3.3, 3.4_

  - [x] 4.2 Implement recipe sorting logic
    - Create sortRecipes function for title, createdAt, updatedAt, author
    - Support ascending and descending order
    - _Requirements: 3.5_

  - [x] 4.3 Write property tests for filtering and sorting
    - **Property 6: Filtering Returns Only Matching Recipes**
    - **Property 7: Sorting Orders Recipes Correctly**
    - Create arbitraryRecipeFilter() generator
    - _Requirements: 3.3, 3.4, 3.5_

- [x] 5. Tag Management
  - [x] 5.1 Implement tag operations
    - Create addTag, removeTag functions for recipes
    - Implement tag validation (non-empty, trimmed)
    - _Requirements: 3.1, 3.2, 3.6_

  - [x] 5.2 Write property tests for tag operations
    - **Property 4: Tag Addition Associates Tag**
    - **Property 5: Tag Removal Disassociates Tag**
    - _Requirements: 3.1, 3.2_

- [x] 6. Timestamp Management
  - [x] 6.1 Implement timestamp update logic
    - Create updateRecipeTimestamp function
    - Ensure updatedAt is set on all modifications
    - _Requirements: 2.5_

  - [x] 6.2 Write property test for timestamp updates
    - **Property 3: Recipe Modification Updates Timestamp**
    - _Requirements: 2.5_

- [x] 7. Checkpoint - Core Recipe Logic
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Template System
  - [x] 8.1 Implement template validation and management
    - Create validateTemplate function for boundary constraints
    - Create default templates for each PrintSize
    - Implement template CRUD with default template protection
    - _Requirements: 4.1, 4.2, 4.4, 4.5_

  - [x] 8.2 Implement section overlap detection
    - Create detectOverlaps function returning SectionOverlap[]
    - Calculate overlap area percentage
    - _Requirements: 5.2, 5.3, 5.4_

  - [x] 8.3 Write property tests for template system
    - **Property 9: Default Templates Cannot Be Deleted**
    - **Property 10: Template Sections Respect Boundary Constraints**
    - **Property 16: Overlap Detection Identifies All Overlapping Sections**
    - Create arbitraryTemplate() generator
    - _Requirements: 4.5, 5.2, 5.3, 5.5_

- [x] 9. OCR Integration
  - [x] 9.1 Implement Tesseract.js OCR Adapter
    - Create TesseractOCRAdapter implementing OCRAdapter interface
    - Implement initialize, recognizeText, terminate methods
    - Add author inference from common patterns ("By", "From", "Recipe by")
    - _Requirements: 1.2, 1.4, 8.3_

  - [x] 9.2 Implement image upload handler
    - Create ImageUploadHandler for JPEG, PNG, PDF validation
    - Convert uploaded files to format suitable for OCR
    - _Requirements: 1.1_

  - [x] 9.3 Write unit tests for OCR adapter
    - Test author inference patterns
    - Test error handling for failed OCR
    - Mock Tesseract.js for predictable testing
    - _Requirements: 1.4, 1.5_

- [x] 10. Checkpoint - OCR Integration
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Export System
  - [x] 11.1 Implement PDF export adapter
    - Create jsPDFExportAdapter for PDF generation
    - Apply template layout to generated PDF
    - Match document dimensions to PrintSize
    - _Requirements: 6.1, 6.3, 6.6_

  - [x] 11.2 Implement DOCX export adapter
    - Create DOCXExportAdapter for Word document generation
    - Apply template sections to document structure
    - _Requirements: 6.7_

  - [x] 11.3 Implement content overflow detection
    - Create detectOverflow function for content vs template bounds
    - Return list of sections that overflow
    - _Requirements: 6.5_

  - [x] 11.4 Write property tests for export system
    - **Property 11: Print Document Matches Selected Size**
    - **Property 12: Print Document Contains All Template Sections**
    - **Property 13: Overflow Detection Identifies Boundary Violations**
    - _Requirements: 6.1, 6.3, 6.5_

- [x] 12. Import/Export Backup System
  - [x] 12.1 Implement JSON export for backup
    - Create exportToJSON function generating ExportData
    - Include version, timestamp, all recipes and templates
    - _Requirements: 7.4_

  - [x] 12.2 Implement JSON import for restore
    - Create importFromJSON function with validation
    - Handle schema validation, duplicate IDs
    - Return ImportResult with success/error details
    - _Requirements: 7.5_

  - [x] 12.3 Write property test for import/export
    - **Property 14: Export/Import Round-Trip Preserves Data**
    - _Requirements: 7.4, 7.5_

- [x] 13. Checkpoint - Export System
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. React UI Components
  - [x] 14.1 Implement App shell and routing
    - Create AppShell component with navigation
    - Set up React Router for recipe list, editor, template manager views
    - _Requirements: 2.1_

  - [x] 14.2 Implement RecipeList component
    - Create RecipeList with filter controls (tags, author, search)
    - Add tag match mode toggle (AND/OR)
    - Add sort controls
    - _Requirements: 3.3, 3.4, 3.5_

  - [x] 14.3 Implement RecipeEditor component
    - Create RecipeEditor form for title, author, ingredients, steps, notes
    - Add image attachment support
    - Add tag management UI
    - _Requirements: 2.1, 2.2, 2.4, 2.6, 2.7, 3.1, 3.2_

  - [x] 14.4 Implement recipe creation mode selector
    - Create RecipeCreationMode component with OCR/Manual options
    - Wire up ImageUploader for OCR path
    - Wire up ManualRecipeCreator for manual path
    - _Requirements: 1.1, 2.1_

  - [x] 14.5 Implement ImageUploader component
    - Create drag-and-drop image upload UI
    - Show OCR progress indicator
    - Display extracted text in editable area
    - Show inferred author with edit option
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [x] 15. Template Editor UI
  - [x] 15.1 Implement TemplateList component
    - Create TemplateList showing all templates
    - Indicate default vs custom templates
    - Add create/edit/delete actions (protect defaults)
    - _Requirements: 4.1, 4.5_

  - [x] 15.2 Implement WYSIWYG TemplateEditor component
    - Create visual template editor with draggable sections
    - Show section boundaries and overlap highlights
    - Add section resize handles
    - Enforce card boundary constraints
    - _Requirements: 4.2, 4.3, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 16. Print and Export UI
  - [x] 16.1 Implement PrintPreview component
    - Create print preview modal with template selection
    - Show content overflow warnings
    - Add print size selector
    - Add duplex printing option
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 16.2 Implement export actions
    - Add PDF export button with download
    - Add DOCX export button with download
    - Add JSON backup export/import
    - _Requirements: 6.6, 6.7, 7.4, 7.5_

- [x] 17. Final Checkpoint
  - Ensure all tests pass, ask the user if questions arise.
  - Verify all 16 correctness properties are tested
  - Run full test suite with 100+ iterations per property test

## Notes

- All tasks are required for comprehensive implementation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation uses TypeScript with React, fast-check for property testing
