import type { PhysicsParameters } from '../types/plasma';

export class InstabilityManager {
  private time: number = 0;

  /**
   * Applies MHD instabilities (kink, sausage, turbulence) to particle arrays
   */
  public applyInstabilities(
    positions: Float32Array,
    velocities: Float32Array,
    _species: Uint8Array,
    activeCount: number,
    params: PhysicsParameters,
    dt: number
  ): void {
    this.time += dt;

    const kink = params.kinkInstability;
    const sausage = params.sausageInstability;
    const turbulence = params.turbulence;

    if (kink <= 0.01 && sausage <= 0.01 && turbulence <= 0.01) return;

    const kWave = 0.6; // Wavenumber
    const omega = 3.5; // Frequency

    for (let i = 0; i < activeCount; i++) {
      const px = positions[i * 3];
      const py = positions[i * 3 + 1];
      const pz = positions[i * 3 + 2];

      const rSq = px * px + py * py;
      const r = Math.sqrt(rSq) + 0.1;

      // 1. Kink Mode (m=1): Helical perturbation force
      if (kink > 0.05) {
        const kinkPhase = kWave * pz - omega * this.time;
        const forceX = kink * 4.0 * Math.cos(kinkPhase);
        const forceY = kink * 4.0 * Math.sin(kinkPhase);

        velocities[i * 3] += forceX * dt;
        velocities[i * 3 + 1] += forceY * dt;
      }

      // 2. Sausage Mode (m=0): Periodic radial necking force
      if (sausage > 0.05) {
        const sausagePhase = kWave * 1.5 * pz - omega * 1.2 * this.time;
        const radialPinch = sausage * 5.0 * Math.cos(sausagePhase);

        // Force directed radially inward/outward
        velocities[i * 3] += (px / r) * radialPinch * dt;
        velocities[i * 3 + 1] += (py / r) * radialPinch * dt;
      }

      // 3. Turbulent Vortex Eddies
      if (turbulence > 0.05 && Math.random() < 0.08) {
        const turbAngle = Math.atan2(py, px) + (Math.random() - 0.5) * 1.5;
        const turbMag = turbulence * (2.0 + Math.random() * 3.0);

        velocities[i * 3] += -Math.sin(turbAngle) * turbMag * dt;
        velocities[i * 3 + 1] += Math.cos(turbAngle) * turbMag * dt;
        velocities[i * 3 + 2] += (Math.random() - 0.5) * turbMag * dt;
      }
    }
  }
}
