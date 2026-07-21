import React, { useMemo } from 'react';
import * as THREE from 'three';
import type { FilamentBranch } from '../types/plasma';

interface FilamentRendererProps {
  filaments: FilamentBranch[];
  glowIntensity: number;
}

export const FilamentRenderer: React.FC<FilamentRendererProps> = ({ filaments, glowIntensity }) => {
  const lineGeometries = useMemo(() => {
    return filaments.map((f) => {
      const points: THREE.Vector3[] = f.nodes.map((n) => new THREE.Vector3(n.x, n.y, n.z));
      const curve = new THREE.CatmullRomCurve3(points);
      const geom = new THREE.TubeGeometry(curve, Math.max(8, points.length * 3), 0.08 * f.intensity, 6, false);
      return { id: f.id, geom, intensity: f.intensity };
    });
  }, [filaments]);

  if (filaments.length === 0) return null;

  return (
    <group>
      {lineGeometries.map(({ id, geom, intensity }) => (
        <mesh key={id} geometry={geom}>
          <meshBasicMaterial
            color={new THREE.Color(0.2, 0.85, 1.0).multiplyScalar(intensity * glowIntensity * 2.5)}
            transparent
            opacity={Math.min(1.0, intensity * 0.9)}
            blending={THREE.AdditiveBlending}
            wireframe={false}
          />
        </mesh>
      ))}
    </group>
  );
};
