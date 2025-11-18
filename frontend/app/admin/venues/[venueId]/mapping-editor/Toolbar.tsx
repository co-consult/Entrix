import React, { useEffect } from "react";

export interface ToolbarProps {
  TOOLS: { id: string; label: string; icon: React.ElementType }[];
  selectedTool: string;
  setSelectedTool: (tool: string) => void;
  snapToGrid: boolean;
  setSnapToGrid: (val: boolean) => void;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  canUndo: boolean;
  canRedo: boolean;
  saving: boolean;
  unsavedChanges?: boolean;
}

export default function Toolbar({
  TOOLS,
  selectedTool,
  setSelectedTool,
  snapToGrid,
  setSnapToGrid,
  onUndo,
  onRedo,
  onSave,
  canUndo,
  canRedo,
  saving,
  unsavedChanges = false,
}: ToolbarProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrl = isMac ? e.metaKey : e.ctrlKey;
      if (ctrl && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (!saving && unsavedChanges) onSave();
      } else if (ctrl && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (canUndo && !saving) onUndo();
      } else if (ctrl && (e.key.toLowerCase() === 'y' || (isMac && e.shiftKey && e.key.toLowerCase() === 'z'))) {
        e.preventDefault();
        if (canRedo && !saving) onRedo();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSave, onUndo, onRedo, canUndo, canRedo, saving, unsavedChanges]);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
      {/* Undo/Redo/Save group */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginRight: 24 }}>
        <button onClick={onUndo} disabled={!canUndo || saving} style={buttonStyle} title="Annuler (Undo)">↩️ Undo</button>
        <button onClick={onRedo} disabled={!canRedo || saving} style={buttonStyle} title="Rétablir (Redo)">↪️ Redo</button>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <button
            onClick={() => {
              console.log("Save button clicked");
              onSave();
            }}
            disabled={saving || !unsavedChanges}
            style={{ ...buttonStyle, fontWeight: 600 }}
            title={!unsavedChanges ? 'Aucune modification à enregistrer' : 'Enregistrer (Save)'}
          >
            💾 Save
          </button>
          {unsavedChanges && (
            <span style={{
              position: 'absolute',
              top: 4,
              right: 4,
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: '#e53935',
              border: '2px solid #fff',
              boxShadow: '0 0 2px #e53935',
              zIndex: 2,
              pointerEvents: 'none',
            }} />
          )}
        </div>
        {saving && <span style={{ marginLeft: 8, color: '#1976d2', fontWeight: 500 }}>Saving...</span>}
      </div>
      {/* Tool selection group */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginRight: 24 }}>
        {TOOLS.map(tool => (
          <button
            key={tool.id}
            style={{
              ...buttonStyle,
              background: selectedTool === tool.id ? "#e3f2fd" : "#fff",
              borderColor: selectedTool === tool.id ? "#1976d2" : "#ccc",
              color: selectedTool === tool.id ? "#1976d2" : "#222",
              fontWeight: selectedTool === tool.id ? 600 : 400,
              minWidth: 40
            }}
            onClick={() => setSelectedTool(tool.id)}
            title={tool.label}
          >
            {React.createElement(tool.icon, { size: 20, style: { verticalAlign: 'middle' } })}
          </button>
        ))}
      </div>
    </div>
  );
}

const buttonStyle: React.CSSProperties = {
  padding: "6px 14px",
  border: "1px solid #ccc",
  borderRadius: 6,
  background: "#fff",
  color: "#222",
  fontSize: 15,
  cursor: "pointer",
  transition: "all 0.15s",
  outline: "none",
  boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
  minWidth: 32,
  minHeight: 32,
  margin: 0,
  marginRight: 0,
  marginLeft: 0,
  userSelect: "none",
  fontWeight: 400,
}; 