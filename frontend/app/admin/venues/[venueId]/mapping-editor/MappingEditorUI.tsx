'use client';
import React from "react";
import Toolbar, { ToolbarProps } from "./Toolbar";
import MappingCanvas from "./MappingCanvas";
import PropertiesPanel, { PropertiesPanelProps } from "./PropertiesPanel";
import { Zone, AccessPoint } from "./types";

export interface MappingEditorUIProps {
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
  zones: Zone[];
  selectedZone: string | null;
  accessPoints: AccessPoint[];
  selectedAccessPoint: string | null;
  drawing: boolean;
  drawRect: { x: number; y: number; width: number; height: number } | null;
  drawAPPreview: { x: number; y: number } | null;
  draggingZoneId: string | null;
  draggingAPId: string | null;
  canvasRef: React.RefObject<HTMLDivElement>;
  handleCanvasMouseMove: (e: any) => void;
  handleCanvasMouseUp: (e: any) => void;
  setSelectedZone: (id: string | null) => void;
  setSelectedAccessPoint: (id: string | null) => void;
  handleZoneMouseDown: (zoneId: string, e: any) => void;
  setDraggingAPId: (id: string | null) => void;
  setDragAPOffset: (offset: { x: number; y: number } | null) => void;
  onZoneResizeStart?: (zoneId: string, handle: string, e: any) => void;
  updateZone: (zone: Zone) => void;
  setZones: (updater: (zs: Zone[]) => Zone[]) => void;
  setDrawing: (drawing: boolean) => void;
  setDrawRect: (rect: { x: number; y: number; width: number; height: number } | null) => void;
  setDraggingZoneId: (id: string | null) => void;
  setDragOffset: (offset: { x: number; y: number } | null) => void;
  setResizing: (value: null | { zoneId: string; handle: string }) => void;
  setResizeStart: (value: { x: number; y: number; zone: Zone } | null) => void;
  dragOffset: { x: number; y: number } | null;
  resizeStart: { x: number; y: number; zone: Zone } | null;
  setAccessPoints: (updater: (aps: AccessPoint[]) => AccessPoint[]) => void;
  savingZoneIds: string[];
  savingAPIds: string[];
  savedZoneIds: string[];
  savedAPIds: string[];
  drawCircle: { x: number; y: number; radius: number } | null;
  setDrawCircle: (circle: { x: number; y: number; radius: number } | null) => void;
  drawPolygon: { points: { x: number; y: number }[] } | null;
  setDrawPolygon: (polygon: { points: { x: number; y: number }[] } | null) => void;
}

export default function MappingEditorUI(props: MappingEditorUIProps & {
  originalZones?: any[];
  originalAccessPoints?: any[];
}) {
  // Simple shallow compare for unsaved changes
  const unsavedChanges =
    JSON.stringify(props.zones) !== JSON.stringify(props.originalZones) ||
    JSON.stringify(props.accessPoints) !== JSON.stringify(props.originalAccessPoints);
  return (
    <div style={{ display: "flex", flexDirection: "row", height: "100vh", width: "100%", background: "#f4f6fa" }}>
      {/* Editor main area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Sticky horizontal toolbar */}
        <div style={{ position: "sticky", top: 0, zIndex: 10, background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", padding: "12px 24px", borderBottom: "1px solid #e0e0e0" }}>
          <Toolbar
            TOOLS={props.TOOLS as any} // Accept ReactNode icons
            selectedTool={props.selectedTool}
            setSelectedTool={props.setSelectedTool}
            snapToGrid={props.snapToGrid}
            setSnapToGrid={props.setSnapToGrid}
            onUndo={props.onUndo}
            onRedo={props.onRedo}
            onSave={props.onSave}
            canUndo={props.canUndo}
            canRedo={props.canRedo}
            saving={props.saving}
            unsavedChanges={unsavedChanges}
          />
        </div>
        {/* Canvas area */}
        <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "flex-start", padding: 32, minHeight: 0 }}>
          <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 2px 16px rgba(0,0,0,0.06)", border: "1px solid #e0e0e0", padding: 0, minWidth: 900, minHeight: 600, position: "relative", flex: 1, maxWidth: 1200 }}>
            <MappingCanvas
              canvasRef={props.canvasRef}
              handleCanvasMouseMove={props.handleCanvasMouseMove}
              handleCanvasMouseUp={props.handleCanvasMouseUp}
              drawing={props.drawing}
              selectedTool={props.selectedTool}
              drawRect={props.drawRect}
              drawAPPreview={props.drawAPPreview}
              drawCircle={props.drawCircle}
              setDrawCircle={props.setDrawCircle}
              drawPolygon={props.drawPolygon}
              setDrawPolygon={props.setDrawPolygon}
              zones={props.zones}
              selectedZone={props.selectedZone}
              setSelectedZone={props.setSelectedZone}
              setSelectedAccessPoint={props.setSelectedAccessPoint}
              handleZoneMouseDown={props.handleZoneMouseDown}
              accessPoints={props.accessPoints}
              selectedAccessPoint={props.selectedAccessPoint}
              setDraggingAPId={props.setDraggingAPId}
              setDragAPOffset={props.setDragAPOffset}
              draggingZoneId={props.draggingZoneId}
              draggingAPId={props.draggingAPId}
              snapToGrid={props.snapToGrid}
              setSnapToGrid={props.setSnapToGrid}
              onZoneResizeStart={props.onZoneResizeStart}
              setZones={props.setZones}
              setDrawing={props.setDrawing}
              setDrawRect={props.setDrawRect}
              setDraggingZoneId={props.setDraggingZoneId}
              setDragOffset={props.setDragOffset}
              setResizing={props.setResizing}
              setResizeStart={props.setResizeStart}
              updateZone={props.updateZone}
              dragOffset={props.dragOffset}
              resizeStart={props.resizeStart}
              setAccessPoints={props.setAccessPoints}
            />
          </div>
        </div>
      </div>
      {/* Properties panel */}
      <div style={{ width: 340, background: "#fff", borderLeft: "1px solid #e0e0e0", boxShadow: "-2px 0 8px rgba(0,0,0,0.03)", padding: 0, display: "flex", flexDirection: "column" }}>
        <PropertiesPanel
          zones={props.zones}
          selectedZone={props.selectedZone}
          accessPoints={props.accessPoints}
          selectedAccessPoint={props.selectedAccessPoint}
          updateZone={(id, updates) => {
            const zone = props.zones.find(z => z.id === id);
            if (zone) props.updateZone({ ...zone, ...updates });
          }}
          updateAccessPoint={(id, updates) => {
            const ap = props.accessPoints.find(a => a.id === id);
            if (ap) props.setAccessPoints(aps => aps.map(a => a.id === id ? { ...a, ...updates } : a));
          }}
          savingZoneIds={props.savingZoneIds}
          savingAPIds={props.savingAPIds}
          savedZoneIds={props.savedZoneIds}
          savedAPIds={props.savedAPIds}
        />
      </div>
    </div>
  );
} 