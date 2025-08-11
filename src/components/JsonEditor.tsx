import { useState, useEffect } from 'react';
import { formatJson } from '../utils/chrome';

interface JsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  isValid: boolean;
  error?: string;
}

export const JsonEditor: React.FC<JsonEditorProps> = ({
  value,
  onChange,
  onSave,
  onCancel,
  isValid,
  error
}) => {
  const [localValue, setLocalValue] = useState(value);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalValue] = useState(value); // Don't update this after initial mount

  // Sync localValue with incoming value only if we haven't made changes yet
  useEffect(() => {
    if (!hasChanges) {
      setLocalValue(value);
    }
  }, [value, hasChanges]);

  useEffect(() => {
    // Simple string comparison - if the current value differs from original, we have changes
    const newHasChanges = localValue !== originalValue;
    setHasChanges(newHasChanges);
  }, [localValue, originalValue]);

  useEffect(() => {
    const buttonDisabled = !hasChanges || !isValid;
    console.log('🔴 Save button state:', { hasChanges, isValid, buttonDisabled });
  }, [hasChanges, isValid]);

  const handleChange = (newValue: string) => {
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleFormat = () => {
    try {
      const formatted = formatJson(localValue);
      setLocalValue(formatted);
      onChange(formatted);
    } catch (e) {
      // If formatting fails, keep the current value
      console.warn('Failed to format JSON:', e);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 's') {
        e.preventDefault();
        if (hasChanges && isValid) {
          onSave();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    }
  };

  return (
    <div className="json-editor">
      <div className="editor-header">
        <div className="status">
          {isValid ? (
            <span className="status-valid">✓ Valid JSON</span>
          ) : (
            <span className="status-invalid">✗ Invalid JSON</span>
          )}
          {error && <span className="error-message">: {error}</span>}
        </div>
        <div className="editor-controls">
          <button 
            onClick={handleFormat}
            disabled={!isValid}
            className="format-btn"
            title="Format JSON (Ctrl/Cmd + F)"
          >
            Format
          </button>
        </div>
      </div>
      
      <textarea
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        className={`json-textarea ${!isValid ? 'invalid' : ''}`}
        rows={6}
        placeholder="Enter JSON here..."
        spellCheck={false}
        autoFocus
      />
      
      <div className="editor-actions">
        <div className="keyboard-shortcuts">
          <small>Ctrl/Cmd + S to save, Escape to cancel</small>
          <div style={{ 
            marginTop: '8px', 
            padding: '8px', 
            background: '#f0f0f0', 
            borderRadius: '4px', 
            fontSize: '11px',
            fontFamily: 'monospace'
          }}>
            <strong>Debug Info:</strong><br/>
            hasChanges: {hasChanges ? '✅ true' : '❌ false'}<br/>
            isValid: {isValid ? '✅ true' : '❌ false'}<br/>
            localValue length: {localValue.length}<br/>
            originalValue length: {originalValue.length}<br/>
            values equal: {localValue === originalValue ? '✅ true' : '❌ false'}<br/>
            button disabled: {(!hasChanges || !isValid) ? '🔴 true' : '🟢 false'}
          </div>
        </div>
        <div className="action-buttons">
          <button onClick={onCancel} className="cancel-btn">
            Cancel
          </button>
          <button 
            onClick={() => {
              onSave();
            }} 
            disabled={!hasChanges || !isValid}
            className="save-btn"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
