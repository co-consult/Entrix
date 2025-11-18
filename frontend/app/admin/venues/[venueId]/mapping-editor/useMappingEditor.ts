import { useState, useRef, useEffect } from "react";
import api from "@/lib/api";
import {
  Zone,
  AccessPoint,
  LogicalShape,
  Mapping,
  EditorState
} from "./types";
import { useToast } from "@/hooks/use-toast";
import { MousePointer2, Square, Circle, Triangle, DoorOpen } from "lucide-react";

const TOOLS = [
  { id: "select", label: "Sélectionner", icon: MousePointer2 },
  { id: "rectangle", label: "Rectangle", icon: Square },
  { id: "circle", label: "Cercle", icon: Circle },
  { id: "polygon", label: "Polygone", icon: Triangle },
  { id: "accessPoint", label: "Point d'Accès", icon: DoorOpen },
];

const GRID_SIZE = 20;

// Helper to map legacy DB values to DTO/UI values
function toDtoZoneType(type: string): string {
  switch (type) {
    case 'GENERAL_ADMISSION': return 'GENERAL';
    case 'WHEELCHAIR_ACCESSIBLE': return 'WHEELCHAIR';
    default: return type;
  }
}
function toDtoZoneCategory(category: string): string {
  switch (category) {
    case 'MAIN_ARENA': return 'MAIN_FLOOR';
    default: return category;
  }
}

