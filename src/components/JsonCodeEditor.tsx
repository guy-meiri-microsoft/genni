import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { formatJson } from '../utils/chrome';

interface JsonCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  isValid: boolean;
  error?: string;
}

export const JsonCodeEditor: React.FC<JsonCodeEditorProps> = ({
  value,
  onChange,
  onSave,
  onCancel,
  isValid,
  error
}) => {
  console.log('🔧 JsonCodeEditor: Component rendered with value:', value);
  console.log('🔧 JsonCodeEditor: Value type:', typeof value);
  console.log('🔧 JsonCodeEditor: Value length:', value?.length);
  console.log('🔧 JsonCodeEditor: IsValid:', isValid);
  
  const [hasChanges, setHasChanges] = useState(false);
  const [originalValue] = useState(value);
  const [monacoFailed, setMonacoFailed] = useState(false);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    const newHasChanges = value !== originalValue;
    setHasChanges(newHasChanges);
    console.log('🔧 JsonCodeEditor: hasChanges updated to:', newHasChanges);
  }, [value, originalValue]);

  // Fallback timeout for Monaco loading
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!editorRef.current && !monacoFailed) {
        console.warn('🔧 JsonCodeEditor: Monaco failed to load within timeout, falling back to textarea');
        setMonacoFailed(true);
      }
    }, 5000); // 5 second timeout

    return () => clearTimeout(timer);
  }, [monacoFailed]);

  const handleEditorDidMount = (editorInstance: editor.IStandaloneCodeEditor) => {
    console.log('🔧 JsonCodeEditor: Editor mounted successfully');
    console.log('🔧 JsonCodeEditor: Editor instance:', editorInstance);
    console.log('🔧 JsonCodeEditor: Setting value in editor:', value);
    
    editorRef.current = editorInstance;
    
    // Set the initial value
    try {
      editorInstance.setValue(value || '');
      console.log('🔧 JsonCodeEditor: Value set successfully');
      
      // Verify the value was set
      const currentEditorValue = editorInstance.getValue();
      console.log('🔧 JsonCodeEditor: Current editor value after setting:', currentEditorValue);
      console.log('🔧 JsonCodeEditor: Current editor value length:', currentEditorValue?.length);
    } catch (error) {
      console.error('🔧 JsonCodeEditor: Error setting value:', error);
    }
    
    // Configure editor options
    try {
      editorInstance.updateOptions({
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        fontSize: 12,
        fontFamily: 'Monaco, Menlo, monospace',
        lineNumbers: 'on',
        folding: true,
        foldingStrategy: 'indentation',
        showFoldingControls: 'always',
        wordWrap: 'on',
        automaticLayout: true,
        tabSize: 2,
        insertSpaces: true,
        detectIndentation: false,
      });
      console.log('🔧 JsonCodeEditor: Editor options configured successfully');
    } catch (error) {
      console.error('🔧 JsonCodeEditor: Error configuring editor options:', error);
    }
  };

  const handleEditorBeforeMount = (monaco: any) => {
    console.log('🔧 JsonCodeEditor: Editor before mount - Monaco loading');
    
    // Configure Monaco for Chrome extension environment
    try {
      // Disable web workers which require eval
      monaco.languages.typescript.typescriptDefaults.setWorkerOptions({
        customWorkerPath: undefined
      });
      monaco.languages.typescript.javascriptDefaults.setWorkerOptions({
        customWorkerPath: undefined
      });
      
      // Set Monaco environment
      self.MonacoEnvironment = {
        getWorkerUrl: () => {
          return '';
        }
      };
      
      console.log('🔧 JsonCodeEditor: Monaco configured for extension environment');
    } catch (error) {
      console.warn('🔧 JsonCodeEditor: Could not configure Monaco environment:', error);
    }
  };

  const handleEditorValidationStatusChanged = () => {
    console.log('🔧 JsonCodeEditor: Editor validation status changed');
  };

  // Fallback textarea change handler
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    console.log('🔧 JsonCodeEditor: Textarea content changed (fallback mode)');
    console.log('🔧 JsonCodeEditor: New value:', newValue);
    onChange(newValue);
  };

  const handleChange = (newValue: string | undefined) => {
    const safeValue = newValue || '';
    console.log('🔧 JsonCodeEditor: Editor content changed');
    console.log('🔧 JsonCodeEditor: New value:', safeValue);
    console.log('🔧 JsonCodeEditor: New value length:', safeValue.length);
    onChange(safeValue);
  };

  const handleFormat = () => {
    if (editorRef.current) {
      try {
        const currentValue = editorRef.current.getValue();
        const formatted = formatJson(currentValue);
        editorRef.current.setValue(formatted);
        onChange(formatted);
      } catch (e) {
        console.warn('Failed to format JSON:', e);
      }
    }
  };

  return (
    <div className="json-code-editor">
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
            onClick={() => {
              console.log('🔧 JsonCodeEditor: Save button clicked');
              console.log('🔧 JsonCodeEditor: Current value:', value);
              console.log('🔧 JsonCodeEditor: IsValid:', isValid);
              console.log('🔧 JsonCodeEditor: HasChanges:', hasChanges);
              onSave();
            }}
            disabled={!hasChanges || !isValid}
            className="save-btn"
          >
            Save Changes
          </button>
          <button 
            onClick={() => {
              console.log('🔧 JsonCodeEditor: Cancel button clicked');
              onCancel();
            }}
            className="cancel-btn"
          >
            Cancel
          </button>
        </div>
      </div>
      
      <div className="monaco-editor-container">
        {monacoFailed ? (
          // Fallback textarea when Monaco fails to load
          <div className="fallback-editor">
            <div className="fallback-notice">
              <small>⚠️ Advanced editor failed to load. Using basic text editor.</small>
            </div>
            <textarea
              value={value}
              onChange={handleTextareaChange}
              className="json-textarea"
              rows={20}
              style={{
                width: '100%',
                fontFamily: 'Monaco, Menlo, monospace',
                fontSize: '12px',
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                resize: 'vertical'
              }}
              placeholder="Enter JSON here..."
            />
          </div>
        ) : (
          // Try to load Monaco Editor
          <Editor
            height="500px"
            defaultLanguage="json"
            defaultValue=""
            onChange={handleChange}
            onMount={handleEditorDidMount}
            beforeMount={handleEditorBeforeMount}
            onValidate={handleEditorValidationStatusChanged}
            loading={<div>Loading Monaco Editor...</div>}
            options={{
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              fontSize: 12,
              fontFamily: 'Monaco, Menlo, monospace',
              lineNumbers: 'on',
              folding: true,
              foldingStrategy: 'indentation',
              showFoldingControls: 'always',
              wordWrap: 'on',
              automaticLayout: true,
              tabSize: 2,
              insertSpaces: true,
              detectIndentation: false,
            }}
            theme="vs"
          />
        )}
      </div>
      
      <div className="editor-footer">
        <div className="keyboard-shortcuts">
          <small>
            Ctrl/Cmd + S to save • Ctrl/Cmd + Shift + P for commands • Click arrows to fold/unfold • Escape to cancel
          </small>
        </div>
      </div>
    </div>
  );
};
