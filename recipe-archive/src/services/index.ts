/**
 * Services module exports
 */

export {
  filterRecipes,
  sortRecipes,
  filterAndSortRecipes,
} from './recipeFiltering';

export {
  validateTag,
  addTag,
  removeTag,
} from './tagOperations';

export {
  updateRecipeTimestamp,
  applyRecipeModification,
} from './timestampOperations';

export {
  ImageUploadHandler,
  validateImageFile,
  processImageForOCR,
  createImagePreviewUrl,
  isSupportedImageType,
  SUPPORTED_IMAGE_TYPES,
} from './imageUploadHandler';

export type {
  ImageValidationResult,
  ProcessedImage,
  SupportedImageType,
} from './imageUploadHandler';

export {
  detectOverflow,
  hasContentOverflow,
  getOverflowingSectionIds,
} from './overflowDetection';

export type {
  SectionOverflowResult,
  OverflowDetectionResult,
} from './overflowDetection';

export {
  exportToJSON,
  importFromJSON,
  createExportBlob,
  generateExportFilename,
} from './backupOperations';

export {
  createDefaultTemplates,
  createBlankTemplate,
  validateSectionBoundaries,
  validateTemplate,
  detectOverlaps,
  constrainSectionToBoundaries,
  addSectionToTemplate,
  updateSectionInTemplate,
  removeSectionFromTemplate,
} from './templateOperations';

export {
  createCollection,
  validateCollectionName,
  sortCollections,
  addRecipeToCollection,
  removeRecipeFromCollection,
  getCollectionsForRecipe,
  exportCollectionToJSON,
  exportCollectionToPDF,
  downloadBlob,
} from './collectionOperations';

export type { ValidationResult, CollectionPDFExportResult } from './collectionOperations';
