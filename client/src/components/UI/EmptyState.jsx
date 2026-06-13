import React from 'react';
import './EmptyState.css';
import Button from './Button';

/**
 * Universal Empty State component for Edge Cases.
 * Matches the "Industrial Grid" by being clear, actionable, and flat.
 */
const EmptyState = ({ 
  title = "No data available", 
  message = "There's nothing to display right now.",
  actionLabel,
  onAction
}) => {
  return (
    <div className="ui-empty-state">
      <div className="ui-empty-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="3" y1="9" x2="21" y2="9"></line>
          <line x1="9" y1="21" x2="9" y2="9"></line>
        </svg>
      </div>
      <h3 className="ui-empty-title">{title}</h3>
      <p className="ui-empty-message">{message}</p>
      {actionLabel && onAction && (
        <div className="ui-empty-action">
          <Button variant="primary" onClick={onAction}>{actionLabel}</Button>
        </div>
      )}
    </div>
  );
};

export default EmptyState;
