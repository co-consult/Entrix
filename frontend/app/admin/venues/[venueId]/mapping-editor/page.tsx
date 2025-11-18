"use client";
import React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import useMappingEditor from "./useMappingEditor";
import MappingEditorUI from "./MappingEditorUI";
import { MousePointer2, Square, Circle, Triangle, DoorOpen } from "lucide-react";
import { Zone } from "./types";

export default function MappingEditorPage({ params }) {
  const editor = useMappingEditor(params.venueId);

  // Map icons to ReactNode for TOOLS
  const TOOLS = [
    { id: "select", label: "Sélectionner", icon: MousePointer2 },
    { id: "rectangle", label: "Rectangle", icon: Square },
    { id: "circle", label: "Cercle", icon: Circle },
    { id: "polygon", label: "Polygone", icon: Triangle },
    { id: "accessPoint", label: "Point d'Accès", icon: DoorOpen },
  ];

  // Wrap updateZone to match expected prop type
  const updateZone = (zone: Zone) => {
    editor.updateZone(zone.id, zone);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar type="admin" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-8 w-full">
          <PageHeader
            title="Cartographie du lieu"
            description="Éditez la cartographie, les zones et les points d'accès de ce lieu."
          />
          <div className="grid gap-4 md:grid-cols-3 mb-6 mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Zones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{editor.zones.length}</div>
                <p className="text-xs text-muted-foreground">Zones configurées</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Points d'accès</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{editor.accessPoints.length}</div>
                <p className="text-xs text-muted-foreground">Points d'accès configurés</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cartographies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{editor.mappings.length}</div>
                <p className="text-xs text-muted-foreground">Cartographies disponibles</p>
              </CardContent>
            </Card>
          </div>
          <MappingEditorUI
            TOOLS={TOOLS}
            selectedTool={editor.selectedTool}
            setSelectedTool={editor.setSelectedTool}
            snapToGrid={editor.snapToGrid}
            setSnapToGrid={editor.setSnapToGrid}
            onUndo={editor.onUndo}
            onRedo={editor.onRedo}
            onSave={editor.handleSave}
            canUndo={editor.canUndo}
            canRedo={editor.canRedo}
            saving={editor.saving}
            zones={editor.zones}
            selectedZone={editor.selectedZone}
            accessPoints={editor.accessPoints}
            selectedAccessPoint={editor.selectedAccessPoint}
            drawing={editor.drawing}
            drawRect={editor.drawRect}
            drawAPPreview={editor.drawAPPreview}
            drawCircle={editor.drawCircle}
            setDrawCircle={editor.setDrawCircle}
            drawPolygon={editor.drawPolygon}
            setDrawPolygon={editor.setDrawPolygon}
            draggingZoneId={editor.draggingZoneId}
            draggingAPId={editor.draggingAPId}
            canvasRef={editor.canvasRef}
            handleCanvasMouseMove={editor.handleCanvasMouseMove}
            handleCanvasMouseUp={editor.handleCanvasMouseUp}
            handleZoneMouseDown={editor.handleZoneMouseDown}
            updateZone={updateZone}
            savingZoneIds={editor.savingZoneIds}
            savingAPIds={editor.savingAPIds}
            savedZoneIds={editor.savedZoneIds}
            savedAPIds={editor.savedAPIds}
            setSelectedZone={editor.setSelectedZone}
            setSelectedAccessPoint={editor.setSelectedAccessPoint}
            setDraggingAPId={editor.setDraggingAPId}
            setDragAPOffset={editor.setDragAPOffset}
            setZones={editor.setZones}
            setDrawing={editor.setDrawing}
            setDrawRect={editor.setDrawRect}
            setDraggingZoneId={editor.setDraggingZoneId}
            setDragOffset={editor.setDragOffset}
            setResizing={editor.setResizing}
            setResizeStart={editor.setResizeStart}
            dragOffset={editor.dragOffset}
            resizeStart={editor.resizeStart}
            setAccessPoints={editor.setAccessPoints}
            handleCanvasMouseDown={editor.handleCanvasMouseDown || (() => {})}
            handleCanvasClick={editor.handleCanvasClick || (() => {})}
            handleAccessPointListClick={editor.handleAccessPointListClick || (() => {})}
          />
        </div>
      </div>
    </div>
  );
}