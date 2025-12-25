/**
 * DOCX Export Adapter
 * Implements ExportAdapter interface for Word document generation
 * Feature: recipe-archive
 * Requirements: 6.7
 */

import {
  Document,
  Paragraph,
  TextRun,
  Packer,
  AlignmentType,
  PageOrientation,
  convertMillimetersToTwip,
  BorderStyle as DocxBorderStyle,
} from 'docx';
import type { Recipe, Template, TemplateSection, PrintOptions, ExportAdapter } from '../types';

/**
 * Export adapter implementation using docx library for Word document generation
 */
export class DOCXExportAdapter implements ExportAdapter {
  /**
   * Export a recipe to PDF format
   * This method is implemented in jsPDFExportAdapter
   */
  async exportToPDF(_recipe: Recipe, _template: Template): Promise<Blob> {
    throw new Error('PDF export not supported by DOCXExportAdapter. Use jsPDFExportAdapter instead.');
  }

  /**
   * Export a recipe to DOCX format with the specified template layout
   * Requirements: 6.7
   */
  async exportToDOCX(recipe: Recipe, template: Template): Promise<Blob> {
    const doc = this.createDocument(recipe, template);
    return await Packer.toBlob(doc);
  }

  /**
   * Generate a print-ready document matching the selected PrintSize
   */
  async generatePrintDocument(
    recipe: Recipe,
    template: Template,
    options: PrintOptions
  ): Promise<Blob> {
    const effectiveTemplate = {
      ...template,
      size: options.size || template.size,
    };
    
    return this.exportToDOCX(recipe, effectiveTemplate);
  }

  /**
   * Create a DOCX document with the recipe content structured according to template
   */
  private createDocument(recipe: Recipe, template: Template): Document {
    const { width, height } = template.size;
    const { margins } = template;
    
    // Sort sections by position (top to bottom, left to right) for document flow
    const sortedSections = [...template.sections].sort((a, b) => {
      if (a.position.y !== b.position.y) {
        return a.position.y - b.position.y;
      }
      return a.position.x - b.position.x;
    });
    
    // Build paragraphs for each section
    const paragraphs: Paragraph[] = [];
    
    for (const section of sortedSections) {
      const sectionParagraphs = this.createSectionParagraphs(section, recipe);
      paragraphs.push(...sectionParagraphs);
    }
    
    return new Document({
      sections: [{
        properties: {
          page: {
            size: {
              width: convertMillimetersToTwip(width),
              height: convertMillimetersToTwip(height),
              orientation: width > height ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT,
            },
            margin: {
              top: convertMillimetersToTwip(margins.top),
              right: convertMillimetersToTwip(margins.right),
              bottom: convertMillimetersToTwip(margins.bottom),
              left: convertMillimetersToTwip(margins.left),
            },
          },
        },
        children: paragraphs,
      }],
    });
  }

  /**
   * Create paragraphs for a template section
   */
  private createSectionParagraphs(section: TemplateSection, recipe: Recipe): Paragraph[] {
    const content = this.getSectionContent(section.type, recipe);
    if (!content) return [];
    
    const paragraphs: Paragraph[] = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      paragraphs.push(this.createParagraph(line, section));
    }
    
    // Add spacing after section
    paragraphs.push(new Paragraph({ spacing: { after: 200 } }));
    
    return paragraphs;
  }

  /**
   * Create a styled paragraph
   */
  private createParagraph(text: string, section: TemplateSection): Paragraph {
    const { style } = section;
    
    // Convert text alignment
    let alignment: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.LEFT;
    if (style.textAlign === 'center') {
      alignment = AlignmentType.CENTER;
    } else if (style.textAlign === 'right') {
      alignment = AlignmentType.RIGHT;
    }
    
    // Parse color
    const color = style.color.replace('#', '');
    
    // Create text run with styling
    const textRun = new TextRun({
      text,
      bold: style.fontWeight === 'bold',
      size: style.fontSize * 2, // DOCX uses half-points
      font: style.fontFamily,
      color,
    });
    
    // Create paragraph with optional border
    const paragraphOptions: ConstructorParameters<typeof Paragraph>[0] = {
      children: [textRun],
      alignment,
      spacing: {
        before: style.padding * 20, // Convert to twips
        after: style.padding * 20,
      },
    };
    
    // Add border if specified
    if (style.border) {
      const borderColor = style.border.color.replace('#', '');
      const borderStyle = this.convertBorderStyle(style.border.style);
      
      (paragraphOptions as { border?: typeof paragraphOptions.border }).border = {
        top: { style: borderStyle, size: style.border.width * 8, color: borderColor },
        bottom: { style: borderStyle, size: style.border.width * 8, color: borderColor },
        left: { style: borderStyle, size: style.border.width * 8, color: borderColor },
        right: { style: borderStyle, size: style.border.width * 8, color: borderColor },
      };
    }
    
    // Add shading (background color) if specified
    if (style.backgroundColor) {
      (paragraphOptions as { shading?: typeof paragraphOptions.shading }).shading = {
        fill: style.backgroundColor.replace('#', ''),
      };
    }
    
    return new Paragraph(paragraphOptions);
  }

  /**
   * Convert border style to DOCX border style
   */
  private convertBorderStyle(style: 'solid' | 'dashed' | 'dotted'): (typeof DocxBorderStyle)[keyof typeof DocxBorderStyle] {
    switch (style) {
      case 'dashed':
        return DocxBorderStyle.DASHED;
      case 'dotted':
        return DocxBorderStyle.DOTTED;
      case 'solid':
      default:
        return DocxBorderStyle.SINGLE;
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
        return recipe.author ? `By: ${recipe.author}` : '';
      case 'ingredients':
        return 'Ingredients:\n' + recipe.ingredients.map((ing, i) => `${i + 1}. ${ing}`).join('\n');
      case 'steps':
        return 'Steps:\n' + recipe.steps.map((step, i) => `${i + 1}. ${step}`).join('\n');
      case 'notes':
        return recipe.notes ? `Notes: ${recipe.notes}` : '';
      case 'image':
        // Images would need special handling with docx library
        return '';
      default:
        return '';
    }
  }
}
