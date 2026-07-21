import type { Electrode, FilamentBranch, Vector3D } from '../types/plasma';
import { FieldGrid } from './FieldGrid';

export class FilamentTracker {
  public filaments: FilamentBranch[] = [];
  private nextBranchId: number = 1;

  /**
   * Update active filaments: decay existing, update nodes, and generate dynamic arcs
   */
  public updateFilaments(
    grid: FieldGrid,
    electrodes: Electrode[],
    branchProb: number,
    persistence: number,
    dt: number
  ): void {
    // 1. Age and remove expired filaments
    for (let i = this.filaments.length - 1; i >= 0; i--) {
      const f = this.filaments[i];
      f.age += dt;
      f.intensity *= Math.pow(persistence, dt * 10);
      if (f.age >= f.maxAge || f.intensity < 0.05) {
        this.filaments.splice(i, 1);
      }
    }

    // 2. Generate new dynamic electric arcs between electrodes or potential peaks
    if (electrodes.length >= 2 && Math.random() < branchProb * 0.4) {
      const anode = electrodes.find((e) => e.charge > 0) || electrodes[0];
      const cathode = electrodes.find((e) => e.charge < 0) || electrodes[electrodes.length - 1];

      if (anode && cathode && anode !== cathode) {
        this.generateArcBetween(anode.position, cathode.position, Math.abs(anode.voltage - cathode.voltage));
      }
    }

    // 3. Spontaneous internal discharge channels in high charge density grid nodes
    if (Math.random() < branchProb * 0.25 && this.filaments.length < 16) {
      this.generateSpontaneousFilament(grid);
    }
  }

  /**
   * Generate dynamic branching dielectric breakdown arc between start and end positions
   */
  public generateArcBetween(start: Vector3D, end: Vector3D, voltageDiff: number): void {
    const steps = 14 + Math.floor(Math.random() * 10);
    const mainNodes: Vector3D[] = [];

    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const dz = end.z - start.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (dist < 0.5) return;

    let current = { ...start };
    mainNodes.push({ ...current });

    const mainIntensity = Math.min(1.5, 0.4 + voltageDiff * 0.015);

    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      // Target straight line interpolate
      const targetX = start.x + dx * t;
      const targetY = start.y + dy * t;
      const targetZ = start.z + dz * t;

      // Add dielectric fractal jitter proportional to distance
      const jitterScale = 0.22 * dist * (1 - Math.abs(t - 0.5));
      const jx = (Math.random() - 0.5) * jitterScale;
      const jy = (Math.random() - 0.5) * jitterScale;
      const jz = (Math.random() - 0.5) * jitterScale;

      current = {
        x: targetX + jx,
        y: targetY + jy,
        z: targetZ + jz,
      };
      mainNodes.push(current);

      // Random side branching (35% chance)
      if (Math.random() < 0.35 && i > 2 && i < steps - 2 && this.filaments.length < 24) {
        this.generateSideBranch(current, dx, dy, dz, mainIntensity * 0.6);
      }
    }

    this.filaments.push({
      id: `arc-${this.nextBranchId++}`,
      nodes: mainNodes,
      intensity: mainIntensity,
      age: 0,
      maxAge: 0.15 + Math.random() * 0.25,
    });
  }

  private generateSideBranch(
    startNode: Vector3D,
    dirX: number,
    dirY: number,
    dirZ: number,
    intensity: number
  ): void {
    const branchSteps = 5 + Math.floor(Math.random() * 6);
    const branchNodes: Vector3D[] = [{ ...startNode }];

    let curr = { ...startNode };
    const angle = (Math.random() - 0.5) * Math.PI * 0.8;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    const bx = dirX * cosA - dirY * sinA;
    const by = dirX * sinA + dirY * cosA;
    const bz = dirZ + (Math.random() - 0.5) * 2;
    const bLen = Math.sqrt(bx * bx + by * by + bz * bz) || 1;

    const stepLen = 0.3 + Math.random() * 0.4;

    for (let s = 1; s <= branchSteps; s++) {
      curr = {
        x: curr.x + (bx / bLen) * stepLen + (Math.random() - 0.5) * 0.35,
        y: curr.y + (by / bLen) * stepLen + (Math.random() - 0.5) * 0.35,
        z: curr.z + (bz / bLen) * stepLen + (Math.random() - 0.5) * 0.35,
      };
      branchNodes.push(curr);
    }

    this.filaments.push({
      id: `branch-${this.nextBranchId++}`,
      nodes: branchNodes,
      intensity: intensity,
      age: 0,
      maxAge: 0.1 + Math.random() * 0.15,
    });
  }

  private generateSpontaneousFilament(grid: FieldGrid): void {
    const dim = grid.dimX;
    const halfBox = grid.boxSize;
    const dx = (2 * halfBox) / (dim - 1);

    let maxVal = 0;
    let maxI = -1,
      maxJ = -1,
      maxK = -1;

    for (let k = 2; k < dim - 2; k += 2) {
      for (let j = 2; j < dim - 2; j += 2) {
        for (let i = 2; i < dim - 2; i += 2) {
          const idx = grid.getIndex(i, j, k);
          const rho = Math.abs(grid.chargeDensity[idx]);
          if (rho > maxVal) {
            maxVal = rho;
            maxI = i;
            maxJ = j;
            maxK = k;
          }
        }
      }
    }

    if (maxVal < 1.5 || maxI === -1) return;

    const startX = -halfBox + maxI * dx;
    const startY = -halfBox + maxJ * dx;
    const startZ = -halfBox + maxK * dx;

    const ex = grid.eFieldX[grid.getIndex(maxI, maxJ, maxK)];
    const ey = grid.eFieldY[grid.getIndex(maxI, maxJ, maxK)];
    const ez = grid.eFieldZ[grid.getIndex(maxI, maxJ, maxK)];
    const eLen = Math.sqrt(ex * ex + ey * ey + ez * ez) || 1;

    const endX = startX + (ex / eLen) * 3.5;
    const endY = startY + (ey / eLen) * 3.5;
    const endZ = startZ + (ez / eLen) * 3.5;

    this.generateArcBetween({ x: startX, y: startY, z: startZ }, { x: endX, y: endY, z: endZ }, maxVal * 20);
  }
}
