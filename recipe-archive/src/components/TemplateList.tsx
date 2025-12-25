/**
 * TemplateList component - Displays templates with create/edit/delete actions
 * Requirements: 4.1, 4.5
 */

import { useState } from 'react';
import type { Template, PrintSize } from '../types';
import { PRINT_SIZES } from '../types';
import './TemplateList.css';

export interface TemplateListProps {
  templates: Template[];
  onSelect: (template: Template) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
}

export function TemplateList({
  templates,
  onSelect,
  onDelete,
  onCreate,
}: TemplateListProps) {
  const [filterSize, setFilterSize] = useState<string>('');

  // Filter templates by size if selected
  const filteredTemplates = filterSize
    ? templates.filter(t => getSizeKey(t.size) === filterSize)
    : templates;

  // Separate default and custom templates
  const defaultTemplates = filteredTemplates.filter(t => t.isDefault);
  const customTemplates = filteredTemplates.filter(t => !t.isDefault);

  const handleDelete = (e: React.MouseEvent, template: Template) => {
    e.stopPropagation();
    if (template.isDefault) {
      alert('Default templates cannot be deleted.');
      return;
    }
    if (confirm(`Delete template "${template.name}"?`)) {
      onDelete(template.id);
    }
  };

  return (
    <div className="template-list">
      <div className="template-list-header">
        <h2>Templates</h2>
        <div className="template-list-actions">
          <select
            value={filterSize}
            onChange={(e) => setFilterSize(e.target.value)}
            className="size-filter"
            aria-label="Filter by size"
          >
            <option value="">All Sizes</option>
            {Object.entries(PRINT_SIZES).map(([key, size]) => (
              <option key={key} value={key}>{size.name}</option>
            ))}
          </select>
          <button
            type="button"
            className="create-template-btn"
            onClick={onCreate}
          >
            + New Template
          </button>
        </div>
      </div>

      {/* Default Templates Section */}
      {defaultTemplates.length > 0 && (
        <div className="template-section">
          <h3 className="section-title">Default Templates</h3>
          <div className="template-cards">
            {defaultTemplates.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                onSelect={onSelect}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      )}

      {/* Custom Templates Section */}
      <div className="template-section">
        <h3 className="section-title">Custom Templates</h3>
        {customTemplates.length === 0 ? (
          <div className="no-templates">
            No custom templates yet. Create one to get started!
          </div>
        ) : (
          <div className="template-cards">
            {customTemplates.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                onSelect={onSelect}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface TemplateCardProps {
  template: Template;
  onSelect: (template: Template) => void;
  onDelete: (e: React.MouseEvent, template: Template) => void;
}

function TemplateCard({ template, onSelect, onDelete }: TemplateCardProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div 
      className={`template-card ${template.isDefault ? 'default' : 'custom'}`}
      onClick={() => onSelect(template)}
    >
      <div className="template-card-header">
        <h4 className="template-card-title">{template.name}</h4>
        {!template.isDefault && (
          <button
            type="button"
            className="delete-btn"
            onClick={(e) => onDelete(e, template)}
            title="Delete template"
            aria-label={`Delete template ${template.name}`}
          >
            ×
          </button>
        )}
      </div>
      
      <div className="template-card-preview">
        <TemplateMiniPreview template={template} />
      </div>
      
      <div className="template-card-info">
        <span className="template-size">{template.size.name}</span>
        <span className="template-type-badge">
          {template.isDefault ? 'Default' : 'Custom'}
        </span>
      </div>
      
      <div className="template-card-meta">
        <span className="section-count">
          {template.sections.length} section{template.sections.length !== 1 ? 's' : ''}
        </span>
        <span className="template-date">
          Updated: {formatDate(template.updatedAt)}
        </span>
      </div>
    </div>
  );
}

/**
 * Mini preview showing template section layout
 */
function TemplateMiniPreview({ template }: { template: Template }) {
  const sectionColors: Record<string, string> = {
    title: '#3498db',
    author: '#9b59b6',
    ingredients: '#2ecc71',
    steps: '#e67e22',
    notes: '#1abc9c',
    image: '#e74c3c',
  };

  return (
    <div className="mini-preview">
      {template.sections.map(section => (
        <div
          key={section.id}
          className="mini-section"
          style={{
            left: `${section.position.x}%`,
            top: `${section.position.y}%`,
            width: `${section.size.width}%`,
            height: `${section.size.height}%`,
            backgroundColor: sectionColors[section.type] || '#95a5a6',
            zIndex: section.zIndex,
          }}
          title={section.type}
        />
      ))}
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
  return '';
}

export default TemplateList;
