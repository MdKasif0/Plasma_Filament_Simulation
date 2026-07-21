import React from 'react';
import type { MagneticFieldType, PhysicsParameters } from '../types/plasma';
import { Sliders, X } from 'lucide-react';

interface ControlsDrawerProps {
  params: PhysicsParameters;
  onChange: (updated: Partial<PhysicsParameters>) => void;
  onClose: () => void;
}

export const ControlsDrawer: React.FC<ControlsDrawerProps> = ({ params, onChange, onClose }) => {
  return (
    <div className="absolute top-20 right-4 z-20 w-80 max-h-[calc(100vh-6rem)] overflow-y-auto p-5 rounded-2xl bg-black/50 backdrop-blur-xl border border-white/10 text-white shadow-2xl space-y-5 custom-scrollbar">
      {/* Drawer Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <h2 className="text-sm font-bold tracking-wide flex items-center gap-2 text-fuchsia-400">
          <Sliders className="w-4 h-4" />
          PHYSICS PARAMETERS
        </h2>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Group: Particles & Media */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Particle Medium
        </h3>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-300">Particle Count</span>
            <span className="font-mono text-cyan-400">{params.particleCount.toLocaleString()}</span>
          </div>
          <input
            type="range"
            min="2000"
            max="100000"
            step="1000"
            value={params.particleCount}
            onChange={(e) => onChange({ particleCount: Number(e.target.value) })}
            className="w-full accent-cyan-400 bg-white/10 rounded-lg cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-300">Temperature (eV / K)</span>
            <span className="font-mono text-amber-400">{Math.round(params.temperature)}</span>
          </div>
          <input
            type="range"
            min="500"
            max="40000"
            step="500"
            value={params.temperature}
            onChange={(e) => onChange({ temperature: Number(e.target.value) })}
            className="w-full accent-amber-400 bg-white/10 rounded-lg cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-300">Ionization Rate</span>
            <span className="font-mono text-emerald-400">{Math.round(params.ionizationRate * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={params.ionizationRate}
            onChange={(e) => onChange({ ionizationRate: Number(e.target.value) })}
            className="w-full accent-emerald-400 bg-white/10 rounded-lg cursor-pointer"
          />
        </div>
      </div>

      {/* Group: Electromagnetic Fields */}
      <div className="space-y-3 pt-3 border-t border-white/10">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Electromagnetic Fields
        </h3>

        <div>
          <label className="text-xs text-gray-300 block mb-1">Magnetic Field Type</label>
          <select
            value={params.magneticFieldType}
            onChange={(e) => onChange({ magneticFieldType: e.target.value as MagneticFieldType })}
            className="w-full px-3 py-1.5 text-xs bg-white/10 border border-white/15 rounded-xl text-cyan-300 focus:outline-none"
          >
            <option value="none">None</option>
            <option value="uniform">Uniform Axial Field</option>
            <option value="dipole">Dipole Magnetic Field</option>
            <option value="tokamak">Tokamak Toroidal / Poloidal</option>
            <option value="rotating">Rotating Field</option>
          </select>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-300">Magnetic Field B (T)</span>
            <span className="font-mono text-fuchsia-400">{params.magneticFieldStrength.toFixed(1)} T</span>
          </div>
          <input
            type="range"
            min="0"
            max="10"
            step="0.2"
            value={params.magneticFieldStrength}
            onChange={(e) => onChange({ magneticFieldStrength: Number(e.target.value) })}
            className="w-full accent-fuchsia-400 bg-white/10 rounded-lg cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-300">Electric Field E (V/m)</span>
            <span className="font-mono text-cyan-400">{params.electricFieldStrength.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="8"
            step="0.2"
            value={params.electricFieldStrength}
            onChange={(e) => onChange({ electricFieldStrength: Number(e.target.value) })}
            className="w-full accent-cyan-400 bg-white/10 rounded-lg cursor-pointer"
          />
        </div>
      </div>

      {/* Group: MHD Instabilities & Turbulence */}
      <div className="space-y-3 pt-3 border-t border-white/10">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Instabilities & Arcs
        </h3>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-300">Kink Instability (m=1)</span>
            <span className="font-mono text-rose-400">{params.kinkInstability.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={params.kinkInstability}
            onChange={(e) => onChange({ kinkInstability: Number(e.target.value) })}
            className="w-full accent-rose-400 bg-white/10 rounded-lg cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-300">Sausage Mode (m=0)</span>
            <span className="font-mono text-amber-400">{params.sausageInstability.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={params.sausageInstability}
            onChange={(e) => onChange({ sausageInstability: Number(e.target.value) })}
            className="w-full accent-amber-400 bg-white/10 rounded-lg cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-300">Turbulence / Eddies</span>
            <span className="font-mono text-purple-400">{params.turbulence.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={params.turbulence}
            onChange={(e) => onChange({ turbulence: Number(e.target.value) })}
            className="w-full accent-purple-400 bg-white/10 rounded-lg cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-300">Arc Branching Prob</span>
            <span className="font-mono text-cyan-300">{params.branchProbability.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={params.branchProbability}
            onChange={(e) => onChange({ branchProbability: Number(e.target.value) })}
            className="w-full accent-cyan-300 bg-white/10 rounded-lg cursor-pointer"
          />
        </div>
      </div>

      {/* Group: Visual & Performance */}
      <div className="space-y-3 pt-3 border-t border-white/10">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Visual Glow & Optics
        </h3>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-300">HDR Bloom Intensity</span>
            <span className="font-mono text-yellow-300">{params.glowIntensity.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min="0.2"
            max="3.0"
            step="0.1"
            value={params.glowIntensity}
            onChange={(e) => onChange({ glowIntensity: Number(e.target.value) })}
            className="w-full accent-yellow-300 bg-white/10 rounded-lg cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-300">Simulation Speed</span>
            <span className="font-mono text-emerald-300">{params.simulationSpeed.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="2.5"
            step="0.1"
            value={params.simulationSpeed}
            onChange={(e) => onChange({ simulationSpeed: Number(e.target.value) })}
            className="w-full accent-emerald-300 bg-white/10 rounded-lg cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
