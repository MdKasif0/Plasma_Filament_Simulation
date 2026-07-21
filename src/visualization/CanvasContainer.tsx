import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import type { EducationalOverlayConfig, InteractionTool } from '../types/plasma';
import { PlasmaEngine } from '../physics/PlasmaEngine';
import { ParticleRenderer } from './ParticleRenderer';
import { FilamentRenderer } from './FilamentRenderer';
import { VectorFieldOverlay } from './VectorFieldOverlay';
import { DensityHeatmapOverlay } from './DensityHeatmapOverlay';
import { PostProcessingEffects } from './PostProcessingEffects';

interface CanvasContainerProps {
  engine: PlasmaEngine;
  overlayConfig: EducationalOverlayConfig;
  activeTool: InteractionTool;
  isPaused: boolean;
  onFPSUpdate: (fps: number) => void;
}

const EngineSimulationLoop: React.FC<{
  engine: PlasmaEngine;
  isPaused: boolean;
  onFPSUpdate: (fps: number) => void;
}> = ({ engine, isPaused, onFPSUpdate }) => {
  const fpsAccumulator = useRef<number[]>([]);

  useFrame((_, delta) => {
    const currentFps = 1 / Math.max(0.001, delta);
    fpsAccumulator.current.push(currentFps);
    if (fpsAccumulator.current.length > 20) {
      const avg = fpsAccumulator.current.reduce((a, b) => a + b, 0) / fpsAccumulator.current.length;
      onFPSUpdate(avg);
      fpsAccumulator.current = [];
    }

    if (!isPaused && engine) {
      engine.step(Math.min(0.033, delta));
    }
  });

  return null;
};

export const CanvasContainer: React.FC<CanvasContainerProps> = ({
  engine,
  overlayConfig,
  activeTool,
  isPaused,
  onFPSUpdate,
}) => {
  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (activeTool === 'select') return;
    e.stopPropagation();

    const point = e.point;
    const pos = { x: point.x, y: point.y, z: point.z };

    switch (activeTool) {
      case 'inject_charge':
        engine.injectCharge(pos, 800, false);
        break;

      case 'anode':
        engine.electrodes.push({
          id: `anode-${Date.now()}`,
          position: pos,
          charge: 1,
          voltage: 400,
          radius: 1.2,
        });
        break;

      case 'cathode':
        engine.electrodes.push({
          id: `cathode-${Date.now()}`,
          position: pos,
          charge: -1,
          voltage: -400,
          radius: 1.2,
        });
        break;

      case 'magnet':
        engine.magnets.push({
          id: `mag-${Date.now()}`,
          position: pos,
          dipoleMoment: { x: 0, y: 0, z: 1 },
          strength: 4.0,
        });
        break;

      case 'obstacle':
        engine.obstacles.push({
          id: `obs-${Date.now()}`,
          position: pos,
          radius: 2.2,
          dielectricConstant: 4.0,
        });
        break;

      case 'explosion':
        engine.triggerExplosion(pos, 45);
        break;

      case 'vacuum':
        engine.eraseParticles(pos, 4.0);
        break;

      default:
        break;
    }
  };

  return (
    <div className="relative w-full h-full bg-[#020206] overflow-hidden select-none">
      <Canvas
        camera={{ position: [0, 0, 26], fov: 48 }}
        gl={{ powerPreference: 'high-performance', antialias: false }}
      >
        <color attach="background" args={['#020206']} />
        <ambientLight intensity={0.2} />

        {/* Raycasting interaction plane */}
        <mesh visible={false} onPointerDown={handlePointerDown}>
          <boxGeometry args={[100, 100, 100]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>

        {/* Stars in astrophysical void */}
        <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />

        {/* Engine Loop */}
        <EngineSimulationLoop engine={engine} isPaused={isPaused} onFPSUpdate={onFPSUpdate} />

        {/* 100k Particle GPU Renderer */}
        <ParticleRenderer engine={engine} glowIntensity={engine.params.glowIntensity} />

        {/* Dielectric Arc Branching Filaments */}
        <FilamentRenderer
          filaments={engine.filamentTracker.filaments}
          glowIntensity={engine.params.glowIntensity}
        />

        {/* Educational Overlays */}
        <VectorFieldOverlay engine={engine} overlayConfig={overlayConfig} />
        <DensityHeatmapOverlay engine={engine} overlayConfig={overlayConfig} />

        {/* Render Electrodes */}
        {engine.electrodes.map((el) => (
          <mesh key={el.id} position={[el.position.x, el.position.y, el.position.z]}>
            <sphereGeometry args={[el.radius, 16, 16]} />
            <meshStandardMaterial
              color={el.charge > 0 ? '#ff2a6d' : '#05d9e8'}
              emissive={el.charge > 0 ? '#ff2a6d' : '#05d9e8'}
              emissiveIntensity={2.0}
              roughness={0.2}
            />
          </mesh>
        ))}

        {/* Render Magnets */}
        {engine.magnets.map((m) => (
          <mesh key={m.id} position={[m.position.x, m.position.y, m.position.z]}>
            <cylinderGeometry args={[0.8, 0.8, 1.8, 16]} />
            <meshStandardMaterial
              color="#ff00ff"
              emissive="#ff00ff"
              emissiveIntensity={1.5}
              metalness={0.8}
            />
          </mesh>
        ))}

        {/* Render Dielectric Obstacles */}
        {engine.obstacles.map((obs) => (
          <mesh key={obs.id} position={[obs.position.x, obs.position.y, obs.position.z]}>
            <sphereGeometry args={[obs.radius, 24, 24]} />
            <meshPhysicalMaterial
              color="#1a1a2e"
              transmission={0.85}
              opacity={1.0}
              transparent
              roughness={0.1}
              ior={1.5}
              thickness={1.2}
            />
          </mesh>
        ))}

        {/* Spherical Containment Grid Boundary */}
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[engine.grid.boxSize, 16, 16]} />
          <meshBasicMaterial color="#05d9e8" wireframe transparent opacity={0.06} />
        </mesh>

        {/* Camera Controls */}
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.05}
          rotateSpeed={0.8}
          zoomSpeed={1.0}
          minDistance={5}
          maxDistance={60}
        />

        {/* Cinematic HDR Postprocessing */}
        <PostProcessingEffects glowIntensity={engine.params.glowIntensity} />
      </Canvas>
    </div>
  );
};
