/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Eye,
  SlidersHorizontal,
  Download,
  Trash2,
  Flame,
} from 'lucide-react';

interface ToolbarProps {
  onOpenFile?: (files: FileList | File[]) => void;
  onAddStrokeLayer?: (files: FileList | File[]) => void;
  onSelectSample?: (sampleId: string) => void;
  hasArtwork?: boolean;
  onClearArtboard?: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitCanvas: () => void;
  splitView: boolean;
  onToggleSplitView: () => void;
  showOriginal: boolean;
  onToggleShowOriginal: () => void;
  flicker: boolean;
  onToggleFlicker: () => void;
  hyperGlow?: boolean;
  onToggleHyperGlow?: () => void;
  onOpenPresets: () => void;
  onOpenExport: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onOpenFile,
  onAddStrokeLayer,
  onSelectSample,
  hasArtwork = false,
  onClearArtboard,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  zoom,
  onZoomIn,
  onZoomOut,
  onFitCanvas,
  splitView,
  onToggleSplitView,
  showOriginal,
  onToggleShowOriginal,
  flicker,
  onToggleFlicker,
  hyperGlow = false,
  onToggleHyperGlow,
  onOpenPresets,
  onOpenExport,
}) => {
  return (
    <header className="h-14 bg-slate-950/95 border-b border-slate-800/80 px-3 sm:px-4 flex items-center justify-between gap-2 sm:gap-4 backdrop-blur-md z-30 select-none">

      {/* Zone 1: Wordmark & File Actions */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-black/60 border border-slate-700/80 p-0.5 flex items-center justify-center shadow-[0_0_12px_rgba(255,0,230,0.25)] overflow-hidden shrink-0">
            <img
              src="/logo.svg"
              alt="Neon Glow Effect"
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/icon.png';
              }}
            />
          </div>
          <span className="font-bold text-sm sm:text-base tracking-tight text-white whitespace-nowrap">
            Neon Glow Effect
          </span>
        </div>

        {/* Separator */}
        <div className="h-5 w-px bg-slate-800 hidden md:block" />

        {/* Clear Artboard Action */}
        <div className="flex items-center gap-1.5">
          {onClearArtboard && (
            <button
              onClick={onClearArtboard}
              disabled={!hasArtwork}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-rose-300 hover:text-white bg-rose-950/20 hover:bg-rose-900/40 border border-rose-900/40 hover:border-rose-700 disabled:opacity-30 disabled:hover:bg-rose-950/20 disabled:hover:text-rose-300 disabled:border-rose-900/30 disabled:cursor-not-allowed rounded-md transition-colors whitespace-nowrap shrink-0"
              title="Clear artwork and empty artboard"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Clear Artboard</span>
            </button>
          )}
        </div>
      </div>

      {/* Zone 2: Viewport & Effect Toggles */}
      <div className="hidden md:flex items-center gap-2">
        {/* Undo / Redo */}
        <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-md p-0.5">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors rounded"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors rounded"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-md p-0.5 text-xs">
          <button
            onClick={onZoomOut}
            className="p-1.5 text-slate-400 hover:text-white transition-colors rounded"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="px-2 font-mono text-[11px] text-slate-300 min-w-12 text-center tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={onZoomIn}
            className="p-1.5 text-slate-400 hover:text-white transition-colors rounded"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onFitCanvas}
            className="p-1.5 text-slate-400 hover:text-white transition-colors rounded border-l border-slate-800/80 ml-0.5"
            title="Fit to Canvas (0)"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* View Mode & Split Compare */}
        <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 rounded-md p-0.5">
          <button
            onClick={onToggleShowOriginal}
            className={`px-2 py-1 text-xs rounded transition-colors flex items-center gap-1.5 ${
              showOriginal ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Hold or toggle to inspect original line art"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Before/After</span>
          </button>

          <button
            onClick={onToggleSplitView}
            className={`px-2 py-1 text-xs rounded transition-colors flex items-center gap-1.5 ${
              splitView ? 'bg-pink-500/20 text-pink-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Interactive Split Screen comparison slider"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Split View</span>
          </button>
        </div>

        {/* Realism Toggles: Flicker & HyperGlow */}
        <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 rounded-md p-0.5">

          {onToggleHyperGlow && (
            <button
              onClick={onToggleHyperGlow}
              className={`px-2 py-1 text-xs rounded transition-colors flex items-center gap-1 ${
                hyperGlow ? 'bg-rose-500/20 text-rose-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle Multi-Pass Hyper Glow Engine"
            >
              <Flame className={`w-3.5 h-3.5 ${hyperGlow ? 'text-rose-400' : ''}`} />
              <span className="hidden xl:inline">HyperGlow</span>
            </button>
          )}
        </div>
      </div>

      {/* Zone 3: Primary Action */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onOpenExport}
          disabled={!hasArtwork}
          className="flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 text-xs font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-white disabled:opacity-40 disabled:hover:from-cyan-400 disabled:hover:to-cyan-300 disabled:cursor-not-allowed disabled:shadow-none rounded-lg shadow-[0_0_14px_rgba(6,182,212,0.35)] transition-all whitespace-nowrap shrink-0 active:scale-95 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Artwork</span>
        </button>
      </div>
    </header>
  );
};

