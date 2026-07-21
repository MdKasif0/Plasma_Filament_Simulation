import type {
  DiagnosticStats,
  Electrode,
  Magnet,
  PhysicsParameters,
  PlasmaObstacle,
  Vector3D,
} from '../types/plasma';
import { BorisIntegrator } from './BorisIntegrator';
import { FieldGrid } from './FieldGrid';
import { FilamentTracker } from './FilamentTracker';
import { InstabilityManager } from './InstabilityManager';
import { MagneticField } from './MagneticField';
import { ReconnectionDetector } from './ReconnectionDetector';

export class PlasmaEngine {
  public maxParticles: number = 120000;
  public activeParticleCount: number = 50000;

  // Typed arrays for GPU buffer fast upload
  public positions: Float32Array;
  public velocities: Float32Array;
  public species: Uint8Array; // 0 = electron, 1 = positive ion
  public energies: Float32Array; // eV or kinetic energy

  public grid: FieldGrid;
  public magneticField: MagneticField;
  public filamentTracker: FilamentTracker;
  public instabilityManager: InstabilityManager;
  public reconnectionDetector: ReconnectionDetector;

  public electrodes: Electrode[] = [];
  public magnets: Magnet[] = [];
  public obstacles: PlasmaObstacle[] = [];

  public params: PhysicsParameters;
  public time: number = 0;
  public totalEnergyReleased: number = 0;

  private tempE: Vector3D = { x: 0, y: 0, z: 0 };
  private tempB: Vector3D = { x: 0, y: 0, z: 0 };
  private tempV: Vector3D = { x: 0, y: 0, z: 0 };

  constructor(initialParams: PhysicsParameters) {
    this.params = { ...initialParams };
    this.activeParticleCount = Math.min(this.maxParticles, initialParams.particleCount);

    this.positions = new Float32Array(this.maxParticles * 3);
    this.velocities = new Float32Array(this.maxParticles * 3);
    this.species = new Uint8Array(this.maxParticles);
    this.energies = new Float32Array(this.maxParticles);

    this.grid = new FieldGrid(32, 10);
    this.magneticField = new MagneticField(initialParams.magneticFieldType, initialParams.magneticFieldStrength);
    this.filamentTracker = new FilamentTracker();
    this.instabilityManager = new InstabilityManager();
    this.reconnectionDetector = new ReconnectionDetector();

    this.initializeParticles();
  }

  /**
   * Populate particle positions and velocities according to initial Maxwell-Boltzmann thermal distribution
   */
  public initializeParticles(): void {
    const box = this.grid.boxSize * 0.85;
    const count = this.activeParticleCount;
    const electronRatio = 0.75; // 75% electrons, 25% positive ions for neutrality / dynamics

    const vThermalElectron = Math.sqrt(this.params.temperature * 0.05);
    const vThermalIon = vThermalElectron * 0.15; // Ions are much heavier (slower)

    for (let i = 0; i < count; i++) {
      const isElectron = Math.random() < electronRatio;
      this.species[i] = isElectron ? 0 : 1;

      // Random position inside spherical plasma volume or box
      const r = Math.pow(Math.random(), 0.333) * box;
      const theta = Math.acos(2 * Math.random() - 1);
      const phi = 2 * Math.PI * Math.random();

      this.positions[i * 3] = r * Math.sin(theta) * Math.cos(phi);
      this.positions[i * 3 + 1] = r * Math.sin(theta) * Math.sin(phi);
      this.positions[i * 3 + 2] = r * Math.cos(theta);

      // Maxwellian velocity components
      const vMag = isElectron ? vThermalElectron : vThermalIon;
      this.velocities[i * 3] = (Math.random() - 0.5) * 2 * vMag;
      this.velocities[i * 3 + 1] = (Math.random() - 0.5) * 2 * vMag;
      this.velocities[i * 3 + 2] = (Math.random() - 0.5) * 2 * vMag;

      const vx = this.velocities[i * 3];
      const vy = this.velocities[i * 3 + 1];
      const vz = this.velocities[i * 3 + 2];
      this.energies[i] = 0.5 * (vx * vx + vy * vy + vz * vz);
    }
  }

