/**
 * Template data types
 */

export interface Template {
  id: string;
  name: string;
  size: PrintSize;
  isDefault: boolean;
  sections: TemplateSection[];
  margins: Margins;
  createdAt: string;
  updatedAt: string;
}

export interface PrintSize {
  name: string;
  width: number;  // in millimeters
  height: number; // in millimeters
  type: 'card' | 'paper';
}

// Predefined sizes
export const PRINT_SIZES: Record<string, PrintSize> = {
  'card-3x5': { name: '3x5 Card', width: 76.2, height: 127, type: 'card' },
  'card-4x6': { name: '4x6 Card', width: 101.6, height: 152.4, type: 'card' },
  'card-5x7': { name: '5x7 Card', width: 127, height: 177.8, type: 'card' },
  'letter': { name: 'Letter', width: 215.9, height: 279.4, type: 'paper' },
  'legal': { name: 'Legal', width: 215.9, height: 355.6, type: 'paper' },
  'a4': { name: 'A4', width: 210, height: 297, type: 'paper' },
  'a5': { name: 'A5', width: 148, height: 210, type: 'paper' },
};

export interface TemplateSection {
  id: string;
  type: 'title' | 'author' | 'ingredients' | 'steps' | 'notes' | 'image';
  position: Position;
  size: Size;
  style: SectionStyle;
  zIndex: number; // For layering overlapping sections
}

export interface Position {
  x: number; // percentage of card width
  y: number; // percentage of card height
}

export interface Size {
  width: number;  // percentage of card width
  height: number; // percentage of card height
}


// Overlap detection for visual feedback in editor
export interface SectionOverlap {
  section1Id: string;
  section2Id: string;
  overlapArea: number; // percentage of smaller section that overlaps
}

export interface SectionStyle {
  fontSize: number;
  fontFamily: string;
  fontWeight: 'normal' | 'bold';
  textAlign: 'left' | 'center' | 'right';
  color: string;
  backgroundColor: string | null;
  padding: number;
  border: BorderStyle | null;
}

export interface BorderStyle {
  width: number;
  style: 'solid' | 'dashed' | 'dotted';
  color: string;
}

export interface Margins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}
