import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    setLocalValue(formatJson(value));
  }, [value]);

  useEffect(() => {
    setHasChanges(localValue !== formatJson(value));
  }, [localValue, value]);

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
        <button 
          onClick={handleFormat}
          disabled={!isValid}
          className="format-btn"
          title="Format JSON"
        >
          Format
        </button>
      </div>
      
      <textarea
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        className={`json-textarea ${!isValid ? 'invalid' : ''}`}
        rows={12}
        placeholder="Enter JSON here..."
        spellCheck={false}
      />
      
      <div className="editor-actions">
        <button onClick={onCancel} className="cancel-btn">
          Cancel
        </button>
        <button 
          onClick={onSave} 
          disabled={!hasChanges || !isValid}
          className="save-btn"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};
