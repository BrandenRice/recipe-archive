/**
 * Template operations service
 * Requirements: 4.1, 4.2, 4.4, 4.5
 */

import type { Template, TemplateSection, SectionStyle, PrintSize, SectionOverlap } from '../types';
import { PRINT_SIZES } from '../types';

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Default section style
 */
const defaultSectionStyle: SectionStyle = {
  fontSize: 12,
  fontFamily: 'Arial, sans-serif',
  fontWeight: 'normal',
  textAlign: 'left',
  color: '#000000',
  backgroundColor: null,
  padding: 4,
  border: null,
};

/**
 * Create a default template section
 */
function createSection(
  type: TemplateSection['type'],
  x: number,
  y: number,
  width: number,
  height: number,
  zIndex: number,
  styleOverrides?: Partial<SectionStyle>
): TemplateSection {
  return {
    id: generateId(),
    type,
    position: { x, y },
    size: { width, height },
    style: { ...defaultSectionStyle, ...styleOverrides },
    zIndex,
  };
}

/**
 * Create a default template for a given print size
 */
function createDefaultTemplate(sizeKey: string, size: PrintSize): Template {
  const now = new Date().toISOString();
  
  // Standard layout: title at top, author below, ingredients on left, steps on right, notes at bottom
  const sections: TemplateSection[] = [
    createSection('title', 5, 2, 90, 10, 1, { fontSize: 18, fontWeight: 'bold', textAlign: 'center' }),
    createSection('author', 5, 13, 90, 5, 2, { fontSize: 10, textAlign: 'center', color: '#666666' }),
    createSection('ingredients', 5, 20, 40, 55, 3),
    createSection('steps', 50, 20, 45, 55, 4),
    createSection('notes', 5, 78, 90, 18, 5, { fontSize: 10, color: '#666666' }),
  ];

  return {
    id: `default-${sizeKey}`,
    name: `Default ${size.name}`,
    size,
    isDefault: true,
    sections,
    margins: { top: 10, right: 10, bottom: 10, left: 10 },
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Create all default templates for supported print sizes
 */
export function createDefaultTemplates(): Template[] {
  return Object.entries(PRINT_SIZES).map(([key, size]) => 
    createDefaultTemplate(key, size)
  );
}

/**
 * Create a new blank template
 */
export function createBlankTemplate(name: string, size: PrintSize): Template {
  const now = new Date().toISOString();
  
  return {
    id: generateId(),
    name,
    size,
    isDefault: false,
    sections: [],
    margins: { top: 10, right: 10, bottom: 10, left: 10 },
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Validate that a template section respects boundary constraints
 * Returns true if valid, false otherwise
 */
export function validateSectionBoundaries(section: TemplateSection): boolean {
  const { position, size } = section;
  
  // Position must be in range [0, 100]
  if (position.x < 0 || position.x > 100 || position.y < 0 || position.y > 100) {
    return false;
  }
  
  // Size must be in range [0, 100]
  if (size.width < 0 || size.width > 100 || size.height < 0 || size.height > 100) {
    return false;
  }
  
  // Section must stay within card boundaries
  if (position.x + size.width > 100 || position.y + size.height > 100) {
    return false;
  }
  
  return true;
}

/**
 * Validate all sections in a template
 */
export function validateTemplate(template: Template): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  for (const section of template.sections) {
    if (!validateSectionBoundaries(section)) {
      errors.push(`Section "${section.type}" (${section.id}) exceeds card boundaries`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check if two sections overlap
 */
function sectionsOverlap(s1: TemplateSection, s2: TemplateSection): boolean {
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
  
  // Check if rectangles don't overlap
  if (r1.right <= r2.left || r2.right <= r1.left || 
      r1.bottom <= r2.top || r2.bottom <= r1.top) {
    return false;
  }
  
  return true;
}

/**
 * Calculate overlap area between two sections
 */
function calculateOverlapArea(s1: TemplateSection, s2: TemplateSection): number {
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
  
  // Calculate intersection rectangle
  const overlapLeft = Math.max(r1.left, r2.left);
  const overlapRight = Math.min(r1.right, r2.right);
  const overlapTop = Math.max(r1.top, r2.top);
  const overlapBottom = Math.min(r1.bottom, r2.bottom);
  
  if (overlapRight <= overlapLeft || overlapBottom <= overlapTop) {
    return 0;
  }
  
  const overlapArea = (overlapRight - overlapLeft) * (overlapBottom - overlapTop);
  
  // Calculate areas of both sections
  const area1 = s1.size.width * s1.size.height;
  const area2 = s2.size.width * s2.size.height;
  
  // Return percentage of smaller section that overlaps
  const smallerArea = Math.min(area1, area2);
  return smallerArea > 0 ? (overlapArea / smallerArea) * 100 : 0;
}

/**
 * Detect all overlapping sections in a template
 * Requirements: 5.2, 5.3, 5.4
 */
export function detectOverlaps(template: Template): SectionOverlap[] {
  const overlaps: SectionOverlap[] = [];
  const sections = template.sections;
  
  for (let i = 0; i < sections.length; i++) {
    for (let j = i + 1; j < sections.length; j++) {
      if (sectionsOverlap(sections[i], sections[j])) {
        const overlapArea = calculateOverlapArea(sections[i], sections[j]);
        overlaps.push({
          section1Id: sections[i].id,
          section2Id: sections[j].id,
          overlapArea,
        });
      }
    }
  }
  
  return overlaps;
}

/**
 * Constrain a section to stay within card boundaries
 */
export function constrainSectionToBoundaries(section: TemplateSection): TemplateSection {
  const constrained = { ...section };
  
  // Constrain position
  constrained.position = {
    x: Math.max(0, Math.min(100 - section.size.width, section.position.x)),
    y: Math.max(0, Math.min(100 - section.size.height, section.position.y)),
  };
  
  // Constrain size
  constrained.size = {
    width: Math.max(1, Math.min(100 - constrained.position.x, section.size.width)),
    height: Math.max(1, Math.min(100 - constrained.position.y, section.size.height)),
  };
  
  return constrained;
}

/**
 * Add a new section to a template
 */
export function addSectionToTemplate(
  template: Template,
  type: TemplateSection['type'],
  position?: { x: number; y: number },
  size?: { width: number; height: number }
): Template {
  const maxZIndex = template.sections.reduce((max, s) => Math.max(max, s.zIndex), 0);
  
  const newSection = createSection(
    type,
    position?.x ?? 10,
    position?.y ?? 10,
    size?.width ?? 30,
    size?.height ?? 20,
    maxZIndex + 1
  );
  
  return {
    ...template,
    sections: [...template.sections, constrainSectionToBoundaries(newSection)],
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Update a section in a template
 */
export function updateSectionInTemplate(
  template: Template,
  sectionId: string,
  updates: Partial<TemplateSection>
): Template {
  return {
    ...template,
    sections: template.sections.map(section =>
      section.id === sectionId
        ? constrainSectionToBoundaries({ ...section, ...updates })
        : section
    ),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Remove a section from a template
 */
export function removeSectionFromTemplate(template: Template, sectionId: string): Template {
  return {
    ...template,
    sections: template.sections.filter(s => s.id !== sectionId),
    updatedAt: new Date().toISOString(),
  };
}
