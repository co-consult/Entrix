"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Stage, Layer, Rect, Image, Transformer, Group, Text, Circle } from "react-konva";
import Konva from "konva";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Upload, 
  Square, 
  Circle as CircleIcon, 
  Move, 
  Trash2, 
  Save, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Download,
  Layers,
  Palette,
  Type,
  Hash,
  Users,
  DollarSign,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";

export interface ZoneShape {
  id: string;
  type: "rect" | "circle";
  x: number;
  y: number;
  width: number;
  height: number;
  radius?: number;
  name: string;
  code: string;
  zone_type: string;
  category: string;
  capacity: number;
  base_price: number;
  currency: string;
  color: string;
  opacity: number;
  is_active: boolean;
  metadata?: any;
}

interface VisualMappingDesignerProps {
  mappingId: string;
  mappingName: string;
  onSave: (zones: ZoneShape[]) => Promise<void>;
  existingZones?: ZoneShape[];
  floorPlanImage?: string;
}

const ZONE_COLORS = [
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#F97316", // Orange
];

const ZONE_TYPES = [
  { value: "SEATING_AREA", label: "Zone Assise" },
  { value: "STANDING_AREA", label: "Zone Debout" },
  { value: "VIP_AREA", label: "Zone VIP" },
  { value: "SERVICE_AREA", label: "Zone Service" },
  { value: "STAFF_AREA", label: "Zone Personnel" },
];

const ZONE_CATEGORIES = [
  { value: "STANDARD", label: "Standard" },
  { value: "PREMIUM", label: "Premium" },
  { value: "BASIC", label: "Basic" },
  { value: "VIP", label: "VIP" },
  { value: "ACCESSIBLE", label: "Accessible" },
];

