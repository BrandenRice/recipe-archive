/**
 * PrintPreview component - Print preview modal with template selection
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { useState, useEffect, useMemo } from 'react';
import type { Recipe, Template, PrintOptions, PrintSize } from '../types';
import { PRINT_SIZES } from '../types';
import { detectOverflow, type OverflowDetectionResult } from '../services/overflowDetection';
import { jsPDFExportAdapter } from '../adapters/jsPDFExportAdapter';
import { DOCXExportAdapter } from '../adapters/DOCXExportAdapter';
import './PrintPreview.css';

export interface PrintPreviewProps {
  recipe: Recipe;
  templates: Template[];
  onClose: () => void;
}

type DuplexMode = 'simplex' | 'duplex-long' | 'duplex-short';

const pdfAdapter = new jsPDFExportAdapter();
const docxAdapter = new DOCXExportAdapter();

export function PrintPreview({ recipe, templates, onClose }: PrintPreviewProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedSizeKey, setSelectedSizeKey] = useState<string>('');
  const [duplexMode, setDuplexMode] = useState<DuplexMode>('simplex');
  const [overflowResult, setOverflowResult] = useState<OverflowDetectionResult | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Get selected template
  const selectedTemplate = useMemo(() => {
    return templates.find(t => t.id === selectedTemplateId) || null;
  }, [templates, selectedTemplateId]);

  // Get selected print size
  const selectedSize = useMemo(() => {
    return PRINT_SIZES[selectedSizeKey] || null;
  }, [selectedSizeKey]);

  // Initialize with first template
  useEffect(() => {
    if (templates.length > 0 && !selectedTemplateId) {
      setSelectedTemplateId(templates[0].id);
      // Find the size key for the template's size
      const sizeKey = findSizeKey(templates[0].size);
      setSelectedSizeKey(sizeKey);
    }
  }, [templates, selectedTemplateId]);

  // Update overflow detection when template or size changes
  useEffect(() => {
    if (selectedTemplate) {
      // Create effective template with selected size
      const effectiveTemplate = selectedSize 
        ? { ...selectedTemplate, size: selectedSize }
        : selectedTemplate;
      const result = detectOverflow(recipe, effectiveTemplate);
      setOverflowResult(result);
    }
  }, [recipe, selectedTemplate, selectedSize]);

  // Handle template change
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      const sizeKey = findSizeKey(template.size);
      setSelectedSizeKey(sizeKey);
    }
  };

  // Handle print size change
  const handleSizeChange = (sizeKey: string) => {
    setSelectedSizeKey(sizeKey);
  };

  // Get print options
  const getPrintOptions = (): PrintOptions => ({
    size: selectedSize || selectedTemplate?.size || PRINT_SIZES['card-4x6'],
    duplexMode,
    copies: 1,
  });

  // Handle print action
  const handlePrint = async () => {
    if (!selectedTemplate) return;

    try {
      setIsExporting(true);
      setExportError(null);

      const options = getPrintOptions();
      const blob = await pdfAdapter.generatePrintDocument(recipe, selectedTemplate, options);
      
      // Open PDF in new window for printing
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url, '_blank');
      
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    } catch (err) {
      console.error('Print error:', err);
      setExportError('Failed to generate print document. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Handle PDF export
  const handleExportPDF = async () => {
    if (!selectedTemplate) return;

    try {
      setIsExporting(true);
      setExportError(null);

      const blob = await pdfAdapter.exportToPDF(recipe, selectedTemplate);
      downloadBlob(blob, `${sanitizeFilename(recipe.title)}.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
      setExportError('Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Handle DOCX export
  const handleExportDOCX = async () => {
    if (!selectedTemplate) return;

    try {
      setIsExporting(true);
      setExportError(null);

      const blob = await docxAdapter.exportToDOCX(recipe, selectedTemplate);
      downloadBlob(blob, `${sanitizeFilename(recipe.title)}.docx`);
    } catch (err) {
      console.error('DOCX export error:', err);
      setExportError('Failed to export DOCX. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Calculate preview aspect ratio
  const previewAspectRatio = useMemo(() => {
    const size = selectedSize || selectedTemplate?.size;
    if (!size) return 1.4; // Default aspect ratio
    return size.height / size.width;
  }, [selectedSize, selectedTemplate]);

  return (
    <div className="print-preview-overlay" onClick={onClose}>
      <div className="print-preview-modal" onClick={e => e.stopPropagation()}>
        <div className="print-preview-header">
          <h2>Print Preview</h2>
          <button className="close-btn" onClick={onClose} title="Close">
            ×
          </button>
        </div>

        <div className="print-preview-content">
          {/* Settings Panel */}
          <div className="print-preview-settings">
            {/* Template Selection */}
            <div className="setting-group">
              <label htmlFor="template-select">Template</label>
              <select
                id="template-select"
                value={selectedTemplateId}
                onChange={e => handleTemplateChange(e.target.value)}
              >
                {templates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name} {template.isDefault ? '(Default)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Print Size Selection */}
            <div className="setting-group">
              <label htmlFor="size-select">Print Size</label>
              <select
                id="size-select"
                value={selectedSizeKey}
                onChange={e => handleSizeChange(e.target.value)}
              >
                <optgroup label="Recipe Cards">
                  {Object.entries(PRINT_SIZES)
                    .filter(([, size]) => size.type === 'card')
                    .map(([key, size]) => (
                      <option key={key} value={key}>
                        {size.name} ({size.width}mm × {size.height}mm)
                      </option>
                    ))}
                </optgroup>
                <optgroup label="Paper Sizes">
                  {Object.entries(PRINT_SIZES)
                    .filter(([, size]) => size.type === 'paper')
                    .map(([key, size]) => (
                      <option key={key} value={key}>
                        {size.name} ({size.width}mm × {size.height}mm)
                      </option>
                    ))}
                </optgroup>
              </select>
            </div>

            {/* Duplex Printing Option */}
            <div className="setting-group">
              <label htmlFor="duplex-select">Print Mode</label>
              <select
                id="duplex-select"
                value={duplexMode}
                onChange={e => setDuplexMode(e.target.value as DuplexMode)}
              >
                <option value="simplex">Single-sided</option>
                <option value="duplex-long">Double-sided (Long Edge)</option>
                <option value="duplex-short">Double-sided (Short Edge)</option>
              </select>
            </div>

            {/* Overflow Warning */}
            {overflowResult?.hasOverflow && (
              <div className="overflow-warning">
                <h4>⚠️ Content Overflow Detected</h4>
                <p>Some content may not fit within the template boundaries:</p>
                <ul>
                  {overflowResult.overflowingSections.map(section => (
                    <li key={section.sectionId}>
                      <strong>{section.sectionType}</strong>: exceeds by{' '}
                      {section.overflowAmount.toFixed(1)}%
                    </li>
                  ))}
                </ul>
                <p className="overflow-tip">
                  Consider using a larger print size or editing the recipe content.
                </p>
              </div>
            )}

            {/* Export Error */}
            {exportError && (
              <div className="export-error">
                {exportError}
              </div>
            )}
          </div>

          {/* Preview Panel */}
          <div className="print-preview-panel">
            <div 
              className="preview-container"
              style={{ paddingTop: `${previewAspectRatio * 100}%` }}
            >
              <div className="preview-content">
                <RecipePreview 
                  recipe={recipe} 
                  template={selectedTemplate}
                  overflowingSections={overflowResult?.overflowingSections.map(s => s.sectionId) || []}
                />
              </div>
            </div>
            <div className="preview-info">
              {selectedSize && (
                <span>{selectedSize.name} ({selectedSize.width}mm × {selectedSize.height}mm)</span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="print-preview-actions">
          <button 
            className="btn-secondary" 
            onClick={onClose}
            disabled={isExporting}
          >
            Cancel
          </button>
          <div className="export-buttons">
            <button
              className="btn-export"
              onClick={handleExportDOCX}
              disabled={isExporting || !selectedTemplate}
              title="Export as Word document"
            >
              {isExporting ? 'Exporting...' : 'Export DOCX'}
            </button>
            <button
              className="btn-export"
              onClick={handleExportPDF}
              disabled={isExporting || !selectedTemplate}
              title="Export as PDF"
            >
              {isExporting ? 'Exporting...' : 'Export PDF'}
            </button>
            <button
              className="btn-primary"
              onClick={handlePrint}
              disabled={isExporting || !selectedTemplate}
              title="Print recipe"
            >
              {isExporting ? 'Preparing...' : 'Print'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Recipe preview component showing how the recipe will look when printed
 */
interface RecipePreviewProps {
  recipe: Recipe;
  template: Template | null;
  overflowingSections: string[];
}

function RecipePreview({ recipe, template, overflowingSections }: RecipePreviewProps) {
  if (!template) {
    return (
      <div className="preview-placeholder">
        <p>Select a template to preview</p>
      </div>
    );
  }

  // Sort sections by zIndex
  const sortedSections = [...template.sections].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div className="recipe-preview">
      {sortedSections.map(section => {
        const hasOverflow = overflowingSections.includes(section.id);
        const content = getSectionContent(section.type, recipe);

        return (
          <div
            key={section.id}
            className={`preview-section ${hasOverflow ? 'has-overflow' : ''}`}
            style={{
              left: `${section.position.x}%`,
              top: `${section.position.y}%`,
              width: `${section.size.width}%`,
              height: `${section.size.height}%`,
              fontSize: `${section.style.fontSize * 0.6}px`,
              fontFamily: section.style.fontFamily,
              fontWeight: section.style.fontWeight,
              textAlign: section.style.textAlign,
              color: section.style.color,
              backgroundColor: section.style.backgroundColor || 'transparent',
              padding: `${section.style.padding * 0.5}px`,
              zIndex: section.zIndex,
              border: section.style.border 
                ? `${section.style.border.width}px ${section.style.border.style} ${section.style.border.color}`
                : 'none',
            }}
          >
            <div className="section-content">
              {content}
            </div>
            {hasOverflow && (
              <div className="overflow-indicator" title="Content overflow">
                ⚠️
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Get content for a section type from the recipe
 */
function getSectionContent(type: string, recipe: Recipe): string {
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
      return '[Image]';
    default:
      return '';
  }
}

/**
 * Find the size key for a PrintSize object
 */
function findSizeKey(size: PrintSize): string {
  for (const [key, value] of Object.entries(PRINT_SIZES)) {
    if (value.name === size.name && value.width === size.width && value.height === size.height) {
      return key;
    }
  }
  return 'card-4x6';
}

/**
 * Sanitize filename for download
 */
function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

/**
 * Download a blob as a file
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default PrintPreview;
