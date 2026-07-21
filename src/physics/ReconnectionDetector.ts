import type { Vector3D } from '../types/plasma';
import { MagneticField } from './MagneticField';

export interface ReconnectionEvent {
  position: Vector3D;
  energyReleased: number;
  time: number;
}

export class ReconnectionDetector {
  public activeEvents: ReconnectionEvent[] = [];

  private sampleB1: Vector3D = { x: 0, y: 0, z: 0 };
  private sampleB2: Vector3D = { x: 0, y: 0, z: 0 };

  /**
   * Scans spatial domain for magnetic reconnection (anti-parallel field shear + current sheet)
   */
  public detectReconnections(
    magneticField: MagneticField,
    positions: Float32Array,
    velocities: Float32Array,
    activeCount: number,
    time: number
  ): number {
    let totalEnergyReleased = 0;

    // Decay old visual events
    for (let i = this.activeEvents.length - 1; i >= 0; i--) {
      if (time - this.activeEvents[i].time > 0.4) {
        this.activeEvents.splice(i, 1);
      }
    }

    // Sample opposing magnetic field vectors along current sheet
    if (magneticField.fieldType === 'dipole' || magneticField.fieldType === 'tokamak') {
      const testRadius = 4.0;
      const testPoints = [
        { p1: { x: -testRadius, y: 0, z: 0 }, p2: { x: testRadius, y: 0, z: 0 } },
        { p1: { x: 0, y: -testRadius, z: 0 }, p2: { x: 0, y: testRadius, z: 0 } },
        { p1: { x: 0, y: 0, z: -testRadius }, p2: { x: 0, y: 0, z: testRadius } },
      ];

      for (const pair of testPoints) {
        magneticField.sampleBField(pair.p1.x, pair.p1.y, pair.p1.z, this.sampleB1);
        magneticField.sampleBField(pair.p2.x, pair.p2.y, pair.p2.z, this.sampleB2);

        // Dot product < 0 means anti-parallel B-field vectors
        const dotB =
          this.sampleB1.x * this.sampleB2.x +
          this.sampleB1.y * this.sampleB2.y +
          this.sampleB1.z * this.sampleB2.z;

        if (dotB < -0.3 && Math.random() < 0.12 && this.activeEvents.length < 5) {
          const energy = Math.abs(dotB) * 15.0;
          totalEnergyReleased += energy;

          const eventPos: Vector3D = {
            x: (pair.p1.x + pair.p2.x) * 0.5 + (Math.random() - 0.5) * 2,
            y: (pair.p1.y + pair.p2.y) * 0.5 + (Math.random() - 0.5) * 2,
            z: (pair.p1.z + pair.p2.z) * 0.5 + (Math.random() - 0.5) * 2,
          };

          this.activeEvents.push({
            position: eventPos,
            energyReleased: energy,
            time: time,
          });

          // Accelerate nearby particles explosively
          this.accelerateParticlesNear(eventPos, positions, velocities, activeCount, energy);
        }
      }
    }

    return totalEnergyReleased;
  }

  private accelerateParticlesNear(
    center: Vector3D,
    positions: Float32Array,
    velocities: Float32Array,
    activeCount: number,
    energy: number
  ): void {
    const radiusSq = 3.5 * 3.5;
    for (let i = 0; i < activeCount; i++) {
      const dx = positions[i * 3] - center.x;
      const dy = positions[i * 3 + 1] - center.y;
      const dz = positions[i * 3 + 2] - center.z;

      const distSq = dx * dx + dy * dy + dz * dz;
      if (distSq < radiusSq && distSq > 0.01) {
        const factor = (1.0 - distSq / radiusSq) * (energy * 0.4);
        const dist = Math.sqrt(distSq);

        velocities[i * 3] += (dx / dist) * factor;
        velocities[i * 3 + 1] += (dy / dist) * factor;
        velocities[i * 3 + 2] += (dz / dist) * factor;
      }
    }
  }
}
