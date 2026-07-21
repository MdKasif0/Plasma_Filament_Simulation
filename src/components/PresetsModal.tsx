import React from 'react';
import { PLASMA_PRESETS } from '../constants/presets';
import type { PresetConfig } from '../types/plasma';
import { Activity, Cloud, Globe, Shield, Sparkles, Sun, X, Zap } from 'lucide-react';

interface PresetsModalProps {
  onSelectPreset: (preset: PresetConfig) => void;
  onClose: () => void;
}

export const PresetsModal: React.FC<PresetsModalProps> = ({ onSelectPreset, onClose }) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sun':
        return <Sun className="w-5 h-5 text-amber-400" />;
      case 'Zap':
        return <Zap className="w-5 h-5 text-cyan-400" />;
      case 'Sparkles':
        return <Sparkles className="w-5 h-5 text-fuchsia-400" />;
      case 'Globe':
        return <Globe className="w-5 h-5 text-emerald-400" />;
      case 'Shield':
        return <Shield className="w-5 h-5 text-blue-400" />;
      case 'Cloud':
        return <Cloud className="w-5 h-5 text-purple-400" />;
      default:
        return <Activity className="w-5 h-5 text-cyan-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-4xl max-h-[85vh] overflow-y-auto p-6 rounded-3xl bg-[#090a16] border border-white/10 text-white shadow-2xl space-y-6 custom-scrollbar">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              SCIENTIFIC PLASMA PRESETS
            </h2>
            <p className="text-xs text-gray-400 mt-1 font-mono">
              Select a pre-configured electromagnetic and particle plasma environment
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Presets Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PLASMA_PRESETS.map((preset) => (
            <div
              key={preset.id}
              onClick={() => {
                onSelectPreset(preset);
                onClose();
              }}
              className="group p-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/50 cursor-pointer transition-all duration-200 flex flex-col justify-between space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 group-hover:scale-110 transition-transform">
                    {getIcon(preset.icon)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {preset.name}
                    </h3>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                      {preset.category}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-300 leading-relaxed font-sans">{preset.description}</p>

              <div className="flex items-center justify-between text-[11px] font-mono text-gray-400 pt-2 border-t border-white/5">
                <span>Particles: {preset.params.particleCount?.toLocaleString()}</span>
                <span>B-Field: {preset.params.magneticFieldType}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