export default function useMappingEditor(venueId: string) {
  // State
  const [mappings, setMappings] = useState<{ id: string; name: string }[]>([]);
  const [selectedMapping, setSelectedMapping] = useState<string>("");
  const [selectedTool, _setSelectedTool] = useState("select");
  // Wrap setSelectedTool to reset state on tool change
  const setSelectedTool = (tool: string) => {
    resetEditorState();
    _setSelectedTool(tool);
  };
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [accessPoints, setAccessPoints] = useState<AccessPoint[]>([]);
  const [selectedAccessPoint, setSelectedAccessPoint] = useState<string | null>(null);
  const [snapToGrid, setSnapToGrid] = useState<boolean>(false);
  const [drawing, setDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawRect, setDrawRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [draggingZoneId, setDraggingZoneId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const [resizing, setResizing] = useState<null | { zoneId: string; handle: string }>(null);
  const [resizeStart, setResizeStart] = useState<{ x: number; y: number; zone: Zone } | null>(null);
  const [draggingAPId, setDraggingAPId] = useState<string | null>(null);
  const [dragAPOffset, setDragAPOffset] = useState<{ x: number; y: number } | null>(null);
  const [history, setHistory] = useState<{ zones: Zone[]; accessPoints: AccessPoint[]; logicalShapes: LogicalShape[] }[]>([]);
  const [future, setFuture] = useState<{ zones: Zone[]; accessPoints: AccessPoint[]; logicalShapes: LogicalShape[] }[]>([]);
  const [loadingMappings, setLoadingMappings] = useState(true);
  const [loadingMappingData, setLoadingMappingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logicalShapes, setLogicalShapes] = useState<LogicalShape[]>([]);
  const [selectedLogicalId, setSelectedLogicalId] = useState<string | null>(null);
  const [drawingLogical, setDrawingLogical] = useState<null | { tool: string; start: { x: number; y: number } }>(null);
  const [drawLogicalPreview, setDrawLogicalPreview] = useState<any>(null);
  const [savingShapeIds, setSavingShapeIds] = useState<string[]>([]);
  const [drawAPPreview, setDrawAPPreview] = useState<{ x: number; y: number } | null>(null);
  const [drawCircle, setDrawCircle] = useState<{ x: number; y: number; radius: number } | null>(null);
  const [drawPolygon, setDrawPolygon] = useState<{ points: { x: number; y: number }[] } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const zoneSaveTimeouts = useRef<{ [id: string]: NodeJS.Timeout }>({});
  const apSaveTimeouts = useRef<{ [id: string]: NodeJS.Timeout }>({});
  const [savingZoneIds, setSavingZoneIds] = useState<string[]>([]);
  const [savingAPIds, setSavingAPIds] = useState<string[]>([]);
  const [savedZoneIds, setSavedZoneIds] = useState<string[]>([]);
  const [savedAPIds, setSavedAPIds] = useState<string[]>([]);
  const [deletedZoneIds, setDeletedZoneIds] = useState<string[]>([]);
  const [originalZones, setOriginalZones] = useState<Zone[]>([]);
  const [originalAccessPoints, setOriginalAccessPoints] = useState<AccessPoint[]>([]);
  const { toast } = useToast();
  const didSelectInitialZone = useRef(false);

  // Helper to push to history (fine-grained)
  function pushHistorySingle(newZones: Zone[], newAPs: AccessPoint[], newLogicalShapes: LogicalShape[]) {
    setHistory(h => [
      { zones: JSON.parse(JSON.stringify(zones)), accessPoints: JSON.parse(JSON.stringify(accessPoints)), logicalShapes: JSON.parse(JSON.stringify(logicalShapes)) },
      ...h
    ]);
    setFuture([]);
  }

  // --- ATOMIC HISTORY PUSH HELPERS ---
  function pushHistory() {
    setHistory(h => [
      { zones: JSON.parse(JSON.stringify(zones)), accessPoints: JSON.parse(JSON.stringify(accessPoints)), logicalShapes: JSON.parse(JSON.stringify(logicalShapes)) },
      ...h
    ]);
    setFuture([]);
  }

  // --- ZONE STATE CHANGERS ---
  function addZone(newZone: Zone, selectAfterCreate: boolean = false) {
    pushHistory();
    const safeType = newZone.type || 'GENERAL_ADMISSION';
    const safeCategory = (newZone as any).category || 'MAIN_ARENA';
    setZones(zs => [
      ...zs,
      {
        ...newZone,
        backendId: undefined,
        type: safeType,
        category: safeCategory,
        capacity: typeof newZone.capacity === 'number' && newZone.capacity > 0 ? newZone.capacity : 1,
        description: JSON.stringify({
          x: typeof newZone.x === 'number' ? newZone.x : 100,
          y: typeof newZone.y === 'number' ? newZone.y : 100,
          width: typeof newZone.width === 'number' ? newZone.width : 120,
          height: typeof newZone.height === 'number' ? newZone.height : 80,
          color: newZone.color || '#e3f2fd',
        }),
      },
    ]);
    if (selectAfterCreate) setSelectedZone(newZone.id);
  }
  function editZone(id: string, updates: Partial<Zone>) {
    pushHistory();
    setZones(zs => zs.map(z => z.id === id ? { ...z, ...updates } : z));
  }
  function moveZone(id: string, x: number, y: number) {
    pushHistory();
    setZones(zs => zs.map(z => z.id === id ? { ...z, x, y } : z));
  }
  function deleteZone(id: string) {
    pushHistory();
    setZones(zs => zs.filter(z => z.id !== id));
    setDeletedZoneIds(ids => {
      const z = zones.find(z => z.id === id);
      return z && z.backendId ? [...ids, z.backendId] : ids;
    });
    setSelectedZone(null);
  }

  // --- ACCESS POINT STATE CHANGERS ---
  function addAccessPoint(newAP: AccessPoint) {
    pushHistory();
    setAccessPoints(aps => [...aps, { ...newAP, backendId: undefined }]);
  }
  function editAccessPoint(id: string, updates: Partial<AccessPoint>) {
    pushHistory();
    setAccessPoints(aps => aps.map(a => a.id === id ? { ...a, ...updates } : a));
  }
  function moveAccessPoint(id: string, x: number, y: number) {
    pushHistory();
    setAccessPoints(aps => aps.map(a => a.id === id ? { ...a, x, y } : a));
  }
  function deleteAccessPoint(id: string) {
    pushHistory();
    setAccessPoints(aps => aps.filter(a => a.id !== id));
    setSelectedAccessPoint(null);
  }

  // --- LOGICAL SHAPE STATE CHANGERS ---
  function addLogicalShape(newShape: LogicalShape) {
    pushHistory();
    setLogicalShapes(ls => [...ls, { ...newShape, backendId: undefined }]);
  }
  function editLogicalShape(id: string, updates: Partial<LogicalShape>) {
    pushHistory();
    setLogicalShapes(ls => ls.map(l => l.id === id ? { ...l, ...updates } : l));
  }
  function deleteLogicalShape(id: string) {
    pushHistory();
    setLogicalShapes(ls => ls.filter(l => l.id !== id));
  }

  // Helper to map UI/DTO values to Prisma/DB enums
  // Remove mapZoneType and mapZoneCategory functions

  // Fetch mappings on mount
  useEffect(() => {
    setLoadingMappings(true);
    api.getVenueMappings(venueId)
      .then((data: any) => {
        setMappings(data);
        if (data.length > 0) {
          setSelectedMapping(data[0].id);
        }
      })
      .catch(() => setError("Erreur lors du chargement des mappings."))
      .finally(() => setLoadingMappings(false));
  }, [venueId]);

  // Load mapping data when selectedMapping changes
  useEffect(() => {
    if (!selectedMapping) return;
    setLoadingMappingData(true);
    api.getVenueMapping(venueId, selectedMapping)
      .then((mapping: any) => {
        const mappedZones = (mapping.data?.zones || []).map((z: any) => ({
          ...z,
          type: toDtoZoneType(z.type),
          category: toDtoZoneCategory((z as any).category),
        }));
        console.log('Loading mapping data, mappedZones:', mappedZones);
        setZones(mappedZones);
        setOriginalZones(mappedZones ? JSON.parse(JSON.stringify(mappedZones)) : []);
        setAccessPoints(mapping.data?.accessPoints || []);
        setOriginalAccessPoints(mapping.data?.accessPoints ? JSON.parse(JSON.stringify(mapping.data.accessPoints)) : []);
        if (!didSelectInitialZone.current) {
          setSelectedZone((mappedZones && mappedZones[0]?.id) || null);
          didSelectInitialZone.current = true;
        }
      })
      .catch(() => {
        setZones([]);
        setOriginalZones([]);
        setAccessPoints([]);
        setOriginalAccessPoints([]);
        setSelectedZone(null);
        setError("Erreur lors du chargement de la cartographie.");
      })
      .finally(() => setLoadingMappingData(false));
  }, [selectedMapping, venueId]);

  // Load existing zones and amenities on mount
  useEffect(() => {
    let mounted = true;
    async function loadBackendShapes() {
      try {
        const [zonesRaw, amenitiesRaw] = await Promise.all([
          api.getVenueZones(venueId),
          api.getVenueAmenities(venueId),
        ]);
        const zones: any[] = zonesRaw as any[];
        const amenities: any[] = amenitiesRaw as any[];
        if (!mounted) return;
        const zoneShapes = (Array.isArray(zones) ? zones : []).map((z: any) => {
          let geometry: any = {};
          try { geometry = JSON.parse(z.description || "{}") } catch {}
          return {
            id: `section-${z.id}`,
            backendId: z.id,
            type: "section",
            x: geometry.x || 100,
            y: geometry.y || 100,
            width: geometry.width || 120,
            height: geometry.height || 80,
            name: z.name,
            description: z.description,
            color: geometry.color || "#e3f2fd",
            capacity: z.capacity || 0,
          };
        });
        const amenityShapes = (Array.isArray(amenities) ? amenities : []).map((a: any) => {
          let loc = { x: 100, y: 100 };
          try { loc = JSON.parse(a.location || "{}") } catch {}
          return {
            id: `amenity-${a.id}`,
            backendId: a.id,
            type: "amenity",
            amenityType: (a.category || "restroom").toLowerCase(),
            x: loc.x || 100,
            y: loc.y || 100,
          };
        });
        setZones(zoneShapes);
        setLogicalShapes([...zoneShapes, ...amenityShapes]);
        pushHistorySingle(zoneShapes, accessPoints, [...zoneShapes, ...amenityShapes]);
        console.log('Loaded zones:', zoneShapes);
      } catch (e) {}
    }
    loadBackendShapes();
    return () => { mounted = false; };
  }, [venueId]);

  // --- UNDO/REDO ---
  function onUndo() {
    if (history.length === 0) return;
    const prev = history[0];
    setFuture(f => [
      { zones: JSON.parse(JSON.stringify(zones)), accessPoints: JSON.parse(JSON.stringify(accessPoints)), logicalShapes: JSON.parse(JSON.stringify(logicalShapes)) },
      ...f,
    ]);
    // Clear backendId for restored zones if they were deleted
    const restoredZones = prev.zones.map(z => {
      if (z.backendId && deletedZoneIds.includes(z.backendId)) {
        const { backendId, ...rest } = z;
        return { ...rest };
      }
      return { ...z };
    });
    setZones(restoredZones);
    setAccessPoints(prev.accessPoints.map(a => ({ ...a })));
    setLogicalShapes(prev.logicalShapes.map(l => ({ ...l })));
    setHistory(h => h.slice(1));
  }
  function onRedo() {
    if (future.length === 0) return;
    const next = future[0];
    setHistory(h => [
      { zones: JSON.parse(JSON.stringify(zones)), accessPoints: JSON.parse(JSON.stringify(accessPoints)), logicalShapes: JSON.parse(JSON.stringify(logicalShapes)) },
      ...h
    ]);
    setZones(next.zones.map(z => ({ ...z })));
    setAccessPoints(next.accessPoints.map(a => ({ ...a })));
    setLogicalShapes(next.logicalShapes.map(l => ({ ...l })));
    setFuture(f => f.slice(1));
  }

  const canUndo = history.length > 0;
  const canRedo = future.length > 0;

  // --- SAVE LOGIC ---
  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      // Zones
      const originalIds = new Set(originalZones.map(z => z.backendId).filter(Boolean));
      const currentIds = new Set(zones.map(z => z.backendId).filter(Boolean));
      // Create new zones
      for (const zone of zones) {
        if (!zone.backendId) {
          console.log('Zone before payload mapping:', zone);
          const payload = {
            name: zone.name,
            type: zone.type || 'GENERAL_ADMISSION',
            category: (zone as any).category || 'MAIN_ARENA',
            venue_id: venueId,
            capacity: typeof zone.capacity === 'number' && zone.capacity > 0 ? zone.capacity : 1,
            description: JSON.stringify({
              x: zone.x,
              y: zone.y,
              width: zone.width,
              height: zone.height,
              color: zone.color,
            }),
          };
          console.log('Creating new zone with payload:', payload);
          const created: any = await api.createVenueZone(venueId, payload);
          zone.backendId = created.id || (created.data && created.data.id);
        }
      }
      // Update changed zones
      for (const zone of zones) {
        if (zone.backendId && originalIds.has(zone.backendId)) {
          const orig = originalZones.find(z => z.backendId === zone.backendId);
          if (orig && (
            orig.name !== zone.name ||
            orig.type !== zone.type ||
            orig.capacity !== zone.capacity ||
            orig.x !== zone.x ||
            orig.y !== zone.y ||
            orig.width !== zone.width ||
            orig.height !== zone.height ||
            orig.color !== zone.color
          )) {
            await api.updateVenueZone(zone.backendId, {
              name: zone.name,
              type: zone.type,
              capacity: zone.capacity,
              description: JSON.stringify({
                x: zone.x,
                y: zone.y,
                width: zone.width,
                height: zone.height,
                color: zone.color,
              }),
            });
          }
        }
      }
      // Delete removed zones
      for (const orig of originalZones) {
        if (orig.backendId && !currentIds.has(orig.backendId)) {
          await api.deleteVenueZone(venueId, orig.backendId);
        }
      }
      // After save, update originals and clear history/future
      setOriginalZones(JSON.parse(JSON.stringify(zones)));
      setHistory([]);
      setFuture([]);
      setDeletedZoneIds([]);
      toast({ title: "Enregistré !", description: "Les modifications ont été sauvegardées.", variant: "default" });
    } catch (e) {
      setError("Erreur lors de l'enregistrement.");
      toast({ title: "Erreur", description: "Impossible d'enregistrer les modifications.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  function updateZones(updater: (zs: Zone[]) => Zone[]) {
    setZones(zs => {
      const newZones = updater(zs);
      pushHistorySingle(newZones, accessPoints, logicalShapes);
      return newZones;
    });
  }
  function updateAccessPoints(updater: (aps: AccessPoint[]) => AccessPoint[]) {
    setAccessPoints(aps => {
      const newAPs = updater(aps);
      pushHistorySingle(zones, newAPs, logicalShapes);
      return newAPs;
    });
  }
  function updateLogicalShapes(updater: (ls: LogicalShape[]) => LogicalShape[]) {
    setLogicalShapes(ls => {
      const newLS = updater(ls);
      pushHistorySingle(zones, accessPoints, newLS);
      return newLS;
    });
  }

  type ZoneUpdate = Partial<Zone> & { _delete?: boolean };

  async function updateZone(id: string, updates: ZoneUpdate) {
    if (!updates) return;
    if (updates._delete) {
      deleteZone(id);
      return;
    }
    editZone(id, updates);
  }
  async function updateAccessPoint(id: string, updates: Partial<AccessPoint>) {
    if ((updates as any)._delete) {
      deleteAccessPoint(id);
      return;
    }
    editAccessPoint(id, updates);
  }

  // Mouse move handler for access point preview
  function handleCanvasMouseMove(e: MouseEvent) {
    if (selectedTool === "accessPoint") {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = snapToGrid ? Math.round((e.clientX - rect.left) / GRID_SIZE) * GRID_SIZE : e.clientX - rect.left;
      const y = snapToGrid ? Math.round((e.clientY - rect.top) / GRID_SIZE) * GRID_SIZE : e.clientY - rect.top;
      setDrawAPPreview({ x: x - 16, y: y - 16 });
    }
  }
  // Mouse up handler to clear preview
  function handleCanvasMouseUp(e: MouseEvent) {
    if (selectedTool === "accessPoint") {
      setDrawAPPreview(null);
    }
  }

  function handleZoneMouseDown(zoneId: string, e: any) {
    if (selectedTool === "select") {
      e.stopPropagation();
      setSelectedZone(zoneId);
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const zone = zones.find(z => z.id === zoneId);
      if (!zone) return;
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      setDraggingZoneId(zoneId);
      setDragOffset({ x: mouseX - zone.x, y: mouseY - zone.y });
    }
  }

  // Prompt on tab close/navigation if there are unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      // Simple shallow compare for now
      const unsaved = JSON.stringify(zones) !== JSON.stringify(originalZones);
      if (unsaved) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [zones, originalZones]);

  // Reset all drag/draw state
  function resetEditorState() {
    setDraggingZoneId(null);
    setDragOffset(null);
    setDrawing(false);
    setDrawRect(null);
    setDrawCircle(null);
    setDrawPolygon(null);
    setResizing(null);
    setResizeStart(null);
  }

  // Wrap setSelectedZone to log all calls
  const setSelectedZoneWithLog = (id: string | null) => {
    console.log('setSelectedZone called with:', id);
    setSelectedZone(id);
  };
  // Wrap setZones to log all calls
  const setZonesWithLog = (updater: any) => {
    if (typeof updater === 'function') {
      setZones(zs => {
        const updated = updater(zs);
        console.log('setZones called, zones:', updated);
        return updated;
      });
    } else {
      console.log('setZones called, zones:', updater);
      setZones(updater);
    }
  };

  return {
    TOOLS,
    mappings,
    selectedMapping,
    setSelectedMapping,
    selectedTool,
    setSelectedTool,
    zones,
    setZones: setZonesWithLog,
    selectedZone,
    setSelectedZone: setSelectedZoneWithLog,
    accessPoints,
    setAccessPoints,
    selectedAccessPoint,
    setSelectedAccessPoint,
    snapToGrid,
    setSnapToGrid,
    drawing,
    setDrawing,
    drawStart,
    setDrawStart,
    drawRect,
    setDrawRect,
    draggingZoneId,
    setDraggingZoneId,
    dragOffset,
    setDragOffset,
    resizing,
    setResizing,
    resizeStart,
    setResizeStart,
    draggingAPId,
    setDraggingAPId,
    dragAPOffset,
    setDragAPOffset,
    history,
    setHistory,
    future,
    setFuture,
    loadingMappings,
    loadingMappingData,
    saving,
    setSaving,
    error,
    setError,
    logicalShapes,
    setLogicalShapes,
    selectedLogicalId,
    setSelectedLogicalId,
    drawingLogical,
    setDrawingLogical,
    drawLogicalPreview,
    setDrawLogicalPreview,
    savingShapeIds,
    setSavingShapeIds,
    drawAPPreview,
    setDrawAPPreview,
    drawCircle,
    setDrawCircle,
    drawPolygon,
    setDrawPolygon,
    canvasRef,
    handleSave,
    updateZones,
    updateAccessPoints,
    updateLogicalShapes,
    updateZone,
    updateAccessPoint,
    savingZoneIds,
    savingAPIds,
    savedZoneIds,
    savedAPIds,
    deletedZoneIds,
    setDeletedZoneIds,
    handleCanvasMouseMove,
    handleCanvasMouseUp,
    handleZoneMouseDown,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    originalZones,
    originalAccessPoints,
  };
} 