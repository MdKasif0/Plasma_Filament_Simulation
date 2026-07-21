import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PlasmaEngine } from '../physics/PlasmaEngine';

interface ParticleRendererProps {
  engine: PlasmaEngine;
  glowIntensity: number;
}

const ParticleShaderMaterial = {
  uniforms: {
    uGlowIntensity: { value: 1.0 },
    uTime: { value: 0 },
    uPixelRatio: { value: window.devicePixelRatio || 1.0 },
  },
  vertexShader: `
    attribute vec3 aVelocity;
    attribute float aSpecies;
    attribute float aEnergy;

    varying vec3 vVelocity;
    varying float vSpecies;
    varying float vEnergy;
    varying float vSpeed;

    uniform float uGlowIntensity;
    uniform float uPixelRatio;

    void main() {
      vVelocity = aVelocity;
      vSpecies = aSpecies;
      vEnergy = aEnergy;

      float speed = length(aVelocity);
      vSpeed = speed;

      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

      // Electrons are smaller and faster; ions are larger and glow warmer
      float baseSize = (aSpecies < 0.5) ? 0.9 : 1.6;
      float speedFactor = 1.0 + clamp(speed * 0.1, 0.0, 2.0);
      float size = baseSize * speedFactor * uGlowIntensity;

      // Distance attenuation
      gl_PointSize = size * (70.0 / -mvPosition.z) * uPixelRatio;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    varying vec3 vVelocity;
    varying float vSpecies;
    varying float vEnergy;
    varying float vSpeed;

    uniform float uTime;

    // Palette mapping from kinetic energy & species
    vec3 getEnergyColor(float species, float speed, float energy) {
      if (species < 0.5) {
        // Electrons: Deep Blue -> Cyan -> Violet -> Hot Pink -> White
        float t = clamp(speed * 0.12, 0.0, 1.0);
        vec3 col1 = vec3(0.05, 0.45, 1.0); // Electric Cyan
        vec3 col2 = vec3(0.6, 0.1, 1.0);  // Violet / Magenta
        vec3 col3 = vec3(1.0, 0.2, 0.8);  // Hot Pink
        vec3 col4 = vec3(1.0, 0.95, 1.0); // Hot White

        if (t < 0.33) return mix(col1, col2, t * 3.0);
        if (t < 0.66) return mix(col2, col3, (t - 0.33) * 3.0);
        return mix(col3, col4, (t - 0.66) * 3.0);
      } else {
        // Positive Ions: Deep Magenta -> Warm Orange -> Glowing Yellow
        float t = clamp(speed * 0.25, 0.0, 1.0);
        vec3 col1 = vec3(0.8, 0.1, 0.5);  // Deep Magenta
        vec3 col2 = vec3(1.0, 0.4, 0.1);  // Flame Orange
        vec3 col3 = vec3(1.0, 0.9, 0.3);  // Gold White
        return mix(col1, mix(col2, col3, t), t);
      }
    }

    void main() {
      // Soft radial glow (distance from center of Point)
      vec2 coord = gl_PointCoord - vec2(0.5);
      float distSq = dot(coord, coord);
      if (distSq > 0.25) discard;

      float alpha = exp(-distSq * 12.0); // Soft Gaussian falloff
      vec3 color = getEnergyColor(vSpecies, vSpeed, vEnergy);

      // Motion streak intensity
      float intensity = 1.0 + clamp(vSpeed * 0.1, 0.0, 2.0);

      gl_FragColor = vec4(color * intensity, alpha * 0.92);
    }
  `,
};

export const ParticleRenderer: React.FC<ParticleRendererProps> = ({ engine, glowIntensity }) => {
  const pointsRef = useRef<THREE.Points>(null!);
  const geometryRef = useRef<THREE.BufferGeometry>(null!);
  const materialRef = useRef<THREE.ShaderMaterial>(null!);

  const maxCount = engine.maxParticles;

  // Initialize Buffer Attributes
  const [positionAttr, velocityAttr, speciesAttr, energyAttr] = useMemo(() => {
    const pos = new THREE.BufferAttribute(new Float32Array(maxCount * 3), 3);
    const vel = new THREE.BufferAttribute(new Float32Array(maxCount * 3), 3);
    const spec = new THREE.BufferAttribute(new Float32Array(maxCount), 1);
    const nrg = new THREE.BufferAttribute(new Float32Array(maxCount), 1);

    pos.setUsage(THREE.DynamicDrawUsage);
    vel.setUsage(THREE.DynamicDrawUsage);
    spec.setUsage(THREE.DynamicDrawUsage);
    nrg.setUsage(THREE.DynamicDrawUsage);

    return [pos, vel, spec, nrg];
  }, [maxCount]);

  useFrame((state) => {
    if (!geometryRef.current || !engine) return;

    const count = engine.activeParticleCount;

    // Direct memory copy to geometry buffers for ultra-fast GPU upload
    (positionAttr.array as Float32Array).set(
      engine.positions.subarray(0, count * 3)
    );
    (velocityAttr.array as Float32Array).set(
      engine.velocities.subarray(0, count * 3)
    );
    (speciesAttr.array as Uint8Array).set(
      engine.species.subarray(0, count)
    );
    (energyAttr.array as Float32Array).set(
      engine.energies.subarray(0, count)
    );

    positionAttr.needsUpdate = true;
    velocityAttr.needsUpdate = true;
    speciesAttr.needsUpdate = true;
    energyAttr.needsUpdate = true;

    geometryRef.current.setDrawRange(0, count);

    if (materialRef.current) {
      materialRef.current.uniforms.uGlowIntensity.value = glowIntensity;
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry ref={geometryRef}>
        <primitive object={positionAttr} attach="attributes-position" />
        <primitive object={velocityAttr} attach="attributes-aVelocity" />
        <primitive object={speciesAttr} attach="attributes-aSpecies" />
        <primitive object={energyAttr} attach="attributes-aEnergy" />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        args={[ParticleShaderMaterial]}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};
