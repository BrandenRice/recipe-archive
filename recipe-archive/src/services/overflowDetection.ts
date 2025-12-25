/**
 * Content Overflow Detection Service
 * Detects when recipe content exceeds template section boundaries
 * Feature: recipe-archive
 * Requirements: 6.5
 */

import type { Recipe, Template, TemplateSection } from '../types';

/**
 * Result of overflow detection for a single section
 */
export interface SectionOverflowResult {
  sectionId: string;
  sectionType: TemplateSection['type'];
  hasOverflow: boolean;
  estimatedContentHeight: number; // in percentage of printable area
  availableHeight: number; // in percentage of printable area
  overflowAmount: number; // how much content exceeds bounds (percentage)
}

/**
 * Result of overflow detection for entire recipe/template combination
 */
export interface OverflowDetectionResult {
  hasOverflow: boolean;
  sections: SectionOverflowResult[];
  overflowingSections: SectionOverflowResult[];
}

/**
 * Configuration for text measurement estimation
 */
interface TextMeasurementConfig {
  avgCharWidthMm: number; // Average character width in mm
  lineHeightMultiplier: number; // Line height as multiplier of font size
  baseFontSize: number; // Default font size in points
}

const DEFAULT_CONFIG: TextMeasurementConfig = {
  avgCharWidthMm: 2.5, // Approximate average character width
  lineHeightMultiplier: 1.2, // Standard line height
  baseFontSize: 12,
};

/**
 * Detect content overflow for a recipe within a template
 * Returns information about which sections overflow their boundaries
 * 
 * @param recipe - The recipe to check
 * @param template - The template defining section boundaries
 * @returns OverflowDetectionResult with details about overflowing sections
 */
export function detectOverflow(
  recipe: Recipe,
  template: Template
): OverflowDetectionResult {
  const sections: SectionOverflowResult[] = [];
  
  for (const section of template.sections) {
    const result = detectSectionOverflow(recipe, section, template);
    sections.push(result);
  }
  
  const overflowingSections = sections.filter(s => s.hasOverflow);
  
  return {
    hasOverflow: overflowingSections.length > 0,
    sections,
    overflowingSections,
  };
}

/**
 * Detect overflow for a single section
 */
function detectSectionOverflow(
  recipe: Recipe,
  section: TemplateSection,
  template: Template
): SectionOverflowResult {
  const content = getSectionContent(section.type, recipe);
  
  // Calculate available space in the section (accounting for padding)
  const paddingPercent = (section.style.padding * 2) / template.size.height * 100;
  const availableHeight = section.size.height - paddingPercent;
  const availableWidth = section.size.width - paddingPercent;
  
  // Estimate content height based on text length and font size
  const estimatedContentHeight = estimateContentHeight(
    content,
    section,
    template,
    availableWidth
  );
  
  const hasOverflow = estimatedContentHeight > availableHeight;
  const overflowAmount = hasOverflow ? estimatedContentHeight - availableHeight : 0;
  
  return {
    sectionId: section.id,
    sectionType: section.type,
    hasOverflow,
    estimatedContentHeight,
    availableHeight,
    overflowAmount,
  };
}

/**
 * Estimate the height required to render content in a section
 * Returns height as percentage of printable area
 */
function estimateContentHeight(
  content: string,
  section: TemplateSection,
  template: Template,
  availableWidthPercent: number
): number {
  if (!content || content.length === 0) {
    return 0;
  }
  
  const { size: printSize } = template;
  const fontSize = section.style.fontSize || DEFAULT_CONFIG.baseFontSize;
  
  // Convert available width from percentage to mm
  const availableWidthMm = (availableWidthPercent / 100) * printSize.width;
  
  // Estimate characters per line based on font size and available width
  const charWidthMm = DEFAULT_CONFIG.avgCharWidthMm * (fontSize / DEFAULT_CONFIG.baseFontSize);
  const charsPerLine = Math.max(1, Math.floor(availableWidthMm / charWidthMm));
  
  // Count lines needed for content
  const lines = content.split('\n');
  let totalLines = 0;
  
  for (const line of lines) {
    if (line.length === 0) {
      totalLines += 1; // Empty line still takes space
    } else {
      totalLines += Math.ceil(line.length / charsPerLine);
    }
  }
  
  // Calculate height in mm
  const lineHeightMm = (fontSize * 0.35) * DEFAULT_CONFIG.lineHeightMultiplier; // Convert pt to mm approx
  const contentHeightMm = totalLines * lineHeightMm;
  
  // Convert to percentage of printable height
  const contentHeightPercent = (contentHeightMm / printSize.height) * 100;
  
  return contentHeightPercent;
}

/**
 * Get the content for a specific section type from the recipe
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
      // Images have fixed dimensions, handled separately
      return '';
    default:
      return '';
  }
}

/**
 * Check if any content would overflow the template boundaries
 * Simple boolean check for quick validation
 */
export function hasContentOverflow(recipe: Recipe, template: Template): boolean {
  return detectOverflow(recipe, template).hasOverflow;
}

/**
 * Get list of section IDs that have overflow
 */
export function getOverflowingSectionIds(recipe: Recipe, template: Template): string[] {
  return detectOverflow(recipe, template)
    .overflowingSections
    .map(s => s.sectionId);
}
