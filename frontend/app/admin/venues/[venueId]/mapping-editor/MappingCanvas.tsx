import React, { useRef, useEffect } from "react";
import { Zone, AccessPoint } from "./types";
import { Grid, Layout } from "lucide-react";

type MappingCanvasProps = {
  canvasRef: React.RefObject<HTMLDivElement>;
  handleCanvasMouseDown?: (e: any) => void;
  handleCanvasMouseMove: (e: any) => void;
  handleCanvasMouseUp: (e: any) => void;
  handleCanvasClick?: (e: any) => void;
  drawing: boolean;
  selectedTool: string;
  drawRect: { x: number; y: number; width: number; height: number } | null;
  drawAPPreview: { x: number; y: number } | null;
  drawCircle?: { x: number; y: number; radius: number } | null;
  setDrawCircle?: (circle: { x: number; y: number; radius: number } | null) => void;
  drawPolygon?: { points: { x: number; y: number }[] } | null;
  setDrawPolygon?: (polygon: { points: { x: number; y: number }[] } | null) => void;
  zones: Zone[];
  selectedZone: string | null;
  setSelectedZone: (id: string | null) => void;
  setSelectedAccessPoint: (id: string | null) => void;
  handleZoneMouseDown: (zoneId: string, e: any) => void;
  accessPoints: AccessPoint[];
  selectedAccessPoint: string | null;
  setDraggingAPId: (id: string | null) => void;
  setDragAPOffset: (offset: { x: number; y: number } | null) => void;
  handleAccessPointListClick?: (id: string) => void;
  draggingZoneId: string | null;
  draggingAPId: string | null;
  snapToGrid: boolean;
  setSnapToGrid: (val: boolean) => void;
  onZoneResizeStart?: (zoneId: string, handle: string, e: any) => void;
  setZones: (updater: (zs: Zone[]) => Zone[]) => void;
  setDrawing: (drawing: boolean) => void;
  setDrawRect: (rect: { x: number; y: number; width: number; height: number } | null) => void;
  setDraggingZoneId: (id: string | null) => void;
  setDragOffset: (offset: { x: number; y: number } | null) => void;
  setResizing: (resizing: null | { zoneId: string; handle: string }) => void;
  setResizeStart: (start: { x: number; y: number; zone: Zone } | null) => void;
  updateZone: (zone: Zone) => void;
  dragOffset: { x: number; y: number } | null;
  resizeStart: { x: number; y: number; zone: Zone } | null;
  setAccessPoints?: (updater: (aps: AccessPoint[]) => AccessPoint[]) => void;
};

const HANDLE_POSITIONS = [
  { key: 'nw', style: { left: 0, top: 0 }, cursor: 'nwse-resize' },
  { key: 'n', style: { left: '50%', top: 0, transform: 'translateX(-50%)' }, cursor: 'ns-resize' },
  { key: 'ne', style: { right: 0, top: 0 }, cursor: 'nesw-resize' },
  { key: 'e', style: { right: 0, top: '50%', transform: 'translateY(-50%)' }, cursor: 'ew-resize' },
  { key: 'se', style: { right: 0, bottom: 0 }, cursor: 'nwse-resize' },
  { key: 's', style: { left: '50%', bottom: 0, transform: 'translateX(-50%)' }, cursor: 'ns-resize' },
  { key: 'sw', style: { left: 0, bottom: 0 }, cursor: 'nesw-resize' },
  { key: 'w', style: { left: 0, top: '50%', transform: 'translateY(-50%)' }, cursor: 'ew-resize' },
];

