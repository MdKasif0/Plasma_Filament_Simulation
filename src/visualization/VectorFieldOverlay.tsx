import React, { useMemo } from 'react';
import * as THREE from 'three';
import type { EducationalOverlayConfig, Vector3D } from '../types/plasma';
import { PlasmaEngine } from '../physics/PlasmaEngine';

interface VectorFieldOverlayProps {
  engine: PlasmaEngine;
  overlayConfig: EducationalOverlayConfig;
}

export const VectorFieldOverlay: React.FC<VectorFieldOverlayProps> = ({ engine, overlayConfig }) => {
  const { showEFieldVectors, showBFieldVectors, showFieldLines } = overlayConfig;

  // Sample E-field vectors at regular grid sample points
  const eFieldArrows = useMemo(() => {
    if (!showEFieldVectors) return [];
    const arrows: THREE.ArrowHelper[] = [];

    const step = 4.5;
    const box = engine.grid.boxSize * 0.8;
    const tempE: Vector3D = { x: 0, y: 0, z: 0 };
    const color = new THREE.Color(0.2, 0.9, 1.0);

    for (let x = -box; x <= box; x += step) {
      for (let y = -box; y <= box; y += step) {
        for (let z = -box; z <= box; z += step) {
          engine.grid.sampleEField(x, y, z, tempE);
          const len = Math.sqrt(tempE.x * tempE.x + tempE.y * tempE.y + tempE.z * tempE.z);
          if (len > 0.05) {
            const dir = new THREE.Vector3(tempE.x, tempE.y, tempE.z).normalize();
            const arrowLen = Math.min(2.0, 0.4 + len * 0.2);
            arrows.push(new THREE.ArrowHelper(dir, new THREE.Vector3(x, y, z), arrowLen, color, 0.3, 0.15));
          }
        }
      }
    }
    return arrows;
  }, [showEFieldVectors, engine, engine.time]);

  // Sample B-field vectors
  const bFieldArrows = useMemo(() => {
    if (!showBFieldVectors) return [];
    const arrows: THREE.ArrowHelper[] = [];

    const step = 4.5;
    const box = engine.grid.boxSize * 0.8;
    const tempB: Vector3D = { x: 0, y: 0, z: 0 };
    const color = new THREE.Color(1.0, 0.3, 0.8);

    for (let x = -box; x <= box; x += step) {
      for (let y = -box; y <= box; y += step) {
        for (let z = -box; z <= box; z += step) {
          engine.magneticField.sampleBField(x, y, z, tempB);
          const len = Math.sqrt(tempB.x * tempB.x + tempB.y * tempB.y + tempB.z * tempB.z);
          if (len > 0.05) {
            const dir = new THREE.Vector3(tempB.x, tempB.y, tempB.z).normalize();
            const arrowLen = Math.min(2.0, 0.4 + len * 0.3);
            arrows.push(new THREE.ArrowHelper(dir, new THREE.Vector3(x, y, z), arrowLen, color, 0.3, 0.15));
          }
        }
      }
    }
    return arrows;
  }, [showBFieldVectors, engine, engine.params.magneticFieldType, engine.params.magneticFieldStrength]);

  // Generate continuous Magnetic Field Lines (streamlines)
  const bFieldLineObjects = useMemo(() => {
    if (!showFieldLines) return [];
    const lineObjs: THREE.Line[] = [];
    const seedPoints: THREE.Vector3[] = [];

    const box = engine.grid.boxSize * 0.7;
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      seedPoints.push(new THREE.Vector3(Math.cos(angle) * box * 0.5, Math.sin(angle) * box * 0.5, -box * 0.8));
    }

    const tempB: Vector3D = { x: 0, y: 0, z: 0 };
    const mat = new THREE.LineBasicMaterial({ color: '#ff44aa', transparent: true, opacity: 0.6 });

    for (const seed of seedPoints) {
      const pts: THREE.Vector3[] = [seed.clone()];
      let curr = seed.clone();

      for (let step = 0; step < 30; step++) {
        engine.magneticField.sampleBField(curr.x, curr.y, curr.z, tempB);
        const bLen = Math.sqrt(tempB.x * tempB.x + tempB.y * tempB.y + tempB.z * tempB.z);
        if (bLen < 0.01) break;

        curr.addScaledVector(new THREE.Vector3(tempB.x, tempB.y, tempB.z).normalize(), 0.6);
        pts.push(curr.clone());
        if (curr.length() > box * 1.3) break;
      }
      if (pts.length > 2) {
        const geom = new THREE.BufferGeometry().setFromPoints(pts);
        lineObjs.push(new THREE.Line(geom, mat));
      }
    }
    return lineObjs;
  }, [showFieldLines, engine, engine.params.magneticFieldType, engine.params.magneticFieldStrength]);

  return (
    <group>
      {/* E-Field Arrows */}
      {eFieldArrows.map((arrow, i) => (
        <primitive key={`e-arrow-${i}`} object={arrow} />
      ))}

      {/* B-Field Arrows */}
      {bFieldArrows.map((arrow, i) => (
        <primitive key={`b-arrow-${i}`} object={arrow} />
      ))}

      {/* B-Field Streamlines */}
      {bFieldLineObjects.map((lineObj, i) => (
        <primitive key={`b-line-${i}`} object={lineObj} />
      ))}
    </group>
  );
};
