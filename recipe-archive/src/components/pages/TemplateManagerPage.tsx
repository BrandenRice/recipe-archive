/**
 * TemplateManagerPage - Page component for managing templates
 * Requirements: 4.1, 4.5
 */

import { useState, useEffect, useCallback } from 'react';
import { TemplateList } from '../TemplateList';
import { TemplateEditor } from '../TemplateEditor';
import { IndexedDBStorageAdapter } from '../../adapters';
import { createDefaultTemplates } from '../../services/templateOperations';
import type { Template } from '../../types';
import './TemplateManagerPage.css';

type ViewMode = 'list' | 'edit' | 'create';

export function TemplateManagerPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const storage = new IndexedDBStorageAdapter();

  // Load templates on mount
  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let loadedTemplates = await storage.listTemplates();
      
      // If no templates exist, create default templates
      if (loadedTemplates.length === 0) {
        const defaults = createDefaultTemplates();
        for (const template of defaults) {
          await storage.createTemplate(template);
        }
        loadedTemplates = defaults;
      }
      
      setTemplates(loadedTemplates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleSelectTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setViewMode('edit');
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      await storage.deleteTemplate(id);
      setTemplates(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete template');
    }
  };

  const handleCreateNew = () => {
    setSelectedTemplate(null);
    setViewMode('create');
  };

  const handleSaveTemplate = async (template: Template) => {
    try {
      if (viewMode === 'create') {
        const created = await storage.createTemplate(template);
        setTemplates(prev => [...prev, created]);
      } else {
        const updated = await storage.updateTemplate(template.id, template);
        setTemplates(prev => prev.map(t => t.id === updated.id ? updated : t));
      }
      setViewMode('list');
      setSelectedTemplate(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save template');
    }
  };

  const handleCancel = () => {
    setViewMode('list');
    setSelectedTemplate(null);
  };

  if (loading) {
    return (
      <div className="template-manager-page">
        <div className="loading">Loading templates...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="template-manager-page">
        <div className="error">
          <p>{error}</p>
          <button onClick={loadTemplates}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="template-manager-page">
      {viewMode === 'list' ? (
        <TemplateList
          templates={templates}
          onSelect={handleSelectTemplate}
          onDelete={handleDeleteTemplate}
          onCreate={handleCreateNew}
        />
      ) : (
        <TemplateEditor
          template={selectedTemplate}
          onSave={handleSaveTemplate}
          onCancel={handleCancel}
          isNew={viewMode === 'create'}
        />
      )}
    </div>
  );
}

export default TemplateManagerPage;