export default function VisualMappingDesigner({
  mappingId,
  mappingName,
  onSave,
  existingZones = [],
  floorPlanImage: initialFloorPlan,
}: VisualMappingDesignerProps) {
  const [zones, setZones] = useState<ZoneShape[]>(existingZones);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [stageScale, setStageScale] = useState(1);
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  const [floorPlanImage, setFloorPlanImage] = useState<string | null>(initialFloorPlan || null);
  const [imageSize, setImageSize] = useState({ width: 1200, height: 800 });
  const [tool, setTool] = useState<"select" | "rect" | "circle">("select");
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  
  const [selectedZone, setSelectedZone] = useState<ZoneShape | null>(null);
  const [zoneForm, setZoneForm] = useState({
    name: "",
    code: "",
    zone_type: "SEATING_AREA",
    category: "STANDARD",
    capacity: 0,
    base_price: 0,
    currency: "TND",
    color: ZONE_COLORS[0],
    opacity: 0.5,
    is_active: true,
  });

  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const { toast } = useToast();

  // Load image when floorPlanImage changes
  useEffect(() => {
    if (floorPlanImage) {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        setImage(img);
        setImageSize({ width: img.width, height: img.height });
      };
      img.src = floorPlanImage;
    }
  }, [floorPlanImage]);

  // Load existing zones
  useEffect(() => {
    if (existingZones.length > 0) {
      setZones(existingZones);
    }
  }, [existingZones]);

  // Update transformer when selection changes
  useEffect(() => {
    if (transformerRef.current && selectedZoneId) {
      const node = stageRef.current?.findOne(`#${selectedZoneId}`);
      if (node) {
        transformerRef.current.nodes([node]);
        transformerRef.current.getLayer()?.batchDraw();
      }
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selectedZoneId]);

  // Handle floor plan image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new window.Image();
        img.onload = () => {
          setImageSize({ width: img.width, height: img.height });
          setFloorPlanImage(event.target?.result as string);
          // Reset stage position and scale
          setStageScale(1);
          setStagePosition({ x: 0, y: 0 });
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle stage click (deselect or start drawing)
  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      setSelectedZoneId(null);
      setSelectedZone(null);
      
      if (tool !== "select" && !isDrawing) {
        const stage = e.target.getStage();
        const point = stage?.getPointerPosition();
        if (point) {
          setIsDrawing(true);
          setDrawStart(point);
        }
      }
    }
  };

  // Handle stage mouse move (drawing)
  const handleStageMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (isDrawing && tool !== "select") {
      const stage = e.target.getStage();
      const point = stage?.getPointerPosition();
      if (point) {
        const width = Math.abs(point.x - drawStart.x);
        const height = Math.abs(point.y - drawStart.y);
        
        // Update temporary zone while drawing
        const tempZone: ZoneShape = {
          id: "temp",
          type: tool === "rect" ? "rect" : "circle",
          x: Math.min(drawStart.x, point.x),
          y: Math.min(drawStart.y, point.y),
          width,
          height,
          radius: tool === "circle" ? Math.min(width, height) / 2 : undefined,
          name: "",
          code: "",
          zone_type: "SEATING_AREA",
          category: "STANDARD",
          capacity: 0,
          base_price: 0,
          currency: "TND",
          color: zoneForm.color,
          opacity: zoneForm.opacity,
          is_active: true,
        };
        
        // Remove temp zone and add new one
        setZones(prev => {
          const filtered = prev.filter(z => z.id !== "temp");
          return [...filtered, tempZone];
        });
      }
    }
  };

  // Handle stage mouse up (finish drawing)
  const handleStageMouseUp = () => {
    if (isDrawing) {
      setIsDrawing(false);
      const tempZone = zones.find(z => z.id === "temp");
      if (tempZone) {
        // Generate unique ID and open form
        const newZone: ZoneShape = {
          ...tempZone,
          id: `zone-${Date.now()}`,
          name: `Zone ${zones.length + 1}`,
          code: `Z${zones.length + 1}`,
        };
        setZones(prev => prev.filter(z => z.id !== "temp").concat(newZone));
        setSelectedZoneId(newZone.id);
        setSelectedZone(newZone);
        setZoneForm({
          name: newZone.name,
          code: newZone.code,
          zone_type: newZone.zone_type,
          category: newZone.category,
          capacity: newZone.capacity,
          base_price: newZone.base_price,
          currency: newZone.currency,
          color: newZone.color,
          opacity: newZone.opacity,
          is_active: newZone.is_active,
        });
        setTool("select");
      }
    }
  };

  // Handle zone click
  const handleZoneClick = (e: Konva.KonvaEventObject<MouseEvent>, zoneId: string) => {
    e.cancelBubble = true;
    setSelectedZoneId(zoneId);
    const zone = zones.find(z => z.id === zoneId);
    if (zone) {
      setSelectedZone(zone);
      setZoneForm({
        name: zone.name,
        code: zone.code,
        zone_type: zone.zone_type,
        category: zone.category,
        capacity: zone.capacity,
        base_price: zone.base_price,
        currency: zone.currency,
        color: zone.color,
        opacity: zone.opacity,
        is_active: zone.is_active,
      });
    }
    setTool("select");
  };

  // Handle zone drag end
  const handleZoneDragEnd = (e: Konva.KonvaEventObject<DragEvent>, zoneId: string) => {
    const node = e.target;
    setZones(prev =>
      prev.map(zone =>
        zone.id === zoneId
          ? {
              ...zone,
              x: node.x(),
              y: node.y(),
            }
          : zone
      )
    );
  };

  // Handle zone transform end
  const handleZoneTransformEnd = (e: Konva.KonvaEventObject<Event>, zoneId: string) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    
    node.scaleX(1);
    node.scaleY(1);
    
    setZones(prev =>
      prev.map(zone =>
        zone.id === zoneId
          ? {
              ...zone,
              x: node.x(),
              y: node.y(),
              width: Math.max(5, zone.width * scaleX),
              height: Math.max(5, zone.height * scaleY),
              radius: zone.type === "circle" ? Math.max(5, (zone.radius || zone.width / 2) * Math.min(scaleX, scaleY)) : zone.radius,
            }
          : zone
      )
    );
  };

  // Update zone properties
  const handleUpdateZone = () => {
    if (!selectedZoneId) return;
    
    setZones(prev =>
      prev.map(zone =>
        zone.id === selectedZoneId
          ? {
              ...zone,
              ...zoneForm,
            }
          : zone
      )
    );
    
    setSelectedZone(prev => prev ? { ...prev, ...zoneForm } : null);
    
    toast({
      title: "Zone mise à jour",
      description: "Les propriétés de la zone ont été mises à jour",
    });
  };

  // Delete zone
  const handleDeleteZone = () => {
    if (!selectedZoneId) return;
    
    setZones(prev => prev.filter(z => z.id !== selectedZoneId));
    setSelectedZoneId(null);
    setSelectedZone(null);
    
    toast({
      title: "Zone supprimée",
      description: "La zone a été supprimée",
    });
  };

  // Save all zones
  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(zones);
      toast({
        title: "Sauvegarde réussie",
        description: "Les zones ont été sauvegardées avec succès",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la sauvegarde",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Zoom controls
  const handleZoom = (direction: "in" | "out") => {
    const scaleBy = 1.2;
    const stage = stageRef.current;
    if (!stage) return;
    
    const oldScale = stageScale;
    const newScale = direction === "in" ? oldScale * scaleBy : oldScale / scaleBy;
    setStageScale(Math.max(0.1, Math.min(5, newScale)));
  };

  const handleResetView = () => {
    setStageScale(1);
    setStagePosition({ x: 0, y: 0 });
  };

  const selectedZoneData = zones.find(z => z.id === selectedZoneId);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Toolbar */}
      <div className="bg-white border-b p-4 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-lg">{mappingName}</h3>
          <Badge variant="outline">{zones.length} zones</Badge>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Image Upload */}
          <label>
            <Button type="button" variant="outline" size="sm" asChild>
              <span className="cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                Plan
              </span>
            </Button>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
          
          {/* Tools */}
          <Separator orientation="vertical" className="h-6" />
          <Button
            type="button"
            variant={tool === "select" ? "default" : "outline"}
            size="sm"
            onClick={() => setTool("select")}
          >
            <Move className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant={tool === "rect" ? "default" : "outline"}
            size="sm"
            onClick={() => setTool("rect")}
          >
            <Square className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant={tool === "circle" ? "default" : "outline"}
            size="sm"
            onClick={() => setTool("circle")}
          >
            <CircleIcon className="h-4 w-4" />
          </Button>
          
          {/* Zoom Controls */}
          <Separator orientation="vertical" className="h-6" />
          <Button type="button" variant="outline" size="sm" onClick={() => handleZoom("out")}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => handleZoom("in")}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={handleResetView}>
            <RotateCcw className="h-4 w-4" />
          </Button>
          
          {/* Save */}
          <Separator orientation="vertical" className="h-6" />
          <Button type="button" onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Sauvegarde..." : "Sauvegarder"}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Canvas Area */}
        <div className="flex-1 overflow-auto bg-gray-100 p-4">
          <div className="inline-block bg-white shadow-lg rounded-lg p-2">
            <Stage
              ref={stageRef}
              width={Math.max(1200, imageSize.width)}
              height={Math.max(800, imageSize.height)}
              scaleX={stageScale}
              scaleY={stageScale}
              x={stagePosition.x}
              y={stagePosition.y}
              onClick={handleStageClick}
              onMouseMove={handleStageMouseMove}
              onMouseUp={handleStageMouseUp}
              draggable={tool === "select"}
              onDragEnd={(e) => {
                setStagePosition({ x: e.target.x(), y: e.target.y() });
              }}
            >
              <Layer>
                {/* Floor Plan Image */}
                {image && (
                  <Image
                    image={image}
                    width={imageSize.width}
                    height={imageSize.height}
                  />
                )}
                
                {/* Zones */}
                {zones.map((zone) => {
                  const isSelected = zone.id === selectedZoneId;
                  
                  if (zone.type === "circle") {
                    return (
                      <Group
                        key={zone.id}
                        id={zone.id}
                        x={zone.x}
                        y={zone.y}
                        draggable={tool === "select"}
                        onClick={(e) => handleZoneClick(e, zone.id)}
                        onDragEnd={(e) => handleZoneDragEnd(e, zone.id)}
                        onTransformEnd={(e) => handleZoneTransformEnd(e, zone.id)}
                      >
                        <Circle
                          radius={zone.radius || zone.width / 2}
                          fill={zone.color}
                          opacity={zone.opacity}
                          stroke={isSelected ? "#000" : "#666"}
                          strokeWidth={isSelected ? 3 : 1}
                          dash={isSelected ? [5, 5] : []}
                        />
                        <Text
                          text={zone.name}
                          fontSize={14}
                          fill="#000"
                          fontStyle="bold"
                          x={-30}
                          y={-20}
                        />
                      </Group>
                    );
                  }
                  
                  return (
                    <Group
                      key={zone.id}
                      id={zone.id}
                      x={zone.x}
                      y={zone.y}
                      draggable={tool === "select"}
                      onClick={(e) => handleZoneClick(e, zone.id)}
                      onDragEnd={(e) => handleZoneDragEnd(e, zone.id)}
                      onTransformEnd={(e) => handleZoneTransformEnd(e, zone.id)}
                    >
                      <Rect
                        width={zone.width}
                        height={zone.height}
                        fill={zone.color}
                        opacity={zone.opacity}
                        stroke={isSelected ? "#000" : "#666"}
                        strokeWidth={isSelected ? 3 : 1}
                        dash={isSelected ? [5, 5] : []}
                      />
                      <Text
                        text={zone.name}
                        fontSize={14}
                        fill="#000"
                        fontStyle="bold"
                        x={5}
                        y={5}
                      />
                    </Group>
                  );
                })}
                
                {/* Transformer */}
                <Transformer
                  ref={transformerRef}
                  boundBoxFunc={(oldBox, newBox) => {
                    if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) {
                      return oldBox;
                    }
                    return newBox;
                  }}
                />
              </Layer>
            </Stage>
          </div>
        </div>

      {/* Properties Panel */}
      <div className="w-80 bg-white border-l overflow-y-auto">
          <div className="p-4 space-y-4">
            <div>
              <h4 className="font-semibold mb-4">Propriétés de la Zone</h4>
              {selectedZoneData ? (
                <Tabs defaultValue="general" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="general">Général</TabsTrigger>
                    <TabsTrigger value="appearance">Apparence</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="general" className="space-y-4 mt-4">
                    <div>
                      <Label htmlFor="zone-name">Nom *</Label>
                      <Input
                        id="zone-name"
                        value={zoneForm.name}
                        onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="zone-code">Code *</Label>
                      <Input
                        id="zone-code"
                        value={zoneForm.code}
                        onChange={(e) => setZoneForm({ ...zoneForm, code: e.target.value.toUpperCase() })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="zone-type">Type *</Label>
                      <Select
                        value={zoneForm.zone_type}
                        onValueChange={(v) => setZoneForm({ ...zoneForm, zone_type: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ZONE_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="zone-category">Catégorie *</Label>
                      <Select
                        value={zoneForm.category}
                        onValueChange={(v) => setZoneForm({ ...zoneForm, category: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ZONE_CATEGORIES.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="zone-capacity">Capacité *</Label>
                      <Input
                        id="zone-capacity"
                        type="number"
                        min="0"
                        value={zoneForm.capacity}
                        onChange={(e) => setZoneForm({ ...zoneForm, capacity: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="zone-price">Prix</Label>
                        <Input
                          id="zone-price"
                          type="number"
                          min="0"
                          step="0.01"
                          value={zoneForm.base_price}
                          onChange={(e) => setZoneForm({ ...zoneForm, base_price: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="zone-currency">Devise</Label>
                        <Input
                          id="zone-currency"
                          value={zoneForm.currency}
                          onChange={(e) => setZoneForm({ ...zoneForm, currency: e.target.value.toUpperCase().slice(0, 3) })}
                          maxLength={3}
                        />
                      </div>
                    </div>
                    <Button onClick={handleUpdateZone} className="w-full">
                      Mettre à jour
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteZone}
                      className="w-full"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </Button>
                  </TabsContent>
                  
                  <TabsContent value="appearance" className="space-y-4 mt-4">
                    <div>
                      <Label>Couleur</Label>
                      <div className="grid grid-cols-4 gap-2 mt-2">
                        {ZONE_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            className={`w-10 h-10 rounded border-2 ${
                              zoneForm.color === color ? "border-gray-900" : "border-gray-300"
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => setZoneForm({ ...zoneForm, color })}
                          />
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label>Opacité: {Math.round(zoneForm.opacity * 100)}%</Label>
                      <Slider
                        value={[zoneForm.opacity]}
                        min={0.1}
                        max={1}
                        step={0.1}
                        onValueChange={([value]) => setZoneForm({ ...zoneForm, opacity: value })}
                        className="mt-2"
                      />
                    </div>
                    <Button onClick={handleUpdateZone} className="w-full">
                      Mettre à jour
                    </Button>
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <Layers className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Sélectionnez une zone pour modifier ses propriétés</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

