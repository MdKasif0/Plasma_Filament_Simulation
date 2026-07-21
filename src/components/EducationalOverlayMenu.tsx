import React from 'react';
import type { EducationalOverlayConfig } from '../types/plasma';
import { Eye, Layers, X } from 'lucide-react';

interface EducationalOverlayMenuProps {
  config: EducationalOverlayConfig;
  onChange: (updated: Partial<EducationalOverlayConfig>) => void;
  onClose: () => void;
}

export const EducationalOverlayMenu: React.FC<EducationalOverlayMenuProps> = ({
  config,
  onChange,
  onClose,
}) => {
  const options: { key: keyof EducationalOverlayConfig; label: string; desc: string }[] = [
    {
      key: 'showEFieldVectors',
      label: 'Electric Field Vectors (E)',
      desc: '3D spatial vector arrows of potential gradients',
    },
    {
      key: 'showBFieldVectors',
      label: 'Magnetic Field Vectors (B)',
      desc: '3D magnetic field direction and strength arrows',
    },
    {
      key: 'showFieldLines',
      label: 'Magnetic Field Lines',
      desc: 'Continuous magnetic flux streamlines',
    },
    {
      key: 'showPotentialMap',
      label: 'Equipotential Slicer Map',
      desc: '2D plane contour slicer of electric potential',
    },
    {
      key: 'showDensityHeatmap',
      label: 'Volumetric Density Heatmap',
      desc: 'Charge density cloud envelope',
    },
  ];

  return (
    <div className="absolute top-20 right-4 z-20 w-80 p-5 rounded-2xl bg-black/50 backdrop-blur-xl border border-white/10 text-white shadow-2xl space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <h2 className="text-sm font-bold tracking-wide flex items-center gap-2 text-cyan-400">
          <Layers className="w-4 h-4" />
          EDUCATIONAL OVERLAYS
        </h2>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        {options.map((opt) => (
          <label
            key={opt.key}
            className="flex items-start space-x-3 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 cursor-pointer transition"
          >
            <input
              type="checkbox"
              checked={config[opt.key]}
              onChange={(e) => onChange({ [opt.key]: e.target.checked })}
              className="mt-0.5 w-4 h-4 accent-cyan-400 rounded cursor-pointer"
            />
            <div className="flex-1 text-xs">
              <div className="font-semibold text-gray-200 flex items-center gap-1">
                <Eye className="w-3 h-3 text-cyan-400" />
                {opt.label}
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">{opt.desc}</div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
};
