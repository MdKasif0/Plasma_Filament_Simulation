export type ParticleSpecies = 'electron' | 'ion';

export type MagneticFieldType = 'none' | 'uniform' | 'dipole' | 'tokamak' | 'rotating' | 'custom';

export type InteractionTool = 
  | 'select'
  | 'inject_charge'
  | 'anode'
  | 'cathode'
  | 'magnet'
  | 'obstacle'
  | 'explosion'
  | 'efield_draw'
  | 'vacuum';

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface Electrode {
  id: string;
  position: Vector3D;
  charge: number; // positive = anode, negative = cathode
  voltage: number;
  radius: number;
}

export interface Magnet {
  id: string;
  position: Vector3D;
  dipoleMoment: Vector3D;
  strength: number;
}

export interface PlasmaObstacle {
  id: string;
  position: Vector3D;
  radius: number;
  dielectricConstant: number;
}

export interface PhysicsParameters {
  particleCount: number;
  voltage: number;
  current: number;
  magneticFieldStrength: number;
  magneticFieldType: MagneticFieldType;
  electricFieldStrength: number;
  temperature: number; // Kelvin or eV
  ionizationRate: number; // 0 to 1
  pressure: number; // Pascals / Torr
  turbulence: number; // 0 to 1
  branchProbability: number; // 0 to 1
  filamentPersistence: number; // 0 to 1
  glowIntensity: number; // 0.1 to 3.0
  simulationSpeed: number; // 0.1 to 3.0
  timeScale: number; // 0.1 to 2.0
  collisionRate: number; // 0 to 1
  energyLoss: number; // damping factor
  kinkInstability: number; // 0 to 1
  sausageInstability: number; // 0 to 1
}

export interface EducationalOverlayConfig {
  showEFieldVectors: boolean;
  showBFieldVectors: boolean;
  showPotentialMap: boolean;
  showDensityHeatmap: boolean;
  showCurrentVectors: boolean;
  showFilamentSkeleton: boolean;
  showFieldLines: boolean;
}

export interface DiagnosticStats {
  particleCount: number;
  electronCount: number;
  ionCount: number;
  avgEnergy: number; // eV
  maxEField: number; // V/m
  maxBField: number; // Tesla
  plasmaTemp: number; // Kelvin
  plasmaDensity: number; // particles / m3
  filamentCount: number;
  avgFilamentLength: number; // cm
  energyReleased: number; // Joules
  fps: number;
  instabilityIndex: number;
}

export interface PresetConfig {
  id: string;
  name: string;
  description: string;
  category: 'Laboratory' | 'Astrophysical' | 'Fusion' | 'Atmospheric';
  icon: string;
  params: Partial<PhysicsParameters>;
  electrodes?: Omit<Electrode, 'id'>[];
  magnets?: Omit<Magnet, 'id'>[];
  obstacles?: Omit<PlasmaObstacle, 'id'>[];
}

export interface FilamentNode {
  position: Vector3D;
  intensity: number;
  chargeDensity: number;
  children: FilamentNode[];
}

export interface FilamentBranch {
  id: string;
  nodes: Vector3D[];
  intensity: number;
  age: number;
  maxAge: number;
}