  /**
   * Main simulation step orchestrating PIC algorithm
   */
  public step(dt: number): void {
    const effectiveDt = dt * this.params.simulationSpeed * this.params.timeScale;
    this.time += effectiveDt;

    this.magneticField.fieldType = this.params.magneticFieldType;
    this.magneticField.baseStrength = this.params.magneticFieldStrength;
    this.magneticField.magnets = this.magnets;
    this.magneticField.updateTime(effectiveDt);

    // 1. Charge Deposition (CIC)
    this.grid.depositCharges(
      this.positions,
      this.species,
      this.velocities,
      this.activeParticleCount,
      -1.0 * (1.0 + this.params.ionizationRate),
      1.0
    );

    // 2. Solve 3D Electric Potential & E-field
    this.grid.solvePotential(this.electrodes, 6, 1.4);

    // 3. Boris Push for Lorentz force integration
    const mElectron = 1.0;
    const mIon = 100.0; // Heavier mass ratio
    const qElectron = -1.0;
    const qIon = 1.0;
    const box = this.grid.boxSize;
    const energyLossFactor = Math.pow(1 - this.params.energyLoss * 0.05, effectiveDt * 60);

    for (let i = 0; i < this.activeParticleCount; i++) {
      const px = this.positions[i * 3];
      const py = this.positions[i * 3 + 1];
      const pz = this.positions[i * 3 + 2];

      // Sample local E and B fields
      this.grid.sampleEField(px, py, pz, this.tempE);
      this.magneticField.sampleBField(px, py, pz, this.tempB);

      // Add user E-field parameter scaling
      this.tempE.x *= this.params.electricFieldStrength;
      this.tempE.y *= this.params.electricFieldStrength;
      this.tempE.z *= this.params.electricFieldStrength;

      const isElectron = this.species[i] === 0;
      const qOverM = isElectron ? qElectron / mElectron : qIon / mIon;

      // Boris velocity push
      BorisIntegrator.pushVelocity(
        this.velocities[i * 3],
        this.velocities[i * 3 + 1],
        this.velocities[i * 3 + 2],
        this.tempE.x,
        this.tempE.y,
        this.tempE.z,
        this.tempB.x,
        this.tempB.y,
        this.tempB.z,
        qOverM,
        effectiveDt,
        this.tempV
      );

      // Apply damping / collision energy loss
      let vx = this.tempV.x * energyLossFactor;
      let vy = this.tempV.y * energyLossFactor;
      let vz = this.tempV.z * energyLossFactor;

      // Elastic inter-particle / neutral background collisions
      if (this.params.collisionRate > 0.05 && Math.random() < this.params.collisionRate * 0.15) {
        const vMag = Math.sqrt(vx * vx + vy * vy + vz * vz);
        const theta = Math.acos(2 * Math.random() - 1);
        const phi = 2 * Math.PI * Math.random();

        vx = vMag * Math.sin(theta) * Math.cos(phi);
        vy = vMag * Math.sin(theta) * Math.sin(phi);
        vz = vMag * Math.cos(theta);
      }

      this.velocities[i * 3] = vx;
      this.velocities[i * 3 + 1] = vy;
      this.velocities[i * 3 + 2] = vz;

      // Position advection x^(n+1) = x^n + v^(n+1/2) * dt
      let nx = px + vx * effectiveDt;
      let ny = py + vy * effectiveDt;
      let nz = pz + vz * effectiveDt;

      // Boundary reflection with containment
      if (nx < -box || nx > box) {
        this.velocities[i * 3] *= -0.8;
        nx = Math.max(-box, Math.min(box, nx));
      }
      if (ny < -box || ny > box) {
        this.velocities[i * 3 + 1] *= -0.8;
        ny = Math.max(-box, Math.min(box, ny));
      }
      if (nz < -box || nz > box) {
        this.velocities[i * 3 + 2] *= -0.8;
        nz = Math.max(-box, Math.min(box, nz));
      }

      // Obstacle collision reflections
      for (const obs of this.obstacles) {
        const ox = nx - obs.position.x;
        const oy = ny - obs.position.y;
        const oz = nz - obs.position.z;
        const distSq = ox * ox + oy * oy + oz * oz;
        const rSq = obs.radius * obs.radius;

        if (distSq < rSq && distSq > 0.001) {
          const dist = Math.sqrt(distSq);
          const nxNorm = ox / dist;
          const nyNorm = oy / dist;
          const nzNorm = oz / dist;

          // Reflect velocity across obstacle normal
          const dot = vx * nxNorm + vy * nyNorm + vz * nzNorm;
          this.velocities[i * 3] -= 1.8 * dot * nxNorm;
          this.velocities[i * 3 + 1] -= 1.8 * dot * nyNorm;
          this.velocities[i * 3 + 2] -= 1.8 * dot * nzNorm;

          nx = obs.position.x + nxNorm * (obs.radius + 0.05);
          ny = obs.position.y + nyNorm * (obs.radius + 0.05);
          nz = obs.position.z + nzNorm * (obs.radius + 0.05);
        }
      }

      this.positions[i * 3] = nx;
      this.positions[i * 3 + 1] = ny;
      this.positions[i * 3 + 2] = nz;

      this.energies[i] = 0.5 * (vx * vx + vy * vy + vz * vz);
    }

    // 4. MHD Instabilities
    this.instabilityManager.applyInstabilities(
      this.positions,
      this.velocities,
      this.species,
      this.activeParticleCount,
      this.params,
      effectiveDt
    );

    // 5. Filament Branching Arcs
    this.filamentTracker.updateFilaments(
      this.grid,
      this.electrodes,
      this.params.branchProbability,
      this.params.filamentPersistence,
      effectiveDt
    );

    // 6. Magnetic Reconnection
    const energyBurst = this.reconnectionDetector.detectReconnections(
      this.magneticField,
      this.positions,
      this.velocities,
      this.activeParticleCount,
      this.time
    );
    this.totalEnergyReleased += energyBurst;
  }

