/**
 * Property tests for Template System
 * Feature: recipe-archive
 * Tests Properties 9, 10, 16
 * Validates: Requirements 4.5, 5.2, 5.3, 5.5
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { LocalStorageAdapter } from '../adapters/LocalStorageAdapter';
import { 
  validateSectionBoundaries, 
  validateTemplate, 
  detectOverlaps 
} from '../services/templateOperations';
import { 
  arbitraryTemplate, 
  arbitraryDefaultTemplate
} from './generators';
import type { Template, TemplateSection } from '../types';

describe('Template System Property Tests', () => {
  let storage: LocalStorageAdapter;

  beforeEach(() => {
    storage = new LocalStorageAdapter();
  });

  afterEach(async () => {
    await storage.clear();
  });

  /**
   * Property 9: Default Templates Cannot Be Deleted
   * For any Template where isDefault is true, attempting to delete that Template
   * should fail (throw an error), and the Template should remain retrievable.
   * Feature: recipe-archive, Property 9: Default Templates Cannot Be Deleted
   * Validates: Requirements 4.5
   */
  it('Property 9: Default Templates Cannot Be Deleted', async () => {
    await fc.assert(
      fc.asyncProperty(arbitraryDefaultTemplate(), async (template) => {
        // Save the default template
        await storage.createTemplate(template);

        // Verify it exists
        const beforeDelete = await storage.getTemplate(template.id);
        expect(beforeDelete).not.toBeNull();
        expect(beforeDelete!.isDefault).toBe(true);

        // Attempt to delete should throw an error
        await expect(storage.deleteTemplate(template.id)).rejects.toThrow(
          'Cannot delete default template'
        );

        // Verify template still exists after failed deletion
        const afterDelete = await storage.getTemplate(template.id);
        expect(afterDelete).not.toBeNull();
        expect(afterDelete!.id).toBe(template.id);

        return true;
      }),
      { numRuns: 100 }
    );
  });


  /**
   * Property 10: Template Sections Respect Boundary Constraints
   * For any TemplateSection within a Template, the section's position (x, y) should be
   * in the range [0, 100], and the section's size (width, height) should be in the range [0, 100].
   * Each section must remain within the card boundaries (x + width <= 100, y + height <= 100).
   * Feature: recipe-archive, Property 10: Template Sections Respect Boundary Constraints
   * Validates: Requirements 5.2, 5.3, 5.5
   */
  it('Property 10: Template Sections Respect Boundary Constraints', () => {
    fc.assert(
      fc.property(arbitraryTemplate(), (template) => {
        // Validate each section in the template
        for (const section of template.sections) {
          // Position must be in range [0, 100]
          expect(section.position.x).toBeGreaterThanOrEqual(0);
          expect(section.position.x).toBeLessThanOrEqual(100);
          expect(section.position.y).toBeGreaterThanOrEqual(0);
          expect(section.position.y).toBeLessThanOrEqual(100);

          // Size must be in range [0, 100]
          expect(section.size.width).toBeGreaterThanOrEqual(0);
          expect(section.size.width).toBeLessThanOrEqual(100);
          expect(section.size.height).toBeGreaterThanOrEqual(0);
          expect(section.size.height).toBeLessThanOrEqual(100);

          // Section must stay within card boundaries
          expect(section.position.x + section.size.width).toBeLessThanOrEqual(100);
          expect(section.position.y + section.size.height).toBeLessThanOrEqual(100);

          // Validate using the service function
          expect(validateSectionBoundaries(section)).toBe(true);
        }

        // Validate entire template
        const validation = validateTemplate(template);
        expect(validation.valid).toBe(true);
        expect(validation.errors).toHaveLength(0);

        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 10 (extended): Invalid sections are correctly identified
   * For any section that violates boundary constraints, validateSectionBoundaries should return false
   * Feature: recipe-archive, Property 10: Template Sections Respect Boundary Constraints
   * Validates: Requirements 5.2, 5.3, 5.5
   */
  it('Property 10: Invalid sections are correctly identified', () => {
    // Test sections that exceed boundaries
    const invalidSections: TemplateSection[] = [
      // Position exceeds 100
      {
        id: 'test-1',
        type: 'title',
        position: { x: 101, y: 50 },
        size: { width: 20, height: 10 },
        style: { fontSize: 12, fontFamily: 'Arial', fontWeight: 'normal', textAlign: 'left', color: '#000', backgroundColor: null, padding: 0, border: null },
        zIndex: 1,
      },
      // Position + size exceeds 100
      {
        id: 'test-2',
        type: 'title',
        position: { x: 90, y: 50 },
        size: { width: 20, height: 10 },
        style: { fontSize: 12, fontFamily: 'Arial', fontWeight: 'normal', textAlign: 'left', color: '#000', backgroundColor: null, padding: 0, border: null },
        zIndex: 1,
      },
      // Negative position
      {
        id: 'test-3',
        type: 'title',
        position: { x: -5, y: 50 },
        size: { width: 20, height: 10 },
        style: { fontSize: 12, fontFamily: 'Arial', fontWeight: 'normal', textAlign: 'left', color: '#000', backgroundColor: null, padding: 0, border: null },
        zIndex: 1,
      },
    ];

    for (const section of invalidSections) {
      expect(validateSectionBoundaries(section)).toBe(false);
    }
  });


  /**
   * Property 16: Overlap Detection Identifies All Overlapping Sections
   * For any Template with multiple sections, the overlap detection function should
   * correctly identify all pairs of sections that overlap, and the reported overlap
   * area should be accurate (within tolerance).
   * Feature: recipe-archive, Property 16: Overlap Detection Identifies All Overlapping Sections
   * Validates: Requirements 5.2, 5.3
   */
  it('Property 16: Overlap Detection Identifies All Overlapping Sections', () => {
    fc.assert(
      fc.property(
        arbitraryTemplate().filter(t => t.sections.length >= 2),
        (template) => {
          const overlaps = detectOverlaps(template);

          // Verify overlap detection structure
          expect(Array.isArray(overlaps)).toBe(true);

          // For each detected overlap, verify it's a valid overlap
          for (const overlap of overlaps) {
            expect(overlap).toHaveProperty('section1Id');
            expect(overlap).toHaveProperty('section2Id');
            expect(overlap).toHaveProperty('overlapArea');

            // Find the sections
            const section1 = template.sections.find(s => s.id === overlap.section1Id);
            const section2 = template.sections.find(s => s.id === overlap.section2Id);

            expect(section1).toBeDefined();
            expect(section2).toBeDefined();

            if (section1 && section2) {
              // Verify these sections actually overlap
              const r1 = {
                left: section1.position.x,
                right: section1.position.x + section1.size.width,
                top: section1.position.y,
                bottom: section1.position.y + section1.size.height,
              };
              const r2 = {
                left: section2.position.x,
                right: section2.position.x + section2.size.width,
                top: section2.position.y,
                bottom: section2.position.y + section2.size.height,
              };

              // Check that rectangles actually overlap
              const noOverlap = r1.right <= r2.left || r2.right <= r1.left ||
                               r1.bottom <= r2.top || r2.bottom <= r1.top;
              expect(noOverlap).toBe(false);

              // Overlap area should be non-negative
              expect(overlap.overlapArea).toBeGreaterThanOrEqual(0);
            }
          }

          // Verify no overlaps are missed by checking all pairs
          const sections = template.sections;
          for (let i = 0; i < sections.length; i++) {
            for (let j = i + 1; j < sections.length; j++) {
              const s1 = sections[i];
              const s2 = sections[j];

              const r1 = {
                left: s1.position.x,
                right: s1.position.x + s1.size.width,
                top: s1.position.y,
                bottom: s1.position.y + s1.size.height,
              };
              const r2 = {
                left: s2.position.x,
                right: s2.position.x + s2.size.width,
                top: s2.position.y,
                bottom: s2.position.y + s2.size.height,
              };

              const actuallyOverlaps = !(r1.right <= r2.left || r2.right <= r1.left ||
                                        r1.bottom <= r2.top || r2.bottom <= r1.top);

              if (actuallyOverlaps) {
                // Should be in the overlaps list
                const found = overlaps.some(o =>
                  (o.section1Id === s1.id && o.section2Id === s2.id) ||
                  (o.section1Id === s2.id && o.section2Id === s1.id)
                );
                expect(found).toBe(true);
              }
            }
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 16 (extended): Known overlapping sections are detected
   * Feature: recipe-archive, Property 16: Overlap Detection Identifies All Overlapping Sections
   * Validates: Requirements 5.2, 5.3
   */
  it('Property 16: Known overlapping sections are detected', () => {
    const template: Template = {
      id: 'test-template',
      name: 'Test Template',
      size: { name: 'Test', width: 100, height: 100, type: 'card' },
      isDefault: false,
      sections: [
        {
          id: 'section-1',
          type: 'title',
          position: { x: 10, y: 10 },
          size: { width: 30, height: 20 },
          style: { fontSize: 12, fontFamily: 'Arial', fontWeight: 'normal', textAlign: 'left', color: '#000', backgroundColor: null, padding: 0, border: null },
          zIndex: 1,
        },
        {
          id: 'section-2',
          type: 'author',
          position: { x: 20, y: 15 }, // Overlaps with section-1
          size: { width: 30, height: 20 },
          style: { fontSize: 12, fontFamily: 'Arial', fontWeight: 'normal', textAlign: 'left', color: '#000', backgroundColor: null, padding: 0, border: null },
          zIndex: 2,
        },
        {
          id: 'section-3',
          type: 'ingredients',
          position: { x: 60, y: 60 }, // Does not overlap with others
          size: { width: 30, height: 30 },
          style: { fontSize: 12, fontFamily: 'Arial', fontWeight: 'normal', textAlign: 'left', color: '#000', backgroundColor: null, padding: 0, border: null },
          zIndex: 3,
        },
      ],
      margins: { top: 10, right: 10, bottom: 10, left: 10 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const overlaps = detectOverlaps(template);

    // Should detect exactly one overlap (between section-1 and section-2)
    expect(overlaps.length).toBe(1);
    expect(overlaps[0].section1Id).toBe('section-1');
    expect(overlaps[0].section2Id).toBe('section-2');
    expect(overlaps[0].overlapArea).toBeGreaterThan(0);
  });

  /**
   * Property 16 (extended): Non-overlapping sections return empty array
   * Feature: recipe-archive, Property 16: Overlap Detection Identifies All Overlapping Sections
   * Validates: Requirements 5.2, 5.3
   */
  it('Property 16: Non-overlapping sections return empty array', () => {
    const template: Template = {
      id: 'test-template',
      name: 'Test Template',
      size: { name: 'Test', width: 100, height: 100, type: 'card' },
      isDefault: false,
      sections: [
        {
          id: 'section-1',
          type: 'title',
          position: { x: 0, y: 0 },
          size: { width: 20, height: 20 },
          style: { fontSize: 12, fontFamily: 'Arial', fontWeight: 'normal', textAlign: 'left', color: '#000', backgroundColor: null, padding: 0, border: null },
          zIndex: 1,
        },
        {
          id: 'section-2',
          type: 'author',
          position: { x: 50, y: 50 },
          size: { width: 20, height: 20 },
          style: { fontSize: 12, fontFamily: 'Arial', fontWeight: 'normal', textAlign: 'left', color: '#000', backgroundColor: null, padding: 0, border: null },
          zIndex: 2,
        },
      ],
      margins: { top: 10, right: 10, bottom: 10, left: 10 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const overlaps = detectOverlaps(template);
    expect(overlaps.length).toBe(0);
  });
});
