import React from 'react';
import type { InteractionTool } from '../types/plasma';
import {
  Bomb,
  Eraser,
  Flame,
  Magnet,
  MinusCircle,
  MousePointer,
  PlusCircle,
  ShieldAlert,
} from 'lucide-react';

interface InteractiveToolboxProps {
  activeTool: InteractionTool;
  onSelectTool: (tool: InteractionTool) => void;
}

export const InteractiveToolbox: React.FC<InteractiveToolboxProps> = ({
  activeTool,
  onSelectTool,
}) => {
  const tools: { id: InteractionTool; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'select', label: 'Camera Orbit', icon: <MousePointer className="w-4 h-4" />, color: 'text-gray-300' },
    { id: 'inject_charge', label: 'Inject Plasma', icon: <Flame className="w-4 h-4" />, color: 'text-cyan-400' },
    { id: 'anode', label: 'Anode (+)', icon: <PlusCircle className="w-4 h-4" />, color: 'text-rose-400' },
    { id: 'cathode', label: 'Cathode (-)', icon: <MinusCircle className="w-4 h-4" />, color: 'text-cyan-300' },
    { id: 'magnet', label: 'Add Magnet', icon: <Magnet className="w-4 h-4" />, color: 'text-fuchsia-400' },
    { id: 'obstacle', label: 'Dielectric Obstacle', icon: <ShieldAlert className="w-4 h-4" />, color: 'text-amber-400' },
    { id: 'explosion', label: 'Energy Burst', icon: <Bomb className="w-4 h-4" />, color: 'text-orange-400' },
    { id: 'vacuum', label: 'Eraser Vacuum', icon: <Eraser className="w-4 h-4" />, color: 'text-purple-400' },
  ];

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-1 p-2 rounded-2xl bg-black/50 backdrop-blur-xl border border-white/10 shadow-2xl">
      {tools.map((t) => {
        const isActive = activeTool === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onSelectTool(t.id)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-medium transition ${
              isActive
                ? 'bg-white/20 border border-white/30 text-white shadow-lg shadow-cyan-500/10'
                : 'hover:bg-white/10 text-gray-400 hover:text-gray-200 border border-transparent'
            }`}
            title={t.label}
          >
            <span className={t.color}>{t.icon}</span>
            <span className="hidden md:inline">{t.label}</span>
          </button>
        );
      })}
    </div>
  );
};