  /**
   * User interaction tool: inject charges at position
   */
  public injectCharge(pos: Vector3D, count: number = 500, isPositive: boolean = false): void {
    const newTotal = Math.min(this.maxParticles, this.activeParticleCount + count);
    for (let i = this.activeParticleCount; i < newTotal; i++) {
      this.species[i] = isPositive ? 1 : 0;
      this.positions[i * 3] = pos.x + (Math.random() - 0.5) * 1.5;
      this.positions[i * 3 + 1] = pos.y + (Math.random() - 0.5) * 1.5;
      this.positions[i * 3 + 2] = pos.z + (Math.random() - 0.5) * 1.5;

      const vSpeed = isPositive ? 2.0 : 8.0;
      this.velocities[i * 3] = (Math.random() - 0.5) * vSpeed;
      this.velocities[i * 3 + 1] = (Math.random() - 0.5) * vSpeed;
      this.velocities[i * 3 + 2] = (Math.random() - 0.5) * vSpeed;
      this.energies[i] = vSpeed * vSpeed;
    }
    this.activeParticleCount = newTotal;
  }

  /**
   * User interaction tool: explosive energy burst
   */
  public triggerExplosion(pos: Vector3D, energy: number = 30): void {
    const radiusSq = 4.5 * 4.5;
    for (let i = 0; i < this.activeParticleCount; i++) {
      const dx = this.positions[i * 3] - pos.x;
      const dy = this.positions[i * 3 + 1] - pos.y;
      const dz = this.positions[i * 3 + 2] - pos.z;
      const dSq = dx * dx + dy * dy + dz * dz;

      if (dSq < radiusSq && dSq > 0.01) {
        const dist = Math.sqrt(dSq);
        const force = ((1 - dist / 4.5) * energy) / dist;

        this.velocities[i * 3] += dx * force;
        this.velocities[i * 3 + 1] += dy * force;
        this.velocities[i * 3 + 2] += dz * force;
      }
    }
    this.totalEnergyReleased += energy * 5;
  }

  /**
   * User interaction tool: erase particles in sphere
   */
  public eraseParticles(pos: Vector3D, radius: number = 3.0): void {
    const rSq = radius * radius;
    let writeIdx = 0;

    for (let readIdx = 0; readIdx < this.activeParticleCount; readIdx++) {
      const dx = this.positions[readIdx * 3] - pos.x;
      const dy = this.positions[readIdx * 3 + 1] - pos.y;
      const dz = this.positions[readIdx * 3 + 2] - pos.z;

      if (dx * dx + dy * dy + dz * dz >= rSq) {
        if (writeIdx !== readIdx) {
          this.positions[writeIdx * 3] = this.positions[readIdx * 3];
          this.positions[writeIdx * 3 + 1] = this.positions[readIdx * 3 + 1];
          this.positions[writeIdx * 3 + 2] = this.positions[readIdx * 3 + 2];

          this.velocities[writeIdx * 3] = this.velocities[readIdx * 3];
          this.velocities[writeIdx * 3 + 1] = this.velocities[readIdx * 3 + 1];
          this.velocities[writeIdx * 3 + 2] = this.velocities[readIdx * 3 + 2];

          this.species[writeIdx] = this.species[readIdx];
          this.energies[writeIdx] = this.energies[readIdx];
        }
        writeIdx++;
      }
    }
    this.activeParticleCount = writeIdx;
  }

  /**
   * Calculate live diagnostic stats
   */
  public getDiagnosticStats(fps: number): DiagnosticStats {
    let eCount = 0;
    let iCount = 0;
    let totalEnergy = 0;

    for (let i = 0; i < this.activeParticleCount; i++) {
      if (this.species[i] === 0) eCount++;
      else iCount++;
      totalEnergy += this.energies[i];
    }

    const avgE = this.activeParticleCount > 0 ? (totalEnergy / this.activeParticleCount) * 12.5 : 0;
    const tempK = avgE * 11604; // 1 eV ~ 11,604 K

    let maxE = 0;
    for (let i = 0; i < this.grid.size; i += 4) {
      const ex = this.grid.eFieldX[i];
      const ey = this.grid.eFieldY[i];
      const ez = this.grid.eFieldZ[i];
      const em = ex * ex + ey * ey + ez * ez;
      if (em > maxE) maxE = em;
    }

    let totalFilamentLength = 0;
    for (const f of this.filamentTracker.filaments) {
      totalFilamentLength += f.nodes.length * 0.4;
    }
    const avgFilamentLen =
      this.filamentTracker.filaments.length > 0
        ? totalFilamentLength / this.filamentTracker.filaments.length
        : 0;

    return {
      particleCount: this.activeParticleCount,
      electronCount: eCount,
      ionCount: iCount,
      avgEnergy: Number(avgE.toFixed(2)),
      maxEField: Number((Math.sqrt(maxE) * 100).toFixed(1)),
      maxBField: Number(this.params.magneticFieldStrength.toFixed(2)),
      plasmaTemp: Math.round(tempK),
      plasmaDensity: Math.round(this.activeParticleCount * 1.5e14),
      filamentCount: this.filamentTracker.filaments.length,
      avgFilamentLength: Number(avgFilamentLen.toFixed(1)),
      energyReleased: Number(this.totalEnergyReleased.toFixed(1)),
      fps: Math.round(fps),
      instabilityIndex: Number((this.params.kinkInstability + this.params.sausageInstability + this.params.turbulence).toFixed(2)),
    };
  }

  public setParticleCount(newCount: number): void {
    const clamped = Math.max(1000, Math.min(this.maxParticles, newCount));
    if (clamped > this.activeParticleCount) {
      this.injectCharge({ x: 0, y: 0, z: 0 }, clamped - this.activeParticleCount, false);
    } else {
      this.activeParticleCount = clamped;
    }
    this.params.particleCount = clamped;
  }
}
