/**
 * TemplateEditor component - WYSIWYG template editor with draggable sections
 * Requirements: 4.2, 4.3, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import type { Template, TemplateSection, PrintSize, SectionOverlap } from '../types';
import { PRINT_SIZES } from '../types';
import {
  createBlankTemplate,
  detectOverlaps,
  constrainSectionToBoundaries,
  addSectionToTemplate,
  updateSectionInTemplate,
  removeSectionFromTemplate,
} from '../services/templateOperations';
import './TemplateEditor.css';

export interface TemplateEditorProps {
  template: Template | null;
  onSave: (template: Template) => void;
  onCancel: () => void;
  isNew: boolean;
}

type DragMode = 'move' | 'resize-se' | 'resize-sw' | 'resize-ne' | 'resize-nw' | 
                'resize-n' | 'resize-s' | 'resize-e' | 'resize-w' | null;

interface DragState {
  sectionId: string;
  mode: DragMode;
  startX: number;
  startY: number;
  startPosition: { x: number; y: number };
  startSize: { width: number; height: number };
}

const SECTION_TYPES: TemplateSection['type'][] = ['title', 'author', 'ingredients', 'steps', 'notes', 'image'];

const SECTION_COLORS: Record<string, string> = {
  title: '#3498db',
  author: '#9b59b6',
  ingredients: '#2ecc71',
  steps: '#e67e22',
  notes: '#1abc9c',
  image: '#e74c3c',
};

export function TemplateEditor({ template: initialTemplate, onSave, onCancel, isNew }: TemplateEditorProps) {
  const [template, setTemplate] = useState<Template>(() => 
    initialTemplate || createBlankTemplate('New Template', PRINT_SIZES['card-4x6'])
  );
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [overlaps, setOverlaps] = useState<SectionOverlap[]>([]);
  const [dragState, setDragState] = useState<DragState | null>(null);
  
  const canvasRef = useRef<HTMLDivElement>(null);

  // Update overlaps when template changes
  useEffect(() => {
    setOverlaps(detectOverlaps(template));
  }, [template]);

  // Handle name change
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTemplate(prev => ({ ...prev, name: e.target.value }));
  };

  // Handle size change
  const handleSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = PRINT_SIZES[e.target.value];
    if (newSize) {
      setTemplate(prev => ({ ...prev, size: newSize }));
    }
  };

  // Add a new section
  const handleAddSection = (type: TemplateSection['type']) => {
    setTemplate(prev => addSectionToTemplate(prev, type));
  };

  // Remove selected section
  const handleRemoveSection = () => {
    if (selectedSectionId) {
      setTemplate(prev => removeSectionFromTemplate(prev, selectedSectionId));
      setSelectedSectionId(null);
    }
  };

  // Get canvas dimensions for coordinate conversion
  const getCanvasDimensions = useCallback(() => {
    if (!canvasRef.current) return { width: 0, height: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  }, []);

  // Convert pixel coordinates to percentage
  const pixelToPercent = useCallback((px: number, dimension: number) => {
    return (px / dimension) * 100;
  }, []);

  // Handle mouse down on section
  const handleSectionMouseDown = (e: React.MouseEvent, section: TemplateSection, mode: DragMode) => {
    e.preventDefault();
    e.stopPropagation();
    
    setSelectedSectionId(section.id);
    setDragState({
      sectionId: section.id,
      mode,
      startX: e.clientX,
      startY: e.clientY,
      startPosition: { ...section.position },
      startSize: { ...section.size },
    });
  };

  // Handle mouse move for dragging
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState || !canvasRef.current) return;

    const { width, height } = getCanvasDimensions();
    const deltaX = pixelToPercent(e.clientX - dragState.startX, width);
    const deltaY = pixelToPercent(e.clientY - dragState.startY, height);

    setTemplate(prev => {
      const section = prev.sections.find(s => s.id === dragState.sectionId);
      if (!section) return prev;

      let newPosition = { ...section.position };
      let newSize = { ...section.size };

      switch (dragState.mode) {
        case 'move':
          newPosition = {
            x: dragState.startPosition.x + deltaX,
            y: dragState.startPosition.y + deltaY,
          };
          break;
        case 'resize-se':
          newSize = {
            width: dragState.startSize.width + deltaX,
            height: dragState.startSize.height + deltaY,
          };
          break;
        case 'resize-sw':
          newPosition.x = dragState.startPosition.x + deltaX;
          newSize = {
            width: dragState.startSize.width - deltaX,
            height: dragState.startSize.height + deltaY,
          };
          break;
        case 'resize-ne':
          newPosition.y = dragState.startPosition.y + deltaY;
          newSize = {
            width: dragState.startSize.width + deltaX,
            height: dragState.startSize.height - deltaY,
          };
          break;
        case 'resize-nw':
          newPosition = {
            x: dragState.startPosition.x + deltaX,
            y: dragState.startPosition.y + deltaY,
          };
          newSize = {
            width: dragState.startSize.width - deltaX,
            height: dragState.startSize.height - deltaY,
          };
          break;
        case 'resize-n':
          newPosition.y = dragState.startPosition.y + deltaY;
          newSize.height = dragState.startSize.height - deltaY;
          break;
        case 'resize-s':
          newSize.height = dragState.startSize.height + deltaY;
          break;
        case 'resize-e':
          newSize.width = dragState.startSize.width + deltaX;
          break;
        case 'resize-w':
          newPosition.x = dragState.startPosition.x + deltaX;
          newSize.width = dragState.startSize.width - deltaX;
          break;
      }

      const updatedSection = constrainSectionToBoundaries({
        ...section,
        position: newPosition,
        size: newSize,
      });

      return updateSectionInTemplate(prev, section.id, {
        position: updatedSection.position,
        size: updatedSection.size,
      });
    });
  }, [dragState, getCanvasDimensions, pixelToPercent]);

  // Handle mouse up to end dragging
  const handleMouseUp = useCallback(() => {
    setDragState(null);
  }, []);

  // Add/remove global mouse event listeners
  useEffect(() => {
    if (dragState) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragState, handleMouseMove, handleMouseUp]);

  // Check if a section is involved in an overlap
  const getSectionOverlaps = (sectionId: string): SectionOverlap[] => {
    return overlaps.filter(o => o.section1Id === sectionId || o.section2Id === sectionId);
  };

  // Handle save
  const handleSave = () => {
    if (!template.name.trim()) {
      alert('Please enter a template name');
      return;
    }
    onSave({
      ...template,
      updatedAt: new Date().toISOString(),
    });
  };

  // Calculate canvas aspect ratio based on template size
  const aspectRatio = template.size.height / template.size.width;

  return (
    <div className="template-editor">
      <div className="editor-header">
        <h2>{isNew ? 'Create Template' : 'Edit Template'}</h2>
        <div className="editor-actions">
          <button type="button" className="cancel-btn" onClick={onCancel}>
            Cancel
          </button>
          <button 
            type="button" 
            className="save-btn" 
            onClick={handleSave}
            disabled={template.isDefault}
          >
            Save Template
          </button>
        </div>
      </div>

      <div className="editor-content">
        <div className="editor-sidebar">
          {/* Template Settings */}
          <div className="sidebar-section">
            <h3>Template Settings</h3>
            <div className="form-group">
              <label htmlFor="template-name">Name</label>
              <input
                id="template-name"
                type="text"
                value={template.name}
                onChange={handleNameChange}
                disabled={template.isDefault}
                placeholder="Template name"
              />
            </div>
            <div className="form-group">
              <label htmlFor="template-size">Size</label>
              <select
                id="template-size"
                value={getSizeKey(template.size)}
                onChange={handleSizeChange}
                disabled={template.isDefault}
              >
                {Object.entries(PRINT_SIZES).map(([key, size]) => (
                  <option key={key} value={key}>{size.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Add Sections */}
          <div className="sidebar-section">
            <h3>Add Section</h3>
            <div className="section-buttons">
              {SECTION_TYPES.map(type => (
                <button
                  key={type}
                  type="button"
                  className="add-section-btn"
                  onClick={() => handleAddSection(type)}
                  style={{ borderColor: SECTION_COLORS[type] }}
                  disabled={template.isDefault}
                >
                  <span 
                    className="section-color-dot" 
                    style={{ backgroundColor: SECTION_COLORS[type] }}
                  />
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Selected Section */}
          {selectedSectionId && (
            <div className="sidebar-section">
              <h3>Selected Section</h3>
              <SelectedSectionInfo
                section={template.sections.find(s => s.id === selectedSectionId)}
                overlaps={getSectionOverlaps(selectedSectionId)}
                onRemove={handleRemoveSection}
                isDefault={template.isDefault}
              />
            </div>
          )}

          {/* Overlaps Warning */}
          {overlaps.length > 0 && (
            <div className="sidebar-section overlaps-warning">
              <h3>⚠️ Overlapping Sections</h3>
              <p>{overlaps.length} overlap{overlaps.length !== 1 ? 's' : ''} detected</p>
              <ul className="overlap-list">
                {overlaps.map((overlap, idx) => {
                  const s1 = template.sections.find(s => s.id === overlap.section1Id);
                  const s2 = template.sections.find(s => s.id === overlap.section2Id);
                  return (
                    <li key={idx}>
                      {s1?.type} ↔ {s2?.type} ({overlap.overlapArea.toFixed(1)}%)
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        {/* Canvas Area */}
        <div className="editor-canvas-container">
          <div 
            ref={canvasRef}
            className="editor-canvas"
            style={{ paddingTop: `${aspectRatio * 100}%` }}
            onClick={() => setSelectedSectionId(null)}
          >
            <div className="canvas-inner">
              {template.sections.map(section => (
                <SectionElement
                  key={section.id}
                  section={section}
                  isSelected={section.id === selectedSectionId}
                  hasOverlap={getSectionOverlaps(section.id).length > 0}
                  onMouseDown={(e, mode) => handleSectionMouseDown(e, section, mode)}
                  isDefault={template.isDefault}
                />
              ))}
            </div>
          </div>
          <div className="canvas-info">
            {template.size.name} ({template.size.width}mm × {template.size.height}mm)
          </div>
        </div>
      </div>
    </div>
  );
}

interface SectionElementProps {
  section: TemplateSection;
  isSelected: boolean;
  hasOverlap: boolean;
  onMouseDown: (e: React.MouseEvent, mode: DragMode) => void;
  isDefault: boolean;
}

function SectionElement({ section, isSelected, hasOverlap, onMouseDown, isDefault }: SectionElementProps) {
  const color = SECTION_COLORS[section.type] || '#95a5a6';
  
  return (
    <div
      className={`section-element ${isSelected ? 'selected' : ''} ${hasOverlap ? 'has-overlap' : ''}`}
      style={{
        left: `${section.position.x}%`,
        top: `${section.position.y}%`,
        width: `${section.size.width}%`,
        height: `${section.size.height}%`,
        borderColor: color,
        backgroundColor: `${color}20`,
        zIndex: section.zIndex,
      }}
      onMouseDown={(e) => !isDefault && onMouseDown(e, 'move')}
    >
      <div className="section-label" style={{ backgroundColor: color }}>
        {section.type}
      </div>
      
      {/* Resize handles - only show when selected and not default */}
      {isSelected && !isDefault && (
        <>
          <div className="resize-handle nw" onMouseDown={(e) => onMouseDown(e, 'resize-nw')} />
          <div className="resize-handle n" onMouseDown={(e) => onMouseDown(e, 'resize-n')} />
          <div className="resize-handle ne" onMouseDown={(e) => onMouseDown(e, 'resize-ne')} />
          <div className="resize-handle w" onMouseDown={(e) => onMouseDown(e, 'resize-w')} />
          <div className="resize-handle e" onMouseDown={(e) => onMouseDown(e, 'resize-e')} />
          <div className="resize-handle sw" onMouseDown={(e) => onMouseDown(e, 'resize-sw')} />
          <div className="resize-handle s" onMouseDown={(e) => onMouseDown(e, 'resize-s')} />
          <div className="resize-handle se" onMouseDown={(e) => onMouseDown(e, 'resize-se')} />
        </>
      )}
    </div>
  );
}

interface SelectedSectionInfoProps {
  section: TemplateSection | undefined;
  overlaps: SectionOverlap[];
  onRemove: () => void;
  isDefault: boolean;
}

function SelectedSectionInfo({ section, overlaps, onRemove, isDefault }: SelectedSectionInfoProps) {
  if (!section) return null;

  return (
    <div className="selected-section-info">
      <div className="info-row">
        <span className="info-label">Type:</span>
        <span className="info-value">{section.type}</span>
      </div>
      <div className="info-row">
        <span className="info-label">Position:</span>
        <span className="info-value">
          ({section.position.x.toFixed(1)}%, {section.position.y.toFixed(1)}%)
        </span>
      </div>
      <div className="info-row">
        <span className="info-label">Size:</span>
        <span className="info-value">
          {section.size.width.toFixed(1)}% × {section.size.height.toFixed(1)}%
        </span>
      </div>
      {overlaps.length > 0 && (
        <div className="info-row warning">
          <span className="info-label">⚠️ Overlaps:</span>
          <span className="info-value">{overlaps.length}</span>
        </div>
      )}
      <button
        type="button"
        className="remove-section-btn"
        onClick={onRemove}
        disabled={isDefault}
      >
        Remove Section
      </button>
    </div>
  );
}

/**
 * Helper to get size key from PrintSize object
 */
function getSizeKey(size: PrintSize): string {
  for (const [key, value] of Object.entries(PRINT_SIZES)) {
    if (value.name === size.name && value.width === size.width && value.height === size.height) {
      return key;
    }
  }
  return 'card-4x6';
}

export default TemplateEditor;
