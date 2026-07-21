import type { Electrode, Vector3D } from '../types/plasma';

export class FieldGrid {
  public dimX: number;
  public dimY: number;
  public dimZ: number;
  public size: number;
  public boxSize: number; // Half-width of physical domain (-boxSize to +boxSize)

  public chargeDensity: Float32Array;
  public potential: Float32Array;
  public eFieldX: Float32Array;
  public eFieldY: Float32Array;
  public eFieldZ: Float32Array;
  public currentX: Float32Array;
  public currentY: Float32Array;
  public currentZ: Float32Array;

  private dx: number;

  constructor(gridDim: number = 32, boxSize: number = 10) {
    this.dimX = gridDim;
    this.dimY = gridDim;
    this.dimZ = gridDim;
    this.size = gridDim * gridDim * gridDim;
    this.boxSize = boxSize;
    this.dx = (2 * boxSize) / (gridDim - 1);

    this.chargeDensity = new Float32Array(this.size);
    this.potential = new Float32Array(this.size);
    this.eFieldX = new Float32Array(this.size);
    this.eFieldY = new Float32Array(this.size);
    this.eFieldZ = new Float32Array(this.size);
    this.currentX = new Float32Array(this.size);
    this.currentY = new Float32Array(this.size);
    this.currentZ = new Float32Array(this.size);
  }

  public getIndex(i: number, j: number, k: number): number {
    return i + j * this.dimX + k * this.dimX * this.dimY;
  }

  public clearGrid(): void {
    this.chargeDensity.fill(0);
    this.currentX.fill(0);
    this.currentY.fill(0);
    this.currentZ.fill(0);
  }

  /**
   * Deposit particle charges onto 3D grid using Cloud-in-Cell (CIC) trilinear weighting
   */
  public depositCharges(
    positions: Float32Array,
    species: Uint8Array,
    velocities: Float32Array,
    activeCount: number,
    baseElectronCharge: number = -1.0,
    baseIonCharge: number = 1.0
  ): void {
    this.clearGrid();
    const halfBox = this.boxSize;
    const gridDim = this.dimX;
    const invDx = 1.0 / this.dx;

    for (let p = 0; p < activeCount; p++) {
      const px = positions[p * 3];
      const py = positions[p * 3 + 1];
      const pz = positions[p * 3 + 2];

      const charge = species[p] === 0 ? baseElectronCharge : baseIonCharge;

      // Map physical coords to grid indices [0, gridDim-1]
      const gx = (px + halfBox) * invDx;
      const gy = (py + halfBox) * invDx;
      const gz = (pz + halfBox) * invDx;

      const i = Math.floor(gx);
      const j = Math.floor(gy);
      const k = Math.floor(gz);

      if (i < 0 || i >= gridDim - 1 || j < 0 || j >= gridDim - 1 || k < 0 || k >= gridDim - 1) {
        continue;
      }

      const fx = gx - i;
      const fy = gy - j;
      const fz = gz - k;

      const w000 = (1 - fx) * (1 - fy) * (1 - fz);
      const w100 = fx * (1 - fy) * (1 - fz);
      const w010 = (1 - fx) * fy * (1 - fz);
      const w110 = fx * fy * (1 - fz);
      const w001 = (1 - fx) * (1 - fy) * fz;
      const w101 = fx * (1 - fy) * fz;
      const w011 = (1 - fx) * fy * fz;
      const w111 = fx * fy * fz;

      // Charge deposition
      this.chargeDensity[this.getIndex(i, j, k)] += charge * w000;
      this.chargeDensity[this.getIndex(i + 1, j, k)] += charge * w100;
      this.chargeDensity[this.getIndex(i, j + 1, k)] += charge * w010;
      this.chargeDensity[this.getIndex(i + 1, j + 1, k)] += charge * w110;
      this.chargeDensity[this.getIndex(i, j, k + 1)] += charge * w001;
      this.chargeDensity[this.getIndex(i + 1, j, k + 1)] += charge * w101;
      this.chargeDensity[this.getIndex(i, j + 1, k + 1)] += charge * w011;
      this.chargeDensity[this.getIndex(i + 1, j + 1, k + 1)] += charge * w111;

      // Current deposition J = q * v
      const vx = velocities[p * 3];
      const vy = velocities[p * 3 + 1];
      const vz = velocities[p * 3 + 2];

      const idx000 = this.getIndex(i, j, k);
      this.currentX[idx000] += charge * vx * w000;
      this.currentY[idx000] += charge * vy * w000;
      this.currentZ[idx000] += charge * vz * w000;
    }
  }

