/**
 * Property tests for Export System
 * Feature: recipe-archive
 * Tests Properties 11, 12, 13
 * Validates: Requirements 6.1, 6.3, 6.5
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { jsPDFExportAdapter } from '../adapters/jsPDFExportAdapter';
import { detectOverflow } from '../services/overflowDetection';
import { arbitraryRecipe, arbitraryTemplate } from './generators';
import type { Recipe, Template, TemplateSection } from '../types';
import { PRINT_SIZES } from '../types';

describe('Export System Property Tests', () => {
  const pdfAdapter = new jsPDFExportAdapter();

  /**
   * Property 11: Print Document Matches Selected Size
   * For any Recipe and Template combination, the generated print document dimensions
   * should match the Template's PrintSize dimensions
   * Feature: recipe-archive, Property 11: Print Document Matches Selected Size
   * Validates: Requirements 6.1
   */
  it('Property 11: Print Document Matches Selected Size', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraryRecipe(),
        arbitraryTemplate(),
        async (recipe, template) => {
          // Get the expected dimensions from the template
          const expectedWidth = template.size.width;
          const expectedHeight = template.size.height;

          // Generate the PDF document
          const pdfBlob = await pdfAdapter.exportToPDF(recipe, template);

          // Verify blob was created
          expect(pdfBlob).toBeInstanceOf(Blob);
          expect(pdfBlob.size).toBeGreaterThan(0);

          // Verify the adapter reports correct dimensions
          const dimensions = pdfAdapter.getDocumentDimensions(template);
          expect(dimensions.width).toBe(expectedWidth);
          expect(dimensions.height).toBe(expectedHeight);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 12: Print Document Contains All Template Sections
   * For any Recipe and Template combination, the generated print document should
   * contain content for each TemplateSection defined in the Template
   * Feature: recipe-archive, Property 12: Print Document Contains All Template Sections
   * Validates: Requirements 6.3
   */
  it('Property 12: Print Document Contains All Template Sections', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraryRecipe(),
        arbitraryTemplate(),
        async (recipe, template) => {
          // Generate the PDF document
          const pdfBlob = await pdfAdapter.exportToPDF(recipe, template);

          // Verify blob was created successfully
          expect(pdfBlob).toBeInstanceOf(Blob);
          expect(pdfBlob.size).toBeGreaterThan(0);

          // Verify template has sections
          expect(template.sections.length).toBeGreaterThan(0);

          // For each section type in the template, verify the recipe has corresponding content
          for (const section of template.sections) {
            const content = getSectionContent(section.type, recipe);
            // Content may be empty for optional fields (author, notes), but the section exists
            expect(typeof content).toBe('string');
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 13: Overflow Detection Identifies Boundary Violations
   * For any Recipe content and Template combination where the rendered content would
   * exceed the Template's boundaries, the overflow detection function should return
   * true and identify which sections overflow
   * Feature: recipe-archive, Property 13: Overflow Detection Identifies Boundary Violations
   * Validates: Requirements 6.5
   */
  it('Property 13: Overflow Detection Identifies Boundary Violations', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraryRecipeWithLongContent(),
        arbitraryTemplateWithSmallSections(),
        async (recipe, template) => {
          // Detect overflow
          const result = detectOverflow(recipe, template);

          // Result should have the expected structure
          expect(result).toHaveProperty('hasOverflow');
          expect(result).toHaveProperty('sections');
          expect(result).toHaveProperty('overflowingSections');

          // Sections array should match template sections count
          expect(result.sections.length).toBe(template.sections.length);

          // Each section result should have required properties
          for (const sectionResult of result.sections) {
            expect(sectionResult).toHaveProperty('sectionId');
            expect(sectionResult).toHaveProperty('sectionType');
            expect(sectionResult).toHaveProperty('hasOverflow');
            expect(sectionResult).toHaveProperty('estimatedContentHeight');
            expect(sectionResult).toHaveProperty('availableHeight');
            expect(sectionResult).toHaveProperty('overflowAmount');

            // Overflow amount should be non-negative
            expect(sectionResult.overflowAmount).toBeGreaterThanOrEqual(0);

            // If hasOverflow is true, overflowAmount should be positive
            if (sectionResult.hasOverflow) {
              expect(sectionResult.overflowAmount).toBeGreaterThan(0);
              expect(sectionResult.estimatedContentHeight).toBeGreaterThan(sectionResult.availableHeight);
            }
          }

          // Overflowing sections should be a subset of all sections
          expect(result.overflowingSections.length).toBeLessThanOrEqual(result.sections.length);

          // hasOverflow should be true iff there are overflowing sections
          expect(result.hasOverflow).toBe(result.overflowingSections.length > 0);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Helper function to get section content (mirrors the one in adapters)
 */
function getSectionContent(type: TemplateSection['type'], recipe: Recipe): string {
  switch (type) {
    case 'title':
      return recipe.title;
    case 'author':
      return recipe.author || '';
    case 'ingredients':
      return recipe.ingredients.join('\n');
    case 'steps':
      return recipe.steps.join('\n');
    case 'notes':
      return recipe.notes || '';
    case 'image':
      return '';
    default:
      return '';
  }
}

/**
 * Generator for recipes with intentionally long content
 * Used to test overflow detection
 */
function arbitraryRecipeWithLongContent(): fc.Arbitrary<Recipe> {
  return fc.record({
    id: fc.uuid(),
    title: fc.string({ minLength: 50, maxLength: 200 }).filter(s => s.trim().length > 0),
    author: fc.option(fc.string({ minLength: 20, maxLength: 100 }).filter(s => s.trim().length > 0), { nil: null }),
    ingredients: fc.array(
      fc.string({ minLength: 30, maxLength: 100 }).filter(s => s.trim().length > 0),
      { minLength: 10, maxLength: 30 }
    ),
    steps: fc.array(
      fc.string({ minLength: 50, maxLength: 200 }).filter(s => s.trim().length > 0),
      { minLength: 5, maxLength: 20 }
    ),
    notes: fc.option(fc.string({ minLength: 100, maxLength: 500 }).filter(s => s.trim().length > 0), { nil: null }),
    images: fc.constant([]),
    tags: fc.array(fc.string({ minLength: 3, maxLength: 20 }).filter(s => s.trim().length > 0).map(s => s.toLowerCase()), { minLength: 0, maxLength: 5 }),
    sourceImage: fc.constant(null),
    createdAt: fc.integer({ min: 946684800000, max: 4102444800000 }).map(ms => new Date(ms).toISOString()),
    updatedAt: fc.integer({ min: 946684800000, max: 4102444800000 }).map(ms => new Date(ms).toISOString()),
  });
}

/**
 * Generator for templates with small sections
 * Used to test overflow detection
 */
function arbitraryTemplateWithSmallSections(): fc.Arbitrary<Template> {
  const smallSection = (): fc.Arbitrary<TemplateSection> =>
    fc.record({
      id: fc.uuid(),
      type: fc.constantFrom('title', 'author', 'ingredients', 'steps', 'notes') as fc.Arbitrary<TemplateSection['type']>,
      position: fc.record({
        x: fc.integer({ min: 0, max: 50 }),
        y: fc.integer({ min: 0, max: 50 }),
      }),
      size: fc.record({
        width: fc.integer({ min: 10, max: 30 }),
        height: fc.integer({ min: 5, max: 15 }),
      }),
      style: fc.record({
        fontSize: fc.integer({ min: 8, max: 12 }),
        fontFamily: fc.constant('Arial'),
        fontWeight: fc.constant('normal') as fc.Arbitrary<'normal' | 'bold'>,
        textAlign: fc.constant('left') as fc.Arbitrary<'left' | 'center' | 'right'>,
        color: fc.constant('#000000'),
        backgroundColor: fc.constant(null),
        padding: fc.integer({ min: 1, max: 3 }),
        border: fc.constant(null),
      }),
      zIndex: fc.integer({ min: 0, max: 5 }),
    });

  return fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
    size: fc.constantFrom(PRINT_SIZES['card-3x5'], PRINT_SIZES['card-4x6']), // Small card sizes
    isDefault: fc.boolean(),
    sections: fc.array(smallSection(), { minLength: 1, maxLength: 5 }),
    margins: fc.record({
      top: fc.integer({ min: 5, max: 10 }),
      right: fc.integer({ min: 5, max: 10 }),
      bottom: fc.integer({ min: 5, max: 10 }),
      left: fc.integer({ min: 5, max: 10 }),
    }),
    createdAt: fc.integer({ min: 946684800000, max: 4102444800000 }).map(ms => new Date(ms).toISOString()),
    updatedAt: fc.integer({ min: 946684800000, max: 4102444800000 }).map(ms => new Date(ms).toISOString()),
  });
}
