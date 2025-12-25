/**
 * DeleteConfirmationDialog component - Modal for confirming delete actions
 * Requirements: 4.1, 4.4
 */

import { useEffect, useRef } from 'react';
import './DeleteConfirmationDialog.css';

export interface DeleteConfirmationDialogProps {
  title: string;
  message: string;
  itemName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmationDialog({
  title,
  message,
  itemName,
  onConfirm,
  onCancel,
}: DeleteConfirmationDialogProps) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  // Focus cancel button on mount for accessibility
  useEffect(() => {
    cancelButtonRef.current?.focus();
  }, []);

  // Handle escape key to cancel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div 
        className="delete-confirmation-dialog" 
        role="alertdialog" 
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-message"
      >
        <div className="dialog-header">
          <h3 id="delete-dialog-title">{title}</h3>
        </div>
        
        <div className="dialog-body">
          <p id="delete-dialog-message">
            {message}
          </p>
          <p className="item-name">"{itemName}"</p>
        </div>

        <div className="dialog-actions">
          <button
            ref={cancelButtonRef}
            type="button"
            className="cancel-btn"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="delete-btn"
            onClick={onConfirm}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteConfirmationDialog;
