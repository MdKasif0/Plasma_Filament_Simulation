import React from 'react';
import {
  Activity,
  Camera,
  Layers,
  Pause,
  Play,
  RotateCcw,
  Settings,
  SkipForward,
  Sparkles,
} from 'lucide-react';

interface HeaderNavProps {
  currentPresetName: string;
  isPaused: boolean;
  onTogglePause: () => void;
  onStepSimulation: () => void;
  onReset: () => void;
  onOpenPresets: () => void;
  onToggleControls: () => void;
  onToggleOverlays: () => void;
  onTakeScreenshot: () => void;
  showControlsDrawer: boolean;
  showOverlaysMenu: boolean;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  currentPresetName,
  isPaused,
  onTogglePause,
  onStepSimulation,
  onReset,
  onOpenPresets,
  onToggleControls,
  onToggleOverlays,
  onTakeScreenshot,
  showControlsDrawer,
  showOverlaysMenu,
}) => {
  return (
    <header className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between px-6 py-3 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl">
      {/* Title & Brand */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-fuchsia-600 text-white shadow-lg shadow-cyan-500/20">
          <Activity className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h1 className="text-base font-bold text-white tracking-wider flex items-center gap-2">
            PLASMA FILAMENT LAB
            <span className="px-2 py-0.5 text-[10px] uppercase tracking-widest font-mono bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 rounded-full">
              PIC Model
            </span>
          </h1>
          <p className="text-xs text-gray-400 font-mono">
            Preset: <span className="text-cyan-400 font-semibold">{currentPresetName}</span>
          </p>
        </div>
      </div>

      {/* Center Controls */}
      <div className="flex items-center space-x-2 bg-white/5 border border-white/10 p-1.5 rounded-xl backdrop-blur-md">
        <button
          onClick={onOpenPresets}
          className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-gray-200 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition"
        >
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>Presets</span>
        </button>

        <div className="h-4 w-[1px] bg-white/10 mx-1" />

        <button
          onClick={onTogglePause}
          className={`p-2 rounded-lg text-white transition ${
            isPaused
              ? 'bg-emerald-500/30 border border-emerald-500/40 text-emerald-300'
              : 'bg-white/10 hover:bg-white/20'
          }`}
          title={isPaused ? 'Resume Simulation' : 'Pause Simulation'}
        >
          {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
        </button>

        {isPaused && (
          <button
            onClick={onStepSimulation}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-gray-200 hover:text-white transition"
            title="Step Single Frame"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={onReset}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-gray-200 hover:text-white transition"
          title="Reset Plasma Simulation"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Right Action Tools */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onToggleOverlays}
          className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition ${
            showOverlaysMenu
              ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
              : 'bg-white/5 border-white/10 text-gray-300 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Overlays</span>
        </button>

        <button
          onClick={onToggleControls}
          className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition ${
            showControlsDrawer
              ? 'bg-fuchsia-500/20 border-fuchsia-500/50 text-fuchsia-300'
              : 'bg-white/5 border-white/10 text-gray-300 hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Parameters</span>
        </button>

        <button
          onClick={onTakeScreenshot}
          className="p-2 text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition"
          title="Capture Snapshot"
        >
          <Camera className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
