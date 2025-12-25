/**
 * ImageUploader component - Drag-and-drop image upload with OCR
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6
 */

import { useState, useRef, useCallback } from 'react';
import { TesseractOCRAdapter } from '../adapters';
import { validateImageFile, processImageForOCR, SUPPORTED_IMAGE_TYPES } from '../services';
import type { OCRResult } from '../types';
import './ImageUploader.css';

export interface ImageUploaderProps {
  onTextExtracted: (result: OCRResult) => void;
  onError: (error: Error) => void;
  onCancel: () => void;
}

type UploadState = 'idle' | 'processing' | 'editing';

export function ImageUploader({ onTextExtracted, onError, onCancel }: ImageUploaderProps) {
  const [state, setState] = useState<UploadState>('idle');
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [inferredAuthor, setInferredAuthor] = useState<string | null>(null);
  const [editedAuthor, setEditedAuthor] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ocrAdapterRef = useRef<TesseractOCRAdapter | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = async (file: File) => {
    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      onError(new Error(validation.error || 'Invalid file'));
      return;
    }

    setState('processing');
    setProgress(0);
    setProgressMessage('Preparing image...');

    try {
      // Create preview
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);

      // Process image for OCR
      setProgress(10);
      setProgressMessage('Processing image...');
      const processedImage = await processImageForOCR(file);

      // Initialize OCR
      setProgress(20);
      setProgressMessage('Initializing OCR engine...');
      
      if (!ocrAdapterRef.current) {
        ocrAdapterRef.current = new TesseractOCRAdapter();
      }
      await ocrAdapterRef.current.initialize();

      // Perform OCR
      setProgress(40);
      setProgressMessage('Extracting text from image...');
      
      const result = await ocrAdapterRef.current.recognizeText(processedImage.source);

      setProgress(100);
      setProgressMessage('Complete!');

      // Check if OCR produced any text
      if (!result.text.trim()) {
        setState('idle');
        onError(new Error('No text detected in the image. Please try a clearer image or enter the recipe manually.'));
        return;
      }

      // Set extracted data for editing
      setExtractedText(result.text);
      setInferredAuthor(result.inferredAuthor);
      setEditedAuthor(result.inferredAuthor || '');
      setState('editing');

    } catch (err) {
      setState('idle');
      onError(err instanceof Error ? err : new Error('OCR processing failed'));
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setExtractedText(e.target.value);
  };

  const handleAuthorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedAuthor(e.target.value);
  };

  const handleConfirm = () => {
    const result: OCRResult = {
      text: extractedText,
      confidence: 0, // Not tracked after editing
      inferredAuthor: editedAuthor.trim() || null,
      blocks: [],
    };
    onTextExtracted(result);
  };

  const handleRetry = () => {
    setState('idle');
    setImagePreview(null);
    setExtractedText('');
    setInferredAuthor(null);
    setEditedAuthor('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="image-uploader">
      <div className="uploader-header">
        <h2>Scan Recipe</h2>
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>

      {state === 'idle' && (
        <div
          className={`drop-zone ${isDragging ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClickUpload}
        >
          <div className="drop-zone-content">
            <div className="drop-icon">📷</div>
            <p className="drop-text">
              Drag and drop an image here, or click to select
            </p>
            <p className="drop-hint">
              Supported formats: {SUPPORTED_IMAGE_TYPES.join(', ')}
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={SUPPORTED_IMAGE_TYPES.map(t => `.${t}`).join(',')}
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>
      )}

      {state === 'processing' && (
        <div className="processing-state">
          {imagePreview && (
            <div className="image-preview">
              <img src={imagePreview} alt="Recipe being processed" />
            </div>
          )}
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="progress-message">{progressMessage}</p>
          </div>
        </div>
      )}

      {state === 'editing' && (
        <div className="editing-state">
          <div className="editing-layout">
            {imagePreview && (
              <div className="image-preview">
                <img src={imagePreview} alt="Original recipe" />
              </div>
            )}
            
            <div className="extracted-content">
              <div className="form-group">
                <label htmlFor="inferred-author">
                  Inferred Author
                  {inferredAuthor && (
                    <span className="inferred-badge">Auto-detected</span>
                  )}
                </label>
                <input
                  id="inferred-author"
                  type="text"
                  value={editedAuthor}
                  onChange={handleAuthorChange}
                  placeholder="Recipe author (optional)"
                />
              </div>

              <div className="form-group">
                <label htmlFor="extracted-text">
                  Extracted Text
                  <span className="edit-hint">Edit as needed</span>
                </label>
                <textarea
                  id="extracted-text"
                  value={extractedText}
                  onChange={handleTextChange}
                  rows={15}
                  placeholder="Extracted recipe text..."
                />
              </div>

              <div className="editing-actions">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={handleRetry}
                >
                  Try Another Image
                </button>
                <button 
                  type="button" 
                  className="btn-primary" 
                  onClick={handleConfirm}
                >
                  Continue to Editor
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ImageUploader;