  /**
   * Solve Poisson equation \nabla^2 \Phi = -\rho / \epsilon_0 via Red-Black SOR
   */
  public solvePotential(electrodes: Electrode[], iterations: number = 8, omega: number = 1.4): void {
    const dim = this.dimX;
    const invDx2 = 1.0 / (this.dx * this.dx);
    const factor = 1.0 / 6.0;

    // Apply electrode boundary conditions
    const mask = new Uint8Array(this.size);
    const halfBox = this.boxSize;
    const invDx = 1.0 / this.dx;

    for (const el of electrodes) {
      const gx = (el.position.x + halfBox) * invDx;
      const gy = (el.position.y + halfBox) * invDx;
      const gz = (el.position.z + halfBox) * invDx;
      const rGrid = Math.max(1, Math.round(el.radius * invDx));

      const iMin = Math.max(0, Math.floor(gx - rGrid));
      const iMax = Math.min(dim - 1, Math.ceil(gx + rGrid));
      const jMin = Math.max(0, Math.floor(gy - rGrid));
      const jMax = Math.min(dim - 1, Math.ceil(gy + rGrid));
      const kMin = Math.max(0, Math.floor(gz - rGrid));
      const kMax = Math.min(dim - 1, Math.ceil(gz + rGrid));

      for (let i = iMin; i <= iMax; i++) {
        for (let j = jMin; j <= jMax; j++) {
          for (let k = kMin; k <= kMax; k++) {
            const dx = i - gx;
            const dy = j - gy;
            const dz = k - gz;
            if (dx * dx + dy * dy + dz * dz <= rGrid * rGrid) {
              const idx = this.getIndex(i, j, k);
              this.potential[idx] = el.voltage;
              mask[idx] = 1;
            }
          }
        }
      }
    }

    // SOR Iterations
    for (let iter = 0; iter < iterations; iter++) {
      for (let pass = 0; pass < 2; pass++) {
        for (let k = 1; k < dim - 1; k++) {
          for (let j = 1; j < dim - 1; j++) {
            const iStart = 1 + ((j + k + pass) % 2);
            for (let i = iStart; i < dim - 1; i += 2) {
              const idx = this.getIndex(i, j, k);
              if (mask[idx] === 1) continue;

              const sumNeighbors =
                this.potential[this.getIndex(i + 1, j, k)] +
                this.potential[this.getIndex(i - 1, j, k)] +
                this.potential[this.getIndex(i, j + 1, k)] +
                this.potential[this.getIndex(i, j - 1, k)] +
                this.potential[this.getIndex(i, j, k + 1)] +
                this.potential[this.getIndex(i, j, k - 1)];

              const rho = this.chargeDensity[idx];
              const phiNew = factor * (sumNeighbors + rho * invDx2);

              this.potential[idx] += omega * (phiNew - this.potential[idx]);
            }
          }
        }
      }
    }

    this.calculateElectricField();
  }

  /**
   * Compute E = -\nabla \Phi using central finite difference
   */
  public calculateElectricField(): void {
    const dim = this.dimX;
    const inv2Dx = 0.5 / this.dx;

    for (let k = 1; k < dim - 1; k++) {
      for (let j = 1; j < dim - 1; j++) {
        for (let i = 1; i < dim - 1; i++) {
          const idx = this.getIndex(i, j, k);

          const dPhiX = this.potential[this.getIndex(i + 1, j, k)] - this.potential[this.getIndex(i - 1, j, k)];
          const dPhiY = this.potential[this.getIndex(i, j + 1, k)] - this.potential[this.getIndex(i, j - 1, k)];
          const dPhiZ = this.potential[this.getIndex(i, j, k + 1)] - this.potential[this.getIndex(i, j, k - 1)];

          this.eFieldX[idx] = -dPhiX * inv2Dx;
          this.eFieldY[idx] = -dPhiY * inv2Dx;
          this.eFieldZ[idx] = -dPhiZ * inv2Dx;
        }
      }
    }
  }

  /**
   * Trilinear interpolation of Electric Field at position (x, y, z)
   */
  public sampleEField(x: number, y: number, z: number, out: Vector3D): void {
    const halfBox = this.boxSize;
    const gridDim = this.dimX;
    const invDx = 1.0 / this.dx;

    const gx = (x + halfBox) * invDx;
    const gy = (y + halfBox) * invDx;
    const gz = (z + halfBox) * invDx;

    let i = Math.floor(gx);
    let j = Math.floor(gy);
    let k = Math.floor(gz);

    i = Math.max(0, Math.min(gridDim - 2, i));
    j = Math.max(0, Math.min(gridDim - 2, j));
    k = Math.max(0, Math.min(gridDim - 2, k));

    const fx = Math.max(0, Math.min(1, gx - i));
    const fy = Math.max(0, Math.min(1, gy - j));
    const fz = Math.max(0, Math.min(1, gz - k));

    const interpolate = (field: Float32Array): number => {
      const v000 = field[this.getIndex(i, j, k)];
      const v100 = field[this.getIndex(i + 1, j, k)];
      const v010 = field[this.getIndex(i, j + 1, k)];
      const v110 = field[this.getIndex(i + 1, j + 1, k)];
      const v001 = field[this.getIndex(i, j, k + 1)];
      const v101 = field[this.getIndex(i + 1, j, k + 1)];
      const v011 = field[this.getIndex(i, j + 1, k + 1)];
      const v111 = field[this.getIndex(i + 1, j + 1, k + 1)];

      return (
        v000 * (1 - fx) * (1 - fy) * (1 - fz) +
        v100 * fx * (1 - fy) * (1 - fz) +
        v010 * (1 - fx) * fy * (1 - fz) +
        v110 * fx * fy * (1 - fz) +
        v001 * (1 - fx) * (1 - fy) * fz +
        v101 * fx * (1 - fy) * fz +
        v011 * (1 - fx) * fy * fz +
        v111 * fx * fy * fz
      );
    };

    out.x = interpolate(this.eFieldX);
    out.y = interpolate(this.eFieldY);
    out.z = interpolate(this.eFieldZ);
  }
}
