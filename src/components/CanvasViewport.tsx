import React, { useRef, useEffect, useState, useCallback } from 'react';
import { RefreshCw, SplitSquareVertical, FolderOpen, MousePointerClick } from 'lucide-react';
import { SvgPathLayer } from '../types/neon';
import { safePath2D, applySvgTransform } from '../engine/neonRenderer';

interface CanvasViewportProps {
  processedCanvas: HTMLCanvasElement | null;
  sourceCanvas: HTMLCanvasElement | null;
  maskCanvas: HTMLCanvasElement | null;
  renderVersion: number;
  previewMask: boolean;
  showOriginal: boolean;
  splitView: boolean;
  isTransparentBg: boolean;
  zoom: number;
  pan: { x: number; y: number };
  onPanChange: (pan: { x: number; y: number }) => void;
  onZoomChange: (zoom: number) => void;
  isRendering: boolean;
  onOpenFile?: (files: FileList | File[]) => void;
  svgLayers?: SvgPathLayer[];
  svgViewBox?: { x: number; y: number; width: number; height: number };
  selectedLayerIds?: string[];
  onSelectLayer?: (layerId: string, isMulti: boolean) => void;
  onDeselectAll?: () => void;
}

export const CanvasViewport: React.FC<CanvasViewportProps> = ({
  processedCanvas,
  sourceCanvas,
  maskCanvas,
  renderVersion,
  previewMask,
  showOriginal,
  splitView,
  isTransparentBg,
  zoom,
  pan,
  onPanChange,
  onZoomChange,
  isRendering,
  onOpenFile,
  svgLayers = [],
  svgViewBox,
  selectedLayerIds = [],
  onSelectLayer,
  onDeselectAll,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const hitCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mouseDownPosRef = useRef<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHoveringStroke, setIsHoveringStroke] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [splitPos, setSplitPos] = useState(0.5); // 0.0 to 1.0
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);

  // Redraw onto display canvas
  const drawDisplay = useCallback(() => {
    const canvas = displayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const base = processedCanvas || sourceCanvas;
    if (!base) {
      if (canvas.width !== 4000 || canvas.height !== 4000) {
        canvas.width = 4000;
        canvas.height = 4000;
      }
      ctx.clearRect(0, 0, 4000, 4000);
      ctx.fillStyle = '#07080c';
      ctx.fillRect(0, 0, 4000, 4000);
      // Subtle dashed border for empty artboard boundary
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 4;
      ctx.setLineDash([30, 30]);
      ctx.strokeRect(30, 30, 3940, 3940);
      ctx.setLineDash([]);
      return;
    }

    const w = base.width;
    const h = base.height;

    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    ctx.clearRect(0, 0, w, h);

    // If mask preview is active, render mask in bright high-contrast color
    if (previewMask && maskCanvas) {
      ctx.fillStyle = '#0a0d14';
      ctx.fillRect(0, 0, w, h);
      ctx.save();
      // Green/cyan mask preview tint
      ctx.fillStyle = '#00ff88';
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'destination-in';
      ctx.drawImage(maskCanvas, 0, 0, w, h);
      ctx.restore();
      return;
    }

    // If showing original only
    if (showOriginal && sourceCanvas) {
      ctx.drawImage(sourceCanvas, 0, 0, w, h);
      return;
    }

    // If split view comparison is enabled
    if (splitView && sourceCanvas && processedCanvas) {
      const splitX = Math.round(w * splitPos);

      // Left side: original source
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, splitX, h);
      ctx.clip();
      ctx.drawImage(sourceCanvas, 0, 0, w, h);
      ctx.restore();

      // Right side: processed neon
      ctx.save();
      ctx.beginPath();
      ctx.rect(splitX, 0, w - splitX, h);
      ctx.clip();
      ctx.drawImage(processedCanvas, 0, 0, w, h);
      ctx.restore();

      // Divider line
      ctx.strokeStyle = '#00f3ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(splitX, 0);
      ctx.lineTo(splitX, h);
      ctx.stroke();
      return;
    }

    // Default: draw processed neon canvas
    if (processedCanvas) {
      ctx.drawImage(processedCanvas, 0, 0, w, h);
    } else if (sourceCanvas) {
      ctx.drawImage(sourceCanvas, 0, 0, w, h);
    }

    // Draw high-visibility vector selection contours directly on selected neon lines
    if (
      !showOriginal &&
      !previewMask &&
      svgLayers &&
      svgLayers.length > 0 &&
      selectedLayerIds &&
      selectedLayerIds.length > 0
    ) {
      const vbW = Math.max(1, svgViewBox?.width || w || 800);
      const vbH = Math.max(1, svgViewBox?.height || h || 800);
      const scaleX = w / vbW;
      const scaleY = h / vbH;
      const scale = Math.min(scaleX, scaleY);

      const offsetX = (w - vbW * scale) / 2 - (svgViewBox?.x || 0) * scale;
      const offsetY = (h - vbH * scale) / 2 - (svgViewBox?.y || 0) * scale;

      const selectedSet = new Set(selectedLayerIds);

      ctx.save();
      ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);

      for (const layer of svgLayers) {
        if (!layer.visible || !selectedSet.has(layer.id)) continue;
        const path = safePath2D(layer.d);
        if (!path) continue;

        ctx.save();
        if (layer.transform) {
          applySvgTransform(ctx, layer.transform);
        }

        const baseThickness = (layer.thickness || 3) * (w / 500);

        // 1. Dark outer border for contrast against bright neon background
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.lineWidth = (baseThickness + 14) / scale;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.setLineDash([]);
        ctx.stroke(path);

        // 2. High-intensity cyan neon highlight outline
        ctx.strokeStyle = '#00f3ff';
        ctx.lineWidth = (baseThickness + 6) / scale;
        ctx.stroke(path);

        // 3. Bright white dashed center core
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = Math.max(2, baseThickness * 0.45) / scale;
        ctx.setLineDash([14 / scale, 8 / scale]);
        ctx.stroke(path);

        ctx.restore();
      }

      ctx.restore();
    }
  }, [
    processedCanvas,
    sourceCanvas,
    maskCanvas,
    renderVersion,
    previewMask,
    showOriginal,
    splitView,
    splitPos,
    svgLayers,
    svgViewBox,
    selectedLayerIds,
  ]);

  useEffect(() => {
    drawDisplay();
  }, [drawDisplay]);

  // Hit-test vector paths to find which line the user clicked or hovered over
  const findHitLayer = useCallback(
    (clientX: number, clientY: number): SvgPathLayer | null => {
      if (!svgLayers || svgLayers.length === 0 || !displayCanvasRef.current) return null;
      const canvas = displayCanvasRef.current;
      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return null;

      if (
        clientX < rect.left ||
        clientX > rect.right ||
        clientY < rect.top ||
        clientY > rect.bottom
      ) {
        return null;
      }

      const canvasX = ((clientX - rect.left) / rect.width) * canvas.width;
      const canvasY = ((clientY - rect.top) / rect.height) * canvas.height;

      if (!hitCanvasRef.current) {
        hitCanvasRef.current = document.createElement('canvas');
      }
      const hitCanvas = hitCanvasRef.current;
      if (hitCanvas.width !== 100 || hitCanvas.height !== 100) {
        hitCanvas.width = 100;
        hitCanvas.height = 100;
      }
      const ctx = hitCanvas.getContext('2d');
      if (!ctx) return null;

      const w = canvas.width;
      const h = canvas.height;
      const vbW = Math.max(1, svgViewBox?.width || w || 800);
      const vbH = Math.max(1, svgViewBox?.height || h || 800);
      const scaleX = w / vbW;
      const scaleY = h / vbH;
      const scale = Math.min(scaleX, scaleY);

      const offsetX = (w - vbW * scale) / 2 - (svgViewBox?.x || 0) * scale;
      const offsetY = (h - vbH * scale) / 2 - (svgViewBox?.y || 0) * scale;

      // Generous 18 screen-pixel tolerance for effortless mouse selection
      const screenTolerance = 18;
      const hitTolerance = Math.max(20, (screenTolerance * w) / rect.width);

      // Iterate top-to-bottom so topmost visible layer is hit first
      for (let i = svgLayers.length - 1; i >= 0; i--) {
        const layer = svgLayers[i];
        if (!layer.visible || !layer.d) continue;

        const path = safePath2D(layer.d);
        if (!path) continue;

        ctx.save();
        ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);
        if (layer.transform) {
          applySvgTransform(ctx, layer.transform);
        }

        const baseThickness = (layer.thickness || 3) * (w / 500);
        const strokeWidth = Math.max(baseThickness, hitTolerance);
        ctx.lineWidth = strokeWidth / scale;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const isHit =
          ctx.isPointInStroke(path, canvasX, canvasY) ||
          ctx.isPointInPath(path, canvasX, canvasY);

        ctx.restore();

        if (isHit) {
          return layer;
        }
      }

      return null;
    },
    [svgLayers, svgViewBox]
  );

  // Handle Pan & Selection Mouse Events
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 || e.button === 1) {
      setIsDragging(true);
      mouseDownPosRef.current = { x: e.clientX, y: e.clientY };
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingSplit && displayCanvasRef.current) {
      const rect = displayCanvasRef.current.getBoundingClientRect();
      const relativeX = (e.clientX - rect.left) / rect.width;
      setSplitPos(Math.max(0.05, Math.min(0.95, relativeX)));
      return;
    }

    if (isDragging) {
      onPanChange({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
      return;
    }

    // Check hover to change cursor to pointer when over a selectable line
    if (svgLayers && svgLayers.length > 0) {
      const hit = findHitLayer(e.clientX, e.clientY);
      setIsHoveringStroke(Boolean(hit));
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isDragging && mouseDownPosRef.current) {
      const dist = Math.hypot(
        e.clientX - mouseDownPosRef.current.x,
        e.clientY - mouseDownPosRef.current.y
      );
      // If mouse moved less than 5 pixels, it's a deliberate click on the artwork!
      if (dist < 5) {
        const hitLayer = findHitLayer(e.clientX, e.clientY);
        if (hitLayer) {
          const isMulti = e.shiftKey || e.ctrlKey || e.metaKey;
          onSelectLayer?.(hitLayer.id, isMulti);
        } else {
          // Clicked on empty canvas area
          if (!e.shiftKey && !e.ctrlKey && !e.metaKey) {
            onDeselectAll?.();
          }
        }
      }
    }
    setIsDragging(false);
    setIsDraggingSplit(false);
    mouseDownPosRef.current = null;
  };

  // Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.max(0.1, Math.min(5, zoom * zoomFactor));
    onZoomChange(newZoom);
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      className={`relative flex-1 h-full overflow-hidden flex items-center justify-center select-none ${
        isTransparentBg ? 'canvas-checkerboard' : 'bg-[#07080c]'
      } ${
        isDragging
          ? 'cursor-grabbing'
          : isHoveringStroke
          ? 'cursor-pointer'
          : 'cursor-grab'
      }`}
    >
      {/* Canvas Wrapper with transform matrix */}
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          transition: isDragging ? 'none' : 'transform 0.05s ease-out',
        }}
        className="relative shadow-2xl rounded-sm"
      >
        <canvas
          ref={displayCanvasRef}
          className="max-w-none block"
          style={{ imageRendering: zoom > 1.5 ? 'pixelated' : 'auto' }}
        />

        {/* Split View Interactive Handle overlay */}
        {splitView && displayCanvasRef.current && (
          <div
            style={{ left: `${splitPos * 100}%` }}
            onMouseDown={(e) => {
              e.stopPropagation();
              setIsDraggingSplit(true);
            }}
            className="absolute top-0 bottom-0 -ml-3 w-6 flex items-center justify-center cursor-ew-resize z-20 group"
          >
            <div className="w-6 h-6 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center shadow-lg transform active:scale-95 transition-transform">
              <SplitSquareVertical className="w-3.5 h-3.5" />
            </div>
          </div>
        )}
      </div>

      {/* Active Line Selection Badge */}
      {selectedLayerIds.length > 0 && (
        <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-slate-900/90 border border-cyan-500/50 text-xs text-cyan-300 rounded-lg shadow-xl backdrop-blur-md z-30">
          <MousePointerClick className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>
            {selectedLayerIds.length === 1
              ? '১টি লাইন সিলেক্ট করা আছে'
              : `${selectedLayerIds.length}টি লাইন সিলেক্ট করা আছে`}
          </span>
          <button
            type="button"
            onClick={() => onDeselectAll?.()}
            className="ml-1 text-[10px] text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      {/* Before / After Badges when active */}
      {showOriginal && (
        <div className="absolute top-4 left-4 px-3 py-1 bg-amber-500/90 text-slate-950 text-xs font-bold rounded shadow-md pointer-events-none backdrop-blur-sm">
          ORIGINAL LINE ART
        </div>
      )}

      {splitView && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-4 px-3 py-1 bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 rounded-full pointer-events-none backdrop-blur-sm font-medium">
          <span className="text-amber-400">← Original Line Art</span>
          <span className="text-slate-500">|</span>
          <span className="text-cyan-400">Realistic Neon →</span>
        </div>
      )}

      {/* Rendering indicator */}
      {isRendering && (
        <div className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-slate-900/90 border border-slate-800 text-xs text-cyan-400 rounded-md shadow-lg pointer-events-none backdrop-blur-sm">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>Rendering Neon Engine...</span>
        </div>
      )}

      {/* Empty Artboard Overlay with Click-to-Upload */}
      {!processedCanvas && !sourceCanvas && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 z-10 pointer-events-none">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".eps,.svg,.png,.jpg,.jpeg,.webp,application/postscript,image/svg+xml,image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                onOpenFile?.(e.target.files);
                e.target.value = '';
              }
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="pointer-events-auto flex flex-col items-center justify-center p-8 bg-slate-900/85 hover:bg-slate-900/95 border-2 border-dashed border-slate-700 hover:border-cyan-400 rounded-2xl shadow-2xl backdrop-blur-md transition-all group cursor-pointer max-w-sm w-full select-none"
            title="ছবি আপলোড করতে ক্লিক করুন (Click to Upload Artwork)"
          >
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 group-hover:bg-cyan-500/20 border border-cyan-500/30 group-hover:border-cyan-400 flex items-center justify-center text-cyan-400 mb-3 shadow-[0_0_15px_rgba(6,182,212,0.2)] group-hover:shadow-[0_0_24px_rgba(6,182,212,0.4)] transition-all transform group-hover:scale-105">
              <FolderOpen className="w-8 h-8 text-cyan-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-100 group-hover:text-cyan-300 mb-1 transition-colors">
              ছবি আপলোড করতে ক্লিক করুন
            </h3>
            <span className="text-[11px] text-cyan-400/80 font-medium mb-1.5">
              Click to Upload Artwork
            </span>
            <p className="text-xs text-slate-400 group-hover:text-slate-300 leading-relaxed text-center">
              EPS, SVG, PNG, JPG বা WebP ফাইল নির্বাচন করুন অথবা এখানে ড্র্যাগ করে ড্রপ করুন
            </p>
          </button>
        </div>
      )}
    </div>
  );
};
