import React from 'react';
import type { DiagnosticStats } from '../types/plasma';
import { Activity, Flame, Zap } from 'lucide-react';

interface DashboardProps {
  stats: DiagnosticStats;
}

export const Dashboard: React.FC<DashboardProps> = ({ stats }) => {
  return (
    <div className="absolute top-20 left-4 z-10 w-72 p-4 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 text-white shadow-2xl space-y-3 font-mono">
      {/* Header telemetry badge */}
      <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs">
        <span className="flex items-center gap-1.5 text-cyan-400 font-sans font-semibold">
          <Activity className="w-3.5 h-3.5" />
          DIAGNOSTIC TELEMETRY
        </span>
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
            stats.fps >= 50
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : stats.fps >= 30
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
          }`}
        >
          {stats.fps} FPS
        </span>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        {/* Particles */}
        <div className="p-2 rounded-xl bg-white/5 border border-white/5">
          <div className="text-gray-400 text-[10px]">PARTICLES</div>
          <div className="text-sm font-bold text-white">{stats.particleCount.toLocaleString()}</div>
          <div className="text-[9px] text-cyan-400">
            e⁻: {(stats.electronCount / 1000).toFixed(1)}k | Ion⁺: {(stats.ionCount / 1000).toFixed(1)}k
          </div>
        </div>

        {/* Temperature */}
        <div className="p-2 rounded-xl bg-white/5 border border-white/5">
          <div className="text-gray-400 text-[10px]">PLASMA TEMP</div>
          <div className="text-sm font-bold text-amber-400 flex items-center gap-1">
            <Flame className="w-3 h-3" />
            {stats.plasmaTemp.toLocaleString()} K
          </div>
          <div className="text-[9px] text-gray-400">Avg E: {stats.avgEnergy} eV</div>
        </div>

        {/* Fields */}
        <div className="p-2 rounded-xl bg-white/5 border border-white/5">
          <div className="text-gray-400 text-[10px]">MAX E-FIELD</div>
          <div className="text-sm font-bold text-cyan-300">{stats.maxEField} V/m</div>
          <div className="text-[9px] text-gray-400">B-Field: {stats.maxBField} T</div>
        </div>

        {/* Filaments */}
        <div className="p-2 rounded-xl bg-white/5 border border-white/5">
          <div className="text-gray-400 text-[10px]">FILAMENTS</div>
          <div className="text-sm font-bold text-fuchsia-400 flex items-center gap-1">
            <Zap className="w-3 h-3" />
            {stats.filamentCount}
          </div>
          <div className="text-[9px] text-gray-400">Len: {stats.avgFilamentLength} cm</div>
        </div>
      </div>

      {/* Secondary Details */}
      <div className="pt-2 border-t border-white/10 text-[10px] space-y-1 text-gray-300">
        <div className="flex justify-between">
          <span className="text-gray-400">Reconnection Energy:</span>
          <span className="text-rose-400 font-bold">{stats.energyReleased} J</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Plasma Density:</span>
          <span>{stats.plasmaDensity.toExponential(2)} m⁻³</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">MHD Instability Index:</span>
          <span
            className={
              stats.instabilityIndex > 0.8
                ? 'text-rose-400 font-bold'
                : stats.instabilityIndex > 0.3
                ? 'text-amber-400'
                : 'text-emerald-400'
            }
          >
            {stats.instabilityIndex}
          </span>
        </div>
      </div>
    </div>
  );
};