// Utility: point-in-circle
function isPointInCircle(px: number, py: number, cx: number, cy: number, r: number) {
  return Math.sqrt((px - cx) ** 2 + (py - cy) ** 2) <= r;
}
// Utility: point-in-polygon (ray-casting)
function isPointInPolygon(px: number, py: number, points: { x: number; y: number }[]) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i].x, yi = points[i].y;
    const xj = points[j].x, yj = points[j].y;
    const intersect = ((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi + 0.00001) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export default function MappingCanvas({
  canvasRef,
  handleCanvasMouseDown = () => {},
  handleCanvasMouseMove,
  handleCanvasMouseUp,
  drawing,
  selectedTool,
  drawRect,
  drawAPPreview,
  zones,
  selectedZone,
  setSelectedZone,
  setSelectedAccessPoint,
  handleZoneMouseDown,
  accessPoints,
  selectedAccessPoint,
  setDraggingAPId,
  setDragAPOffset,
  handleAccessPointListClick = () => {},
  draggingZoneId,
  draggingAPId,
  snapToGrid,
  setSnapToGrid,
  onZoneResizeStart,
  setZones,
  setDrawing,
  setDrawRect,
  setDraggingZoneId,
  setDragOffset,
  setResizing,
  setResizeStart,
  updateZone,
  dragOffset,
  resizeStart,
  setAccessPoints,
  drawCircle,
  setDrawCircle,
  drawPolygon,
  setDrawPolygon,
  setDrawAPPreview,
}: Omit<MappingCanvasProps, 'handleCanvasClick'> & { setDrawAPPreview?: (preview: { x: number; y: number } | null) => void }) {
  // Local refs for drag state
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const resizingRef = useRef<{ zoneId: string; handle: string } | null>(null);
  // Add a ref to track if a global mouseup listener is attached
  const globalMouseUpListener = useRef<((e: MouseEvent) => void) | null>(null);

  // Mouse down handler
  function onMouseDown(e: React.MouseEvent) {
    console.log('onMouseDown', { selectedTool, selectedZone, drawing, draggingZoneId });
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = snapToGrid ? Math.round((e.clientX - rect.left) / 20) * 20 : e.clientX - rect.left;
    const y = snapToGrid ? Math.round((e.clientY - rect.top) / 20) * 20 : e.clientY - rect.top;
    if (selectedTool === "rectangle") {
      // Rectangle logic untouched
      setDrawing(true);
      setDrawRect({ x, y, width: 0, height: 0 });
      dragStartRef.current = { x, y };
    } else if (selectedTool === "circle" && typeof setDrawCircle === 'function') {
      // Start drawing a circle
      setDrawing(true);
      setDrawCircle({ x, y, radius: 0 });
      dragStartRef.current = { x, y };
    } else if (selectedTool === "polygon" && typeof setDrawPolygon === 'function') {
      if (!drawPolygon || !drawPolygon.points.length) {
        setDrawing(true);
        setDrawPolygon({ points: [{ x, y }] });
      } else {
        const first = drawPolygon.points[0];
        const dist = Math.sqrt(Math.pow(x - first.x, 2) + Math.pow(y - first.y, 2));
        if (dist < 16 && drawPolygon.points.length >= 3) {
          setZones((zs: Zone[]) => [
            ...zs,
            {
              id: `zone-${Date.now()}`,
              name: "Nouveau polygone",
              type: "GENERAL_ADMISSION",
              shape: "POLYGON",
              category: "MAIN_ARENA",
              capacity: 0,
              x: first.x,
              y: first.y,
              points: drawPolygon.points,
              color: "#e3f2fd",
              description: JSON.stringify({
                x: first.x,
                y: first.y,
                points: drawPolygon.points,
                color: "#e3f2fd",
              }),
            },
          ]);
          setDrawing(false);
          setDrawPolygon(null);
        } else {
          setDrawPolygon({ points: [...drawPolygon.points, { x, y }] });
        }
      }
    } else if (selectedTool === "accessPoint" && typeof setAccessPoints === 'function') {
      // Place a new access point
      setAccessPoints((aps: AccessPoint[]) => [
        ...aps,
        {
          id: `ap-${Date.now()}`,
          name: "Nouveau point d'accès",
          type: "DOOR",
          x: x - 16,
          y: y - 16,
          description: "",
        },
      ]);
    } else if (selectedTool === "select") {
      // Rectangle/zone selection logic
      let foundZone: Zone | undefined;
      let foundType: 'rect' | 'circle' | 'polygon' | undefined;
      // Check rectangles
      foundZone = zones.find(z => (z.shape === undefined || z.shape === "RECTANGLE") && x >= z.x && x <= z.x + (z.width ?? 0) && y >= z.y && y <= z.y + (z.height ?? 0));
      if (foundZone) foundType = 'rect';
      // Check circles
      if (!foundZone) {
        foundZone = zones.find(z => z.shape === "CIRCLE" && typeof z.x === 'number' && typeof z.y === 'number' && typeof z.radius === 'number' && isPointInCircle(x, y, z.x, z.y, z.radius ?? 0));
        if (foundZone) foundType = 'circle';
      }
      // Check polygons
      if (!foundZone) {
        foundZone = zones.find(z => z.shape === "POLYGON" && Array.isArray(z.points) && z.points.length > 2 && isPointInPolygon(x, y, z.points!));
        if (foundZone) foundType = 'polygon';
      }
      if (foundZone) {
        setSelectedZone(foundZone.id);
        setDraggingZoneId(foundZone.id);
        setDragOffset({ x: x - (foundZone.x ?? 0), y: y - (foundZone.y ?? 0) });
        // Add global mouseup listener
        if (!globalMouseUpListener.current) {
          globalMouseUpListener.current = (evt: MouseEvent) => {
            onMouseUp(evt as any);
          };
          window.addEventListener('mouseup', globalMouseUpListener.current);
        }
        console.log('Start dragging', { zoneId: foundZone.id, dragOffset: { x: x - (foundZone.x ?? 0), y: y - (foundZone.y ?? 0) }, foundType });
      }
      // Do NOT setSelectedZone(null) here! Let handleCanvasClick handle deselection.
    }
  }

  // Mouse move handler
  function onMouseMove(e: React.MouseEvent) {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    let x = snapToGrid ? Math.round((e.clientX - rect.left) / 20) * 20 : e.clientX - rect.left;
    let y = snapToGrid ? Math.round((e.clientY - rect.top) / 20) * 20 : e.clientY - rect.top;
    x = Number.isFinite(x) ? Number(x) : 0;
    y = Number.isFinite(y) ? Number(y) : 0;
    if (selectedTool === "rectangle" && drawing && dragStartRef.current) {
      // Rectangle logic untouched
      const { x: startX, y: startY } = dragStartRef.current;
      setDrawRect({
        x: Math.min(Number(startX), Number(x)),
        y: Math.min(Number(startY), Number(y)),
        width: Math.abs(Number(x) - Number(startX)),
        height: Math.abs(Number(y) - Number(startY)),
      });
    } else if (selectedTool === "circle" && drawing && dragStartRef.current && typeof setDrawCircle === 'function') {
      // Update circle preview
      const { x: cx, y: cy } = dragStartRef.current;
      const safeCx = typeof cx === 'number' ? cx : 0;
      const safeCy = typeof cy === 'number' ? cy : 0;
      const radius = Math.sqrt(Math.pow(Number(x) - safeCx, 2) + Math.pow(Number(y) - safeCy, 2));
      setDrawCircle({ x: safeCx, y: safeCy, radius });
    } else if (selectedTool === "polygon" && drawing && drawPolygon && typeof setDrawPolygon === 'function') {
      // Show preview line from last point to cursor
      // (handled in render)
    } else if (selectedTool === "accessPoint" && typeof setDrawAPPreview === 'function') {
      const safeX = typeof x === 'number' && !isNaN(x) ? x : 0;
      const safeY = typeof y === 'number' && !isNaN(y) ? y : 0;
      setDrawAPPreview({ x: safeX - 16, y: safeY - 16 });
    } else if (selectedTool === "select" && draggingZoneId && dragStartRef.current) {
      // Move logic for all shapes
      setZones((zs: Zone[]) =>
        zs.map((z: Zone) => {
          if (z.id !== draggingZoneId) return z;
          if (z.shape === undefined || z.shape === "RECTANGLE") {
            return { ...z, x: x - ((dragOffset && dragOffset.x) || 0), y: y - ((dragOffset && dragOffset.y) || 0) };
          } else if (z.shape === "CIRCLE") {
            return { ...z, x: x - ((dragOffset && dragOffset.x) || 0), y: y - ((dragOffset && dragOffset.y) || 0) };
          } else if (z.shape === "POLYGON" && Array.isArray(z.points)) {
            // Move all points by delta
            const dx = x - (dragStartRef.current?.x ?? 0);
            const dy = y - (dragStartRef.current?.y ?? 0);
            const movedPoints = z.points.map(pt => ({ x: pt.x + dx, y: pt.y + dy }));
            return { ...z, x: z.x + dx, y: z.y + dy, points: movedPoints };
          }
          return z;
        })
      );
      // For polygons, update dragStartRef so movement is smooth
      if (zones.find(z => z.id === draggingZoneId)?.shape === "POLYGON") {
        dragStartRef.current = { x, y };
      }
      console.log('Dragging zone', { draggingZoneId, x, y, dragOffset });
    } else if (selectedTool === "select" && typeof resizingRef.current === 'object' && resizingRef.current !== null && resizeStart) {
      // Rectangle/zone resize logic untouched
      const { zoneId, handle } = resizingRef.current;
      setZones((zs: Zone[]) =>
        zs.map((z: Zone) => {
          if (z.id !== zoneId) return z;
          let { x: zx, y: zy, width: zw, height: zh } = z;
          const dx = x - resizeStart.x;
          const dy = y - resizeStart.y;
          const startZone = resizeStart.zone || z;
          switch (handle) {
            case 'nw':
              zx = startZone.x + dx;
              zy = startZone.y + dy;
              zw = (startZone.width ?? 0) - dx;
              zh = (startZone.height ?? 0) - dy;
              break;
            case 'n':
              zy = startZone.y + dy;
              zh = (startZone.height ?? 0) - dy;
              break;
            case 'ne':
              zy = startZone.y + dy;
              zw = (startZone.width ?? 0) + dx;
              zh = (startZone.height ?? 0) - dy;
              break;
            case 'e':
              zw = (startZone.width ?? 0) + dx;
              break;
            case 'se':
              zw = (startZone.width ?? 0) + dx;
              zh = (startZone.height ?? 0) + dy;
              break;
            case 's':
              zh = (startZone.height ?? 0) + dy;
              break;
            case 'sw':
              zx = startZone.x + dx;
              zw = (startZone.width ?? 0) - dx;
              zh = (startZone.height ?? 0) + dy;
              break;
            case 'w':
              zx = startZone.x + dx;
              zw = (startZone.width ?? 0) - dx;
              break;
          }
          // Prevent negative width/height
          zw = Math.max(10, zw);
          zh = Math.max(10, zh);
          console.log('Resizing zone', { zoneId, handle, zx, zy, zw, zh });
          return { ...z, x: zx, y: zy, width: zw, height: zh };
        })
      );
    }
  }

  // Mouse up handler
  function onMouseUp(e: React.MouseEvent | MouseEvent) {
    console.log('onMouseUp', { draggingZoneId, resizing: resizingRef.current, selectedZone });
    // Remove global mouseup listener if present
    if (globalMouseUpListener.current) {
      window.removeEventListener('mouseup', globalMouseUpListener.current);
      globalMouseUpListener.current = null;
    }
    if (selectedTool === "rectangle" && drawing && drawRect) {
      // Rectangle logic unified
      if (drawRect.width > 10 && drawRect.height > 10) {
        setZones((zs: Zone[]) => [
          ...zs,
          {
            id: `zone-${Date.now()}`,
            name: "Nouvelle zone",
            type: "GENERAL_ADMISSION",
            shape: "RECTANGLE",
            category: "MAIN_ARENA",
            capacity: 0,
            x: drawRect.x,
            y: drawRect.y,
            width: drawRect.width,
            height: drawRect.height,
            color: "#e3f2fd",
            description: JSON.stringify({
              x: drawRect.x,
              y: drawRect.y,
              width: drawRect.width,
              height: drawRect.height,
              color: "#e3f2fd",
            }),
          },
        ]);
      }
      setDrawing(false);
      setDrawRect(null);
      dragStartRef.current = null;
    } else if (selectedTool === "circle" && drawing && drawCircle && typeof setDrawCircle === 'function') {
      // Circle logic unified
      if ((drawCircle.radius ?? 0) > 10) {
        setZones((zs: Zone[]) => [
          ...zs,
          {
            id: `zone-${Date.now()}`,
            name: "Nouveau cercle",
            type: "GENERAL_ADMISSION",
            shape: "CIRCLE",
            category: "MAIN_ARENA",
            capacity: 0,
            x: drawCircle.x ?? 0,
            y: drawCircle.y ?? 0,
            radius: drawCircle.radius ?? 0,
            color: "#e3f2fd",
            description: JSON.stringify({
              x: drawCircle.x ?? 0,
              y: drawCircle.y ?? 0,
              radius: drawCircle.radius ?? 0,
              color: "#e3f2fd",
            }),
          },
        ]);
      }
      setDrawing(false);
      setDrawCircle(null);
      dragStartRef.current = null;
    } else if (selectedTool === "polygon" && drawing && drawPolygon && typeof setDrawPolygon === 'function') {
      // No action on mouse up for polygon
    } else if (selectedTool === "accessPoint" && typeof setDrawAPPreview === 'function') {
      setDrawAPPreview(null);
    } else if (selectedTool === "select" && draggingZoneId) {
      setDraggingZoneId(null);
      setDragOffset(null);
      dragStartRef.current = null;
      // Do NOT call setSelectedZone here!
    } else if (selectedTool === "select" && typeof resizingRef.current === 'object' && resizingRef.current !== null) {
      setResizing(null);
      setResizeStart(null);
      resizingRef.current = null;
    }
  }

  // Add a handler to clear selection when clicking on empty space
  function handleCanvasClick(e: React.MouseEvent) {
    const tag = (e.target as HTMLElement).tagName.toLowerCase();
    console.log("Canvas clicked", e.target === e.currentTarget, tag, e.target, e.currentTarget);
    if (
      e.target === e.currentTarget ||
      (tag === 'svg')
    ) {
      setSelectedZone(null);
      setSelectedAccessPoint && setSelectedAccessPoint(null);
    }
  }

  return (
    <div
      ref={canvasRef}
      style={{
        flex: 1,
        position: "relative",
        background: snapToGrid
          ? `repeating-linear-gradient(0deg, #f0f0f0, #f0f0f0 1px, transparent 1px, transparent 20px), repeating-linear-gradient(90deg, #f0f0f0, #f0f0f0 1px, transparent 1px, transparent 20px)`
          : "#fff",
        border: "1px solid #eee",
        margin: 16,
        minHeight: 600,
        overflow: "auto",
        zIndex: 10,
      }}
      tabIndex={0}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onClick={handleCanvasClick}
    >
      {/* Snap to grid floating icon toggle */}
      <div
        style={{
          position: "absolute",
          top: 20,
          right: 24,
          zIndex: 200,
          background: "rgba(255,255,255,0.85)",
          borderRadius: 8,
          boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
          padding: "6px 16px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 15,
          userSelect: "none"
        }}
      >
        <button
          aria-label="Activer le quadrillage"
          onClick={() => setSnapToGrid(true)}
          style={{
            background: snapToGrid ? '#e3f2fd' : 'transparent',
            border: 'none',
            borderRadius: 6,
            padding: 4,
            cursor: 'pointer',
            boxShadow: snapToGrid ? '0 1px 4px rgba(33,150,243,0.10)' : 'none',
            color: snapToGrid ? '#1976d2' : '#888',
            transition: 'all 0.15s',
            outline: 'none',
            marginRight: 2
          }}
        >
          <Grid size={22} />
        </button>
        <button
          aria-label="Désactiver le quadrillage"
          onClick={() => setSnapToGrid(false)}
          style={{
            background: !snapToGrid ? '#e3f2fd' : 'transparent',
            border: 'none',
            borderRadius: 6,
            padding: 4,
            cursor: 'pointer',
            boxShadow: !snapToGrid ? '0 1px 4px rgba(33,150,243,0.10)' : 'none',
            color: !snapToGrid ? '#1976d2' : '#888',
            transition: 'all 0.15s',
            outline: 'none',
            marginLeft: 2
          }}
        >
          <Layout size={22} />
        </button>
      </div>
      {/* Drawing preview for new zone */}
      {drawing && selectedTool === "rectangle" && drawRect && (
        <div
          style={{
            position: "absolute",
            left: typeof drawRect.x === 'number' && !isNaN(drawRect.x) ? drawRect.x : 0,
            top: typeof drawRect.y === 'number' && !isNaN(drawRect.y) ? drawRect.y : 0,
            width: typeof drawRect.width === 'number' && !isNaN(drawRect.width) ? drawRect.width : 0,
            height: typeof drawRect.height === 'number' && !isNaN(drawRect.height) ? drawRect.height : 0,
            background: "rgba(33, 150, 243, 0.2)",
            border: "2px dashed #1976d2",
            pointerEvents: "none",
            zIndex: 100,
          }}
        />
      )}
      {/* Drawing preview for new polygon */}
      {drawing && selectedTool === "polygon" && drawPolygon && drawPolygon.points.length > 0 && (
        <svg
          style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", pointerEvents: "auto", zIndex: 100, border: '2px solid red' }}
        >
          {drawPolygon.points.length >= 3 ? (
            <polygon
              points={drawPolygon.points.map(p => `${p.x},${p.y}`).join(" ")}
              fill="rgba(33,150,243,0.15)"
              stroke="#1976d2"
              strokeWidth={2}
            />
          ) : (
            <polyline
              points={drawPolygon.points.map(p => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke="#1976d2"
              strokeWidth={2}
            />
          )}
          {/* Draw points, make first point clickable to finish */}
          {drawPolygon.points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={i === 0 ? 10 : 6}
              fill={i === 0 ? "#1976d2" : "#fff"}
              stroke="#1976d2"
              strokeWidth={2}
              style={{ cursor: i === 0 && drawPolygon.points.length >= 3 ? 'pointer' : 'default', pointerEvents: 'all' }}
              onClick={i === 0 && drawPolygon.points.length >= 3 ? (e) => {
                e.stopPropagation();
                setZones((zs: Zone[]) => [
                  ...zs,
                  {
                    id: `zone-${Date.now()}`,
                    name: "Nouveau polygone",
                    type: "GENERAL_ADMISSION",
                    shape: "POLYGON",
                    category: "MAIN_ARENA",
                    capacity: 0,
                    x: Number(p.x),
                    y: Number(p.y),
                    points: drawPolygon.points.map(pt => ({ x: Number(pt.x), y: Number(pt.y) })),
                    color: "#e3f2fd",
                    description: JSON.stringify({
                      x: Number(p.x),
                      y: Number(p.y),
                      points: drawPolygon.points.map(pt => ({ x: Number(pt.x), y: Number(pt.y) })),
                      color: "#e3f2fd",
                    }),
                  },
                ]);
                setDrawing(false);
                if (typeof setDrawPolygon === 'function') setDrawPolygon(null);
              } : undefined}
            />
          ))}
        </svg>
      )}
      {/* Drawing preview for new circle */}
      {drawing && selectedTool === "circle" && drawCircle && (
        <div
          style={{
            position: "absolute",
            left: (typeof drawCircle.x === 'number' && !isNaN(drawCircle.x) ? drawCircle.x : 0) - (typeof drawCircle.radius === 'number' && !isNaN(drawCircle.radius) ? drawCircle.radius : 0),
            top: (typeof drawCircle.y === 'number' && !isNaN(drawCircle.y) ? drawCircle.y : 0) - (typeof drawCircle.radius === 'number' && !isNaN(drawCircle.radius) ? drawCircle.radius : 0),
            width: (typeof drawCircle.radius === 'number' && !isNaN(drawCircle.radius) ? drawCircle.radius : 0) * 2,
            height: (typeof drawCircle.radius === 'number' && !isNaN(drawCircle.radius) ? drawCircle.radius : 0) * 2,
            background: "rgba(33, 150, 243, 0.2)",
            border: "2px dashed #1976d2",
            borderRadius: "50%",
            pointerEvents: "none",
            zIndex: 100,
          }}
        />
      )}
      {/* Access point creation preview */}
      {selectedTool === "accessPoint" && drawAPPreview && (
        <div
          style={{
            position: "absolute",
            left: drawAPPreview.x,
            top: drawAPPreview.y,
            width: 32,
            height: 32,
            background: "#fff8e1",
            border: "2px dashed #ffb300",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            zIndex: 100,
            opacity: 0.7,
          }}
        >
          🚪
        </div>
      )}
      {/* Grid lines (only if snapToGrid) */}
      {snapToGrid && (
        <>
          {[...Array(Math.floor(1200 / 20)).keys()].map(i => (
            <div
              key={`vgrid-${i}`}
              style={{
                position: "absolute",
                left: i * 20,
                top: 0,
                width: 1,
                height: "100%",
                background: "#e0e0e0",
                opacity: 0.3,
                zIndex: 0,
                pointerEvents: "none"
              }}
            />
          ))}
          {[...Array(Math.floor(600 / 20)).keys()].map(j => (
            <div
              key={`hgrid-${j}`}
              style={{
                position: "absolute",
                top: j * 20,
                left: 0,
                width: "100%",
                height: 1,
                background: "#e0e0e0",
                opacity: 0.3,
                zIndex: 0,
                pointerEvents: "none"
              }}
            />
          ))}
        </>
      )}
      {/* Render zones */}
      {zones.map(zone => (
        zone.shape === "POLYGON" && zone.points && zone.points.length > 2 ? (
          <svg
            key={zone.id}
            style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", pointerEvents: "auto", zIndex: 1 }}
            onMouseDown={e => {
              e.stopPropagation();
              setSelectedZone(zone.id);
              setDraggingZoneId(zone.id);
              const offsetX = typeof e.nativeEvent.offsetX === 'number' ? e.nativeEvent.offsetX : 0;
              const offsetY = typeof e.nativeEvent.offsetY === 'number' ? e.nativeEvent.offsetY : 0;
              dragStartRef.current = { x: offsetX, y: offsetY };
              setDragOffset({ x: offsetX - (zone.x ?? 0), y: offsetY - (zone.y ?? 0) });
            }}
            onClick={e => { e.stopPropagation(); setSelectedZone(zone.id); }}
            onMouseUp={onMouseUp}
          >
            <polygon
              points={zone.points.map(p => `${p.x},${p.y}`).join(" ")}
              fill={selectedZone === zone.id ? "#90caf9" : "#e3f2fd"}
              stroke="#1976d2"
              strokeWidth={selectedZone === zone.id ? 3 : 2}
            />
            {/* Draw points for selection feedback */}
            {zone.points.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={6} fill={i === 0 ? "#1976d2" : "#fff"} stroke="#1976d2" strokeWidth={2} />
            ))}
          </svg>
        ) : zone.shape === "CIRCLE" && typeof zone.x === 'number' && typeof zone.y === 'number' && typeof zone.radius === 'number' ? (
          <svg
            key={zone.id}
            style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", pointerEvents: "auto", zIndex: 1 }}
            onMouseDown={e => {
              e.stopPropagation();
              setSelectedZone(zone.id);
              setDraggingZoneId(zone.id);
              const offsetX = typeof e.nativeEvent.offsetX === 'number' ? e.nativeEvent.offsetX : 0;
              const offsetY = typeof e.nativeEvent.offsetY === 'number' ? e.nativeEvent.offsetY : 0;
              dragStartRef.current = { x: offsetX, y: offsetY };
              setDragOffset({ x: offsetX - (zone.x ?? 0), y: offsetY - (zone.y ?? 0) });
            }}
            onClick={e => { e.stopPropagation(); setSelectedZone(zone.id); }}
            onMouseUp={onMouseUp}
          >
            <circle
              cx={zone.x}
              cy={zone.y}
              r={zone.radius}
              fill={selectedZone === zone.id ? "#90caf9" : "#e3f2fd"}
              stroke="#1976d2"
              strokeWidth={selectedZone === zone.id ? 3 : 2}
            />
            <text
              x={zone.x}
              y={zone.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={Math.max(12, zone.radius / 2)}
              fill="#1976d2"
              style={{ pointerEvents: "none", fontWeight: "bold" }}
            >
              {zone.name}
            </text>
          </svg>
        ) : (
          <div
            key={zone.id}
            style={{
              position: "absolute",
              left: typeof zone.x === 'number' && !isNaN(zone.x) ? zone.x : 0,
              top: typeof zone.y === 'number' && !isNaN(zone.y) ? zone.y : 0,
              width: typeof zone.width === 'number' && !isNaN(zone.width) ? zone.width : 0,
              height: typeof zone.height === 'number' && !isNaN(zone.height) ? zone.height : 0,
              background: selectedZone === zone.id ? "#90caf9" : "#e3f2fd",
              border: selectedZone === zone.id ? "3px solid #1976d2" : "2px solid #1976d2",
              boxShadow: selectedZone === zone.id ? "0 4px 16px rgba(25, 118, 210, 0.12)" : "0 1px 4px rgba(0,0,0,0.04)",
              cursor: draggingZoneId === zone.id ? "grabbing" : "move",
              zIndex: draggingZoneId === zone.id ? 2 : 1,
              borderRadius: 8,
              transition: "box-shadow 0.2s, border 0.2s, background 0.2s",
              overflow: "hidden",
            }}
            onMouseDown={e => { e.stopPropagation(); handleZoneMouseDown(zone.id, e); }}
            onClick={e => {
              e.stopPropagation();
              setSelectedZone(zone.id);
              setSelectedAccessPoint(null);
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = "0 2px 12px rgba(25, 118, 210, 0.10)"}
            onMouseLeave={e => e.currentTarget.style.boxShadow = selectedZone === zone.id ? "0 4px 16px rgba(25, 118, 210, 0.12)" : "0 1px 4px rgba(0,0,0,0.04)"}
          >
            <span style={{ fontWeight: "bold", padding: 6, display: "block" }}>{zone.name}</span>
            {/* Resize handles for selected zone */}
            {selectedZone === zone.id && HANDLE_POSITIONS.map(handle => (
              <div
                key={handle.key}
                style={{
                  position: "absolute",
                  width: 12,
                  height: 12,
                  background: "#fff",
                  border: "2px solid #1976d2",
                  borderRadius: 2,
                  left: handle.style.left !== undefined ? Number(handle.style.left) : undefined,
                  top: handle.style.top !== undefined ? Number(handle.style.top) : undefined,
                  right: handle.style.right !== undefined ? Number(handle.style.right) : undefined,
                  bottom: handle.style.bottom !== undefined ? Number(handle.style.bottom) : undefined,
                  transform: handle.style.transform,
                  cursor: handle.cursor,
                  zIndex: 10,
                }}
                onMouseDown={e => {
                  e.stopPropagation();
                  onZoneResizeStart && onZoneResizeStart(zone.id, handle.key, e);
                }}
              />
            ))}
          </div>
        )
      ))}
      {/* Render access points */}
      {accessPoints.map(ap => (
        <div
          key={ap.id}
          style={{
            position: "absolute",
            left: ap.x,
            top: ap.y,
            width: 32,
            height: 32,
            background: selectedAccessPoint === ap.id ? "#ffe082" : "#fff8e1",
            border: "2px solid #ffb300",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: draggingAPId === ap.id ? "grabbing" : "pointer",
            zIndex: draggingAPId === ap.id ? 2 : 1,
            boxShadow: selectedAccessPoint === ap.id ? "0 2px 8px rgba(255, 179, 0, 0.18)" : "0 1px 2px rgba(0,0,0,0.04)",
            fontSize: 20,
            transition: "box-shadow 0.2s, background 0.2s",
          }}
          onMouseDown={e => {
            setDraggingAPId(ap.id);
            const rect = canvasRef.current?.getBoundingClientRect();
            if (!rect) return;
            setDragAPOffset({ x: e.clientX - rect.left - ap.x, y: e.clientY - rect.top - ap.y });
          }}
          onClick={e => {
            e.stopPropagation();
            handleAccessPointListClick(ap.id);
          }}
        >
          <span role="img" aria-label="Access Point">🚪</span>
        </div>
      ))}
    </div>
  );
} 