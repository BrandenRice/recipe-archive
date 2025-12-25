/**
 * Property-based testing generators for Recipe Archive
 * Uses fast-check for generating valid test data
 */

import * as fc from 'fast-check';
import type { Recipe, RecipeImage, RecipeFilter, Template, TemplateSection, PrintSize, SectionStyle, Margins } from '../types';
import { PRINT_SIZES } from '../types';

/**
 * Generates a valid UUID-like string
 */
export const arbitraryId = (): fc.Arbitrary<string> =>
  fc.uuid();

/**
 * Generates a valid ISO 8601 timestamp string
 */
export const arbitraryTimestamp = (): fc.Arbitrary<string> =>
  fc.integer({ min: 946684800000, max: 4102444800000 }) // 2000-01-01 to 2100-01-01 in ms
    .map(ms => new Date(ms).toISOString());

/**
 * Generates a non-empty trimmed string suitable for titles/names
 */
export const arbitraryNonEmptyString = (): fc.Arbitrary<string> =>
  fc.string({ minLength: 1, maxLength: 100 })
    .filter(s => s.trim().length > 0)
    .map(s => s.trim());

/**
 * Generates a valid tag string (non-empty, trimmed, lowercase)
 */
export const arbitraryTag = (): fc.Arbitrary<string> =>
  fc.string({ minLength: 1, maxLength: 50 })
    .filter(s => s.trim().length > 0)
    .map(s => s.trim().toLowerCase());

/**
 * Generates a valid RecipeImage object
 */
export const arbitraryRecipeImage = (): fc.Arbitrary<RecipeImage> =>
  fc.record({
    id: arbitraryId(),
    data: fc.base64String({ minLength: 10, maxLength: 100 }),
    caption: fc.option(arbitraryNonEmptyString(), { nil: null }),
    position: fc.constantFrom('inline', 'header', 'footer') as fc.Arbitrary<'inline' | 'header' | 'footer'>,
  });


/**
 * Generates a valid Recipe object
 * Feature: recipe-archive, Property 1: Recipe Persistence Round-Trip
 * Validates: Requirements 2.2, 7.1
 */
export const arbitraryRecipe = (): fc.Arbitrary<Recipe> =>
  fc.record({
    id: arbitraryId(),
    title: arbitraryNonEmptyString(),
    author: fc.option(arbitraryNonEmptyString(), { nil: null }),
    ingredients: fc.array(arbitraryNonEmptyString(), { minLength: 1, maxLength: 20 }),
    steps: fc.array(arbitraryNonEmptyString(), { minLength: 1, maxLength: 20 }),
    notes: fc.option(arbitraryNonEmptyString(), { nil: null }),
    images: fc.array(arbitraryRecipeImage(), { minLength: 0, maxLength: 5 }),
    tags: fc.array(arbitraryTag(), { minLength: 0, maxLength: 10 }),
    sourceImage: fc.option(fc.base64String({ minLength: 10, maxLength: 100 }), { nil: null }),
    createdAt: arbitraryTimestamp(),
    updatedAt: arbitraryTimestamp(),
  });

/**
 * Generates a valid RecipeFilter object
 */
export const arbitraryRecipeFilter = (): fc.Arbitrary<RecipeFilter> =>
  fc.record({
    tags: fc.option(fc.array(arbitraryTag(), { minLength: 1, maxLength: 5 }), { nil: undefined }),
    tagMatchMode: fc.constantFrom('and', 'or') as fc.Arbitrary<'and' | 'or'>,
    author: fc.option(arbitraryNonEmptyString(), { nil: undefined }),
    searchText: fc.option(arbitraryNonEmptyString(), { nil: undefined }),
    sortBy: fc.constantFrom('title', 'createdAt', 'updatedAt', 'author') as fc.Arbitrary<'title' | 'createdAt' | 'updatedAt' | 'author'>,
    sortOrder: fc.constantFrom('asc', 'desc') as fc.Arbitrary<'asc' | 'desc'>,
  });


/**
 * Generates a valid PrintSize object
 */
export const arbitraryPrintSize = (): fc.Arbitrary<PrintSize> =>
  fc.constantFrom(...Object.values(PRINT_SIZES));

/**
 * Generates a valid hex color string
 */
export const arbitraryHexColor = (): fc.Arbitrary<string> =>
  fc.tuple(
    fc.integer({ min: 0, max: 255 }),
    fc.integer({ min: 0, max: 255 }),
    fc.integer({ min: 0, max: 255 })
  ).map(([r, g, b]) => 
    `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  );

/**
 * Generates a valid SectionStyle object
 */
export const arbitrarySectionStyle = (): fc.Arbitrary<SectionStyle> =>
  fc.record({
    fontSize: fc.integer({ min: 8, max: 72 }),
    fontFamily: fc.constantFrom('Arial', 'Times New Roman', 'Helvetica', 'Georgia'),
    fontWeight: fc.constantFrom('normal', 'bold') as fc.Arbitrary<'normal' | 'bold'>,
    textAlign: fc.constantFrom('left', 'center', 'right') as fc.Arbitrary<'left' | 'center' | 'right'>,
    color: arbitraryHexColor(),
    backgroundColor: fc.option(arbitraryHexColor(), { nil: null }),
    padding: fc.integer({ min: 0, max: 20 }),
    border: fc.option(
      fc.record({
        width: fc.integer({ min: 1, max: 5 }),
        style: fc.constantFrom('solid', 'dashed', 'dotted') as fc.Arbitrary<'solid' | 'dashed' | 'dotted'>,
        color: arbitraryHexColor(),
      }),
      { nil: null }
    ),
  });

/**
 * Generates a valid TemplateSection object
 * Ensures sections stay within card boundaries (x + width <= 100, y + height <= 100)
 */
export const arbitraryTemplateSection = (): fc.Arbitrary<TemplateSection> =>
  fc.record({
    id: arbitraryId(),
    type: fc.constantFrom('title', 'author', 'ingredients', 'steps', 'notes', 'image') as fc.Arbitrary<'title' | 'author' | 'ingredients' | 'steps' | 'notes' | 'image'>,
    position: fc.record({
      x: fc.integer({ min: 0, max: 80 }),
      y: fc.integer({ min: 0, max: 80 }),
    }),
    size: fc.record({
      width: fc.integer({ min: 10, max: 100 }),
      height: fc.integer({ min: 10, max: 100 }),
    }),
    style: arbitrarySectionStyle(),
    zIndex: fc.integer({ min: 0, max: 10 }),
  }).filter(section => 
    // Ensure section stays within boundaries
    section.position.x + section.size.width <= 100 &&
    section.position.y + section.size.height <= 100
  );

/**
 * Generates valid Margins object
 */
export const arbitraryMargins = (): fc.Arbitrary<Margins> =>
  fc.record({
    top: fc.integer({ min: 0, max: 50 }),
    right: fc.integer({ min: 0, max: 50 }),
    bottom: fc.integer({ min: 0, max: 50 }),
    left: fc.integer({ min: 0, max: 50 }),
  });

/**
 * Generates a valid Template object
 * Feature: recipe-archive, Property 8: Template Persistence Round-Trip
 * Validates: Requirements 4.2
 */
export const arbitraryTemplate = (): fc.Arbitrary<Template> =>
  fc.record({
    id: arbitraryId(),
    name: arbitraryNonEmptyString(),
    size: arbitraryPrintSize(),
    isDefault: fc.boolean(),
    sections: fc.array(arbitraryTemplateSection(), { minLength: 1, maxLength: 6 }),
    margins: arbitraryMargins(),
    createdAt: arbitraryTimestamp(),
    updatedAt: arbitraryTimestamp(),
  });

/**
 * Generates a non-default Template (for deletion tests)
 */
export const arbitraryNonDefaultTemplate = (): fc.Arbitrary<Template> =>
  arbitraryTemplate().map(template => ({ ...template, isDefault: false }));

/**
 * Generates a default Template (for deletion protection tests)
 */
export const arbitraryDefaultTemplate = (): fc.Arbitrary<Template> =>
  arbitraryTemplate().map(template => ({ ...template, isDefault: true }));
