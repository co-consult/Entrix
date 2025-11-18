// Types for Mapping Editor

export type Zone = {
  id: string;
  name: string;
  type: string;
  shape?: "RECTANGLE" | "CIRCLE" | "POLYGON";
  capacity: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  points?: { x: number; y: number }[];
  color?: string;
  description?: string;
  backendId?: string;
};

export type AccessPoint = {
  id: string;
  name?: string;
  type: string;
  x: number;
  y: number;
  zoneId?: string;
  backendId?: string;
  description?: string;
};

export type LogicalShape = {
  id: string;
  type: string; // 'section' | 'aisle' | 'amenity' | 'text'
  x: number;
  y: number;
  width?: number;
  height?: number;
  name?: string;
  description?: string;
  color?: string;
  amenityType?: string;
  backendId?: string;
};

export type Mapping = {
  id: string;
  name: string;
  data: {
    zones: Zone[];
    accessPoints: AccessPoint[];
    logicalShapes?: LogicalShape[];
  };
};

export type EditorState = {
  zones: Zone[];
  accessPoints: AccessPoint[];
  logicalShapes: LogicalShape[];
  selectedZone: string | null;
  selectedAccessPoint: string | null;
  selectedLogicalId: string | null;
  selectedTool: string;
  snapToGrid: boolean;
  drawing: boolean;
  drawRect: { x: number; y: number; width: number; height: number } | null;
  drawAPPreview: { x: number; y: number } | null;
  draggingZoneId: string | null;
  draggingAPId: string | null;
  dragOffset: { x: number; y: number } | null;
  dragAPOffset: { x: number; y: number } | null;
  resizing: null | { zoneId: string; handle: string };
  resizeStart: { x: number; y: number; zone: Zone } | null;
  history: any[];
  future: any[];
  saving: boolean;
  error: string | null;
}; 