import React from 'react';
import { Bloom, ChromaticAberration, EffectComposer, Vignette } from '@react-three/postprocessing';
import { Vector2 } from 'three';

interface PostProcessingEffectsProps {
  glowIntensity: number;
}

export const PostProcessingEffects: React.FC<PostProcessingEffectsProps> = ({ glowIntensity }) => {
  return (
    <EffectComposer multisampling={4}>
      <Bloom
        intensity={glowIntensity * 1.6}
        luminanceThreshold={0.15}
        luminanceSmoothing={0.85}
        mipmapBlur
      />
      <ChromaticAberration
        offset={new Vector2(0.0015, 0.0015)}
        radialModulation={true}
        modulationOffset={0.5}
      />
      <Vignette eskil={false} offset={0.2} darkness={0.85} />
    </EffectComposer>
  );
};
