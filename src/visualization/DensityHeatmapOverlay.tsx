import React, { useMemo } from 'react';
import * as THREE from 'three';
import type { EducationalOverlayConfig } from '../types/plasma';
import { PlasmaEngine } from '../physics/PlasmaEngine';

interface DensityHeatmapOverlayProps {
  engine: PlasmaEngine;
  overlayConfig: EducationalOverlayConfig;
}

export const DensityHeatmapOverlay: React.FC<DensityHeatmapOverlayProps> = ({ engine, overlayConfig }) => {
  const { showPotentialMap, showDensityHeatmap } = overlayConfig;

  // Potential Map Slicer Mesh Material
  const potentialPlaneTexture = useMemo(() => {
    if (!showPotentialMap) return null;
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const imgData = ctx.createImageData(128, 128);
    const data = imgData.data;

    const dim = engine.grid.dimX;
    const kMid = Math.floor(dim / 2);

    for (let j = 0; j < 128; j++) {
      for (let i = 0; i < 128; i++) {
        const gi = Math.floor((i / 128) * dim);
        const gj = Math.floor((j / 128) * dim);
        const idx = engine.grid.getIndex(gi, gj, kMid);

        const phi = engine.grid.potential[idx];
        const norm = Math.max(-1, Math.min(1, phi * 0.05));

        const pixelIdx = (j * 128 + i) * 4;

        if (norm > 0) {
          data[pixelIdx] = 255 * norm;
          data[pixelIdx + 1] = 100 * norm;
          data[pixelIdx + 2] = 50;
        } else {
          data[pixelIdx] = 50;
          data[pixelIdx + 1] = 150 * Math.abs(norm);
          data[pixelIdx + 2] = 255 * Math.abs(norm);
        }
        data[pixelIdx + 3] = 180;
      }
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, [showPotentialMap, engine, engine.time]);

  return (
    <group>
      {/* Equipotential Slicer Plane */}
      {showPotentialMap && potentialPlaneTexture && (
        <mesh position={[0, 0, 0]}>
          <planeGeometry args={[engine.grid.boxSize * 2, engine.grid.boxSize * 2]} />
          <meshBasicMaterial
            map={potentialPlaneTexture}
            transparent
            opacity={0.65}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}

      {/* Volumetric Density Fog Sphere */}
      {showDensityHeatmap && (
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[engine.grid.boxSize * 0.95, 32, 32]} />
          <meshBasicMaterial
            color="#00e1ff"
            transparent
            opacity={0.08}
            wireframe
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}
    </group>
  );
};
