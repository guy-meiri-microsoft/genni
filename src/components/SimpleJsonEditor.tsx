import React, { useState, useRef, useEffect, useCallback } from 'react';
import { formatJson } from '../utils/chrome';

interface SimpleJsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  isValid: boolean;
  error?: string;
}

interface JsonNode {
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  value: unknown;
  collapsed: boolean;
  key?: string;
  level: number;
}

export const SimpleJsonEditor: React.FC<SimpleJsonEditorProps> = ({
  value,
  onChange,
  onSave,
  onCancel,
  isValid,
  error
}) => {
  console.log('🔧 SimpleJsonEditor: Component rendered with value:', value);
  console.log('🔧 SimpleJsonEditor: Value type:', typeof value);
  console.log('🔧 SimpleJsonEditor: Value length:', value?.length);
  console.log('🔧 SimpleJsonEditor: IsValid:', isValid);
  
  const [hasChanges, setHasChanges] = useState(false);
  const [originalValue] = useState(value);
  const [viewMode, setViewMode] = useState<'formatted' | 'raw'>('formatted');
  const [parsedJson, setParsedJson] = useState<JsonNode | null>(null);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Parse JSON object/array for hierarchical display
  const parseJsonForDisplay = useCallback((obj: unknown, level: number): JsonNode => {
    if (obj === null) {
      return { type: 'null', value: null, collapsed: false, level };
    }
    
    if (Array.isArray(obj)) {
      return {
        type: 'array',
        value: obj.map((item, index) => ({
          ...parseJsonForDisplay(item, level + 1),
          key: `[${index}]`
        })),
        collapsed: false,
        level
      };
    }
    
    if (typeof obj === 'object') {
      return {
        type: 'object',
        value: Object.entries(obj).map(([key, val]) => ({
          ...parseJsonForDisplay(val, level + 1),
          key
        })),
        collapsed: false,
        level
      };
    }
    
    return {
      type: typeof obj as 'string' | 'number' | 'boolean',
      value: obj,
      collapsed: false,
      level
    };
  }, []);

  useEffect(() => {
    const newHasChanges = value !== originalValue;
    setHasChanges(newHasChanges);
    console.log('🔧 SimpleJsonEditor: hasChanges updated to:', newHasChanges);
  }, [value, originalValue]);

  useEffect(() => {
    // Parse JSON when value changes for formatted view
    if (isValid && value) {
      try {
        const parsed = JSON.parse(value);
        setParsedJson(parseJsonForDisplay(parsed, 0));
      } catch {
        setParsedJson(null);
      }
    } else {
      setParsedJson(null);
    }
  }, [value, isValid, parseJsonForDisplay]);

  useEffect(() => {
    // Set the initial value in the textarea
    if (textareaRef.current && textareaRef.current.value !== value) {
      textareaRef.current.value = value;
      console.log('🔧 SimpleJsonEditor: Textarea value set to:', value);
    }
  }, [value]);

  // Toggle collapse state for a node path
  const toggleCollapse = (path: string) => {
    const newCollapsed = new Set(collapsedNodes);
    if (newCollapsed.has(path)) {
      newCollapsed.delete(path);
    } else {
      newCollapsed.add(path);
    }
    setCollapsedNodes(newCollapsed);
  };

  // Delete a node at the given path
  const deleteNode = (path: string) => {
    if (!isValid || !value) return;
    
    try {
      const parsed = JSON.parse(value);
      
      // Remove leading dot if present
      const cleanPath = path.startsWith('.') ? path.substring(1) : path;
      const pathParts = cleanPath.split('.');
      
      if (pathParts.length === 0 || pathParts[0] === '') return; // Can't delete root
      
      // Navigate to parent object
      let current = parsed;
      const lastKey = pathParts[pathParts.length - 1];
      
      // Navigate to the parent of the node we want to delete
      for (let i = 0; i < pathParts.length - 1; i++) {
        const key = pathParts[i];
        
        // Handle array indices in brackets like [0]
        if (key.includes('[') && key.includes(']')) {
          const baseKey = key.substring(0, key.indexOf('['));
          const indexStr = key.substring(key.indexOf('[') + 1, key.indexOf(']'));
          const index = parseInt(indexStr);
          current = current[baseKey][index];
        } else {
          current = current[key];
        }
      }
      
      // Delete the target node
      if (current && lastKey) {
        if (lastKey.includes('[') && lastKey.includes(']')) {
          // Handle array element deletion
          const baseKey = lastKey.substring(0, lastKey.indexOf('['));
          const indexStr = lastKey.substring(lastKey.indexOf('[') + 1, lastKey.indexOf(']'));
          const index = parseInt(indexStr);
          if (Array.isArray(current[baseKey])) {
            current[baseKey].splice(index, 1);
          }
        } else {
          // Handle object property deletion
          delete current[lastKey];
        }
        
        // Update the value
        const newJsonString = JSON.stringify(parsed, null, 2);
        onChange(newJsonString);
        
        // Remove from collapsed nodes if it was collapsed
        const newCollapsed = new Set(collapsedNodes);
        newCollapsed.delete(path);
        setCollapsedNodes(newCollapsed);
        
        console.log('🔧 SimpleJsonEditor: Deleted node at path:', path);
      }
    } catch (error) {
      console.error('🔧 SimpleJsonEditor: Error deleting node:', error);
    }
  };

  // Update a node value at the given path
  const updateNode = (path: string, newValue: unknown) => {
    if (!isValid || !value) return;
    
    try {
      const parsed = JSON.parse(value);
      
      // Remove leading dot if present
      const cleanPath = path.startsWith('.') ? path.substring(1) : path;
      const pathParts = cleanPath.split('.');
      
      if (pathParts.length === 0 || pathParts[0] === '') {
        // Updating root
        const newJsonString = JSON.stringify(newValue, null, 2);
        onChange(newJsonString);
        return;
      }
      
      // Navigate to parent object
      let current = parsed;
      const lastKey = pathParts[pathParts.length - 1];
      
      // Navigate to the parent of the node we want to update
      for (let i = 0; i < pathParts.length - 1; i++) {
        const key = pathParts[i];
        
        // Handle array indices in brackets like [0]
        if (key.includes('[') && key.includes(']')) {
          const baseKey = key.substring(0, key.indexOf('['));
          const indexStr = key.substring(key.indexOf('[') + 1, key.indexOf(']'));
          const index = parseInt(indexStr);
          current = current[baseKey][index];
        } else {
          current = current[key];
        }
      }
      
      // Update the target node
      if (current && lastKey) {
        if (lastKey.includes('[') && lastKey.includes(']')) {
          // Handle array element update
          const baseKey = lastKey.substring(0, lastKey.indexOf('['));
          const indexStr = lastKey.substring(lastKey.indexOf('[') + 1, lastKey.indexOf(']'));
          const index = parseInt(indexStr);
          if (Array.isArray(current[baseKey])) {
            current[baseKey][index] = newValue;
          }
        } else {
          // Handle object property update
          current[lastKey] = newValue;
        }
        
        // Update the value
        const newJsonString = JSON.stringify(parsed, null, 2);
        onChange(newJsonString);
        
        console.log('🔧 SimpleJsonEditor: Updated node at path:', path, 'with value:', newValue);
      }
    } catch (error) {
      console.error('🔧 SimpleJsonEditor: Error updating node:', error);
    }
  };

  const startEditing = (path: string, currentValue: unknown) => {
    setEditingNode(path);
    setEditingValue(typeof currentValue === 'string' ? currentValue : JSON.stringify(currentValue));
  };

  const cancelEditing = () => {
    setEditingNode(null);
    setEditingValue('');
  };

  const saveEdit = () => {
    if (editingNode) {
      try {
        // Try to parse as JSON first, if that fails treat as string
        let newValue;
        try {
          newValue = JSON.parse(editingValue);
        } catch {
          newValue = editingValue;
        }
        updateNode(editingNode, newValue);
        setEditingNode(null);
        setEditingValue('');
      } catch (error) {
        console.error('Error saving edit:', error);
      }
    }
  };

  // Render a single JSON node with folding
  const renderJsonNode = (node: JsonNode, path: string = '', isRoot: boolean = false): React.ReactNode => {
    if (node.type === 'object') {
      const entries = node.value as JsonNode[];
      const hasItems = entries.length > 0;
      const isCollapsed = collapsedNodes.has(path);
      const indent = '  '.repeat(node.level);
      
      return (
        <React.Fragment key={path}>
          {/* Opening brace for root or when collapsed */}
          {(isRoot || isCollapsed) && (
            <div className="json-line">
              <span className="json-indent">{indent}</span>
              <span className="json-spacer"></span>
              <span className="json-brace">{'{'}</span>
              {isCollapsed && hasItems && (
                <span className="json-ellipsis"> ... {entries.length} items {'}'}</span>
              )}
            </div>
          )}
          
          {/* Render each property */}
          {!isCollapsed && hasItems && entries.map((child, index) => (
            <React.Fragment key={`${path}.${child.key}`}>
              <div className="json-line">
                <span className="json-indent">{'  '.repeat(node.level + 1)}</span>
                {(child.type === 'object' || child.type === 'array') && (
                  <button
                    className="fold-button"
                    onClick={() => toggleCollapse(`${path}.${child.key}`)}
                    title={collapsedNodes.has(`${path}.${child.key}`) ? 'Expand' : 'Collapse'}
                  >
                    {collapsedNodes.has(`${path}.${child.key}`) ? '▶' : '▼'}
                  </button>
                )}
                {!(child.type === 'object' || child.type === 'array') && <span className="json-spacer"></span>}
                <span className="json-key">"{child.key}"</span>
                <span className="json-colon">: </span>
                
                {/* Inline rendering for primitives */}
                {child.type !== 'object' && child.type !== 'array' && (
                  <>
                    {editingNode === `${path}.${child.key}` ? (
                      <span className="inline-editor">
                        <input
                          type="text"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              saveEdit();
                            } else if (e.key === 'Escape') {
                              cancelEditing();
                            }
                          }}
                          onBlur={saveEdit}
                          className="json-input"
                          autoFocus
                        />
                      </span>
                    ) : (
                      <span 
                        className={`json-${child.type} editable-value`}
                        onClick={() => startEditing(`${path}.${child.key}`, child.value)}
                        title="Click to edit"
                      >
                        {child.type === 'string' ? `"${child.value}"` : String(child.value)}
                      </span>
                    )}
                    {index < entries.length - 1 && <span className="json-comma">,</span>}
                  </>
                )}
                
                {/* Opening brace for nested objects/arrays on same line */}
                {(child.type === 'object' || child.type === 'array') && (
                  <>
                    <span className="json-brace">{child.type === 'object' ? '{' : '['}</span>
                    {collapsedNodes.has(`${path}.${child.key}`) && (
                      <>
                        <span className="json-ellipsis"> ... {(child.value as JsonNode[]).length} items </span>
                        <span className="json-brace">{child.type === 'object' ? '}' : ']'}</span>
                        <button
                          className="delete-button"
                          onClick={() => deleteNode(`${path}.${child.key}`)}
                          title={`Delete this ${child.type}`}
                        >
                          🗑️
                        </button>
                        {index < entries.length - 1 && <span className="json-comma">,</span>}
                      </>
                    )}
                  </>
                )}
              </div>
              
              {/* Render nested content when expanded */}
              {(child.type === 'object' || child.type === 'array') && !collapsedNodes.has(`${path}.${child.key}`) && (
                <>
                  {renderJsonNode(child, `${path}.${child.key}`, false)}
                  <div className="json-line">
                    <span className="json-indent">{'  '.repeat(node.level + 1)}</span>
                    <span className="json-spacer"></span>
                    <span className="json-brace">{child.type === 'object' ? '}' : ']'}</span>
                    {index < entries.length - 1 && <span className="json-comma">,</span>}
                  </div>
                </>
              )}
            </React.Fragment>
          ))}
          
          {/* Closing brace for root */}
          {isRoot && !isCollapsed && hasItems && (
            <div className="json-line">
              <span className="json-indent">{indent}</span>
              <span className="json-spacer"></span>
              <span className="json-brace">{'}'}</span>
            </div>
          )}
        </React.Fragment>
      );
    }
    
    if (node.type === 'array') {
      const entries = node.value as JsonNode[];
      const hasItems = entries.length > 0;
      const isCollapsed = collapsedNodes.has(path);
      
      return (
        <React.Fragment key={path}>
          {/* Array items */}
          {!isCollapsed && hasItems && entries.map((child, index) => (
            <React.Fragment key={`${path}[${index}]`}>
              {child.type === 'object' || child.type === 'array' ? (
                <>
                  {renderJsonNode(child, `${path}[${index}]`, false)}
                  {index < entries.length - 1 && (
                    <div className="json-line">
                      <span className="json-indent">{'  '.repeat(node.level + 1)}</span>
                      <span className="json-spacer"></span>
                      <span className="json-comma">,</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="json-line">
                  <span className="json-indent">{'  '.repeat(node.level + 1)}</span>
                  <span className="json-spacer"></span>
                  {editingNode === `${path}[${index}]` ? (
                    <span className="inline-editor">
                      <input
                        type="text"
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            saveEdit();
                          } else if (e.key === 'Escape') {
                            cancelEditing();
                          }
                        }}
                        onBlur={saveEdit}
                        className="json-input"
                        autoFocus
                      />
                    </span>
                  ) : (
                    <span 
                      className={`json-${child.type} editable-value`}
                      onClick={() => startEditing(`${path}[${index}]`, child.value)}
                      title="Click to edit"
                    >
                      {child.type === 'string' ? `"${child.value}"` : String(child.value)}
                    </span>
                  )}
                  {index < entries.length - 1 && <span className="json-comma">,</span>}
                </div>
              )}
            </React.Fragment>
          ))}
        </React.Fragment>
      );
    }
    
    return (
      <>
        {editingNode === path ? (
          <span className="inline-editor">
            <input
              type="text"
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  saveEdit();
                } else if (e.key === 'Escape') {
                  cancelEditing();
                }
              }}
              onBlur={saveEdit}
              className="json-input"
              autoFocus
            />
          </span>
        ) : (
          <span 
            className={`json-${node.type} editable-value`}
            onClick={() => startEditing(path, node.value)}
            title="Click to edit"
          >
            {node.type === 'string' ? `"${node.value}"` : String(node.value)}
          </span>
        )}
      </>
    );
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    console.log('🔧 SimpleJsonEditor: Textarea content changed');
    console.log('🔧 SimpleJsonEditor: New value length:', newValue.length);
    onChange(newValue);
  };

  const handleFormat = () => {
    if (textareaRef.current) {
      try {
        const currentValue = textareaRef.current.value;
        const formatted = formatJson(currentValue);
        textareaRef.current.value = formatted;
        onChange(formatted);
        console.log('🔧 SimpleJsonEditor: JSON formatted successfully');
      } catch (e) {
        console.warn('Failed to format JSON:', e);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Save on Ctrl+S / Cmd+S
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      if (isValid && hasChanges) {
        console.log('🔧 SimpleJsonEditor: Save triggered by keyboard shortcut');
        onSave();
      }
    }
    
    // Cancel on Escape
    if (e.key === 'Escape') {
      e.preventDefault();
      console.log('🔧 SimpleJsonEditor: Cancel triggered by Escape key');
      onCancel();
    }
  };

  return (
    <div className="simple-json-editor">
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
            title="Format JSON"
          >
            Format
          </button>
          <button
            onClick={() => setViewMode(viewMode === 'formatted' ? 'raw' : 'formatted')}
            disabled={!isValid}
            className="view-mode-btn"
            title={`Switch to ${viewMode === 'formatted' ? 'raw' : 'formatted'} view`}
          >
            {viewMode === 'formatted' ? '📝' : '🌳'}
          </button>
          <button 
            onClick={() => {
              console.log('🔧 SimpleJsonEditor: Save button clicked');
              console.log('🔧 SimpleJsonEditor: Current value length:', value.length);
              console.log('🔧 SimpleJsonEditor: IsValid:', isValid);
              console.log('🔧 SimpleJsonEditor: HasChanges:', hasChanges);
              onSave();
            }}
            disabled={!hasChanges || !isValid}
            className="save-btn"
            title="Save changes to localStorage"
          >
            Save Changes
          </button>
          <button 
            onClick={() => {
              console.log('🔧 SimpleJsonEditor: Cancel button clicked');
              onCancel();
            }}
            className="cancel-btn"
            title="Cancel editing and discard changes"
          >
            Cancel
          </button>
        </div>
      </div>
      
      <div className="editor-container">
        {viewMode === 'formatted' && isValid && parsedJson ? (
          <div className="json-tree-view">
            {renderJsonNode(parsedJson, '', true)}
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            defaultValue={value}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            className="json-textarea"
            placeholder="Enter JSON here..."
            style={{
              width: '100%',
              height: '500px',
              fontFamily: 'Monaco, Menlo, "Courier New", monospace',
              fontSize: '12px',
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              resize: 'vertical',
              backgroundColor: '#ffffff',
              lineHeight: '1.5',
              tabSize: 2,
              outline: 'none',
              transition: 'border-color 0.2s ease-in-out',
            }}
          />
        )}
      </div>
      
      <div className="editor-footer">
        <div className="keyboard-shortcuts">
          <small>
            Ctrl/Cmd + S to save • Escape to cancel • 🌳 Tree view with folding • 📝 Raw text editor
          </small>
        </div>
      </div>
    </div>
  );
};
