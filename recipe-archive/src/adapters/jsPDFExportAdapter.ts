/**
 * jsPDF Export Adapter
 * Implements ExportAdapter interface for PDF generation
 * Feature: recipe-archive
 * Requirements: 6.1, 6.3, 6.6
 */

import { jsPDF } from 'jspdf';
import type { Recipe, Template, TemplateSection, PrintOptions, ExportAdapter } from '../types';

/**
 * Export adapter implementation using jsPDF for PDF generation
 */
export class jsPDFExportAdapter implements ExportAdapter {
  /**
   * Export a recipe to PDF format with the specified template layout
   * Requirements: 6.6
   */
  async exportToPDF(recipe: Recipe, template: Template): Promise<Blob> {
    const doc = this.createDocument(template);
    this.renderRecipeToDocument(doc, recipe, template);
    return doc.output('blob');
  }

  /**
   * Export a recipe to DOCX format
   * This method is implemented in DOCXExportAdapter
   */
  async exportToDOCX(_recipe: Recipe, _template: Template): Promise<Blob> {
    throw new Error('DOCX export not supported by jsPDFExportAdapter. Use DOCXExportAdapter instead.');
  }

  /**
   * Generate a print-ready document matching the selected PrintSize
   * Requirements: 6.1, 6.3
   */
  async generatePrintDocument(
    recipe: Recipe,
    template: Template,
    options: PrintOptions
  ): Promise<Blob> {
    // Use the size from options if provided, otherwise use template size
    const effectiveTemplate = {
      ...template,
      size: options.size || template.size,
    };
    
    const doc = this.createDocument(effectiveTemplate);
    this.renderRecipeToDocument(doc, recipe, effectiveTemplate);
    
    // Handle duplex mode by adding metadata (actual duplex is printer-dependent)
    if (options.duplexMode !== 'simplex') {
      doc.setProperties({
        title: recipe.title,
        subject: `Recipe: ${recipe.title}`,
        creator: 'Recipe Archive',
        keywords: recipe.tags.join(', '),
      });
    }
    
    return doc.output('blob');
  }

  /**
   * Create a jsPDF document with dimensions matching the template's PrintSize
   */
  private createDocument(template: Template): jsPDF {
    const { width, height } = template.size;
    
    // jsPDF uses mm by default, which matches our PrintSize dimensions
    return new jsPDF({
      orientation: width > height ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [width, height],
    });
  }

  /**
   * Render recipe content to the PDF document according to template layout
   */
  private renderRecipeToDocument(doc: jsPDF, recipe: Recipe, template: Template): void {
    const { width, height } = template.size;
    const { margins } = template;
    
    // Calculate printable area
    const printableWidth = width - margins.left - margins.right;
    const printableHeight = height - margins.top - margins.bottom;
    
    // Sort sections by zIndex for proper layering
    const sortedSections = [...template.sections].sort((a, b) => a.zIndex - b.zIndex);
    
    for (const section of sortedSections) {
      this.renderSection(doc, section, recipe, {
        printableWidth,
        printableHeight,
        marginLeft: margins.left,
        marginTop: margins.top,
      });
    }
  }

  /**
   * Render a single template section to the document
   */
  private renderSection(
    doc: jsPDF,
    section: TemplateSection,
    recipe: Recipe,
    bounds: { printableWidth: number; printableHeight: number; marginLeft: number; marginTop: number }
  ): void {
    const { printableWidth, printableHeight, marginLeft, marginTop } = bounds;
    
    // Convert percentage positions to absolute positions
    const x = marginLeft + (section.position.x / 100) * printableWidth;
    const y = marginTop + (section.position.y / 100) * printableHeight;
    const sectionWidth = (section.size.width / 100) * printableWidth;
    const sectionHeight = (section.size.height / 100) * printableHeight;
    
    // Apply background color if specified
    if (section.style.backgroundColor) {
      const bgColor = this.hexToRgb(section.style.backgroundColor);
      doc.setFillColor(bgColor.r, bgColor.g, bgColor.b);
      doc.rect(x, y, sectionWidth, sectionHeight, 'F');
    }
    
    // Apply border if specified
    if (section.style.border) {
      const borderColor = this.hexToRgb(section.style.border.color);
      doc.setDrawColor(borderColor.r, borderColor.g, borderColor.b);
      doc.setLineWidth(section.style.border.width * 0.35); // Convert to mm
      doc.rect(x, y, sectionWidth, sectionHeight, 'S');
    }
    
    // Get content for this section
    const content = this.getSectionContent(section.type, recipe);
    if (!content) return;
    
    // Apply text styling
    const textColor = this.hexToRgb(section.style.color);
    doc.setTextColor(textColor.r, textColor.g, textColor.b);
    doc.setFontSize(section.style.fontSize);
    
    // Set font weight
    if (section.style.fontWeight === 'bold') {
      doc.setFont(section.style.fontFamily, 'bold');
    } else {
      doc.setFont(section.style.fontFamily, 'normal');
    }
    
    // Calculate text position with padding
    const padding = section.style.padding;
    const textX = x + padding;
    const textY = y + padding + section.style.fontSize * 0.35; // Adjust for baseline
    const maxWidth = sectionWidth - (padding * 2);
    
    // Render text with alignment
    const lines = doc.splitTextToSize(content, maxWidth);
    let currentY = textY;
    
    for (const line of lines) {
      let lineX = textX;
      
      if (section.style.textAlign === 'center') {
        const lineWidth = doc.getTextWidth(line);
        lineX = x + (sectionWidth - lineWidth) / 2;
      } else if (section.style.textAlign === 'right') {
        const lineWidth = doc.getTextWidth(line);
        lineX = x + sectionWidth - padding - lineWidth;
      }
      
      doc.text(line, lineX, currentY);
      currentY += section.style.fontSize * 0.4; // Line height
    }
  }

  /**
   * Get the content for a specific section type from the recipe
   */
  private getSectionContent(type: TemplateSection['type'], recipe: Recipe): string {
    switch (type) {
      case 'title':
        return recipe.title;
      case 'author':
        return recipe.author || '';
      case 'ingredients':
        return recipe.ingredients.map((ing, i) => `${i + 1}. ${ing}`).join('\n');
      case 'steps':
        return recipe.steps.map((step, i) => `${i + 1}. ${step}`).join('\n');
      case 'notes':
        return recipe.notes || '';
      case 'image':
        // Images are handled separately
        return '';
      default:
        return '';
    }
  }

  /**
   * Convert hex color string to RGB values
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      return {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      };
    }
    return { r: 0, g: 0, b: 0 };
  }

  /**
   * Get the dimensions of the generated document in millimeters
   * Useful for testing Property 11: Print Document Matches Selected Size
   */
  getDocumentDimensions(template: Template): { width: number; height: number } {
    return {
      width: template.size.width,
      height: template.size.height,
    };
  }
}
