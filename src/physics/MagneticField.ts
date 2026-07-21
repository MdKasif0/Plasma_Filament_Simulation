import type { MagneticFieldType, Magnet, Vector3D } from '../types/plasma';

export class MagneticField {
  public fieldType: MagneticFieldType = 'uniform';
  public baseStrength: number = 1.0;
  public magnets: Magnet[] = [];
  public time: number = 0;

  constructor(fieldType: MagneticFieldType = 'uniform', strength: number = 1.0) {
    this.fieldType = fieldType;
    this.baseStrength = strength;
  }

  /**
   * Evaluates magnetic field vector B(r) at point (x, y, z)
   */
  public sampleBField(x: number, y: number, z: number, out: Vector3D): void {
    out.x = 0;
    out.y = 0;
    out.z = 0;

    const B0 = this.baseStrength;
    if (B0 <= 0.0001 && this.magnets.length === 0) return;

    switch (this.fieldType) {
      case 'uniform': {
        // Uniform axial magnetic field along Z axis
        out.z = B0;
        break;
      }

      case 'dipole': {
        if (this.magnets.length > 0) {
          for (const m of this.magnets) {
            const rx = x - m.position.x;
            const ry = y - m.position.y;
            const rz = z - m.position.z;
            const r2 = rx * rx + ry * ry + rz * rz + 0.1;
            const r = Math.sqrt(r2);
            const r3 = r2 * r;

            const mx = m.dipoleMoment.x * m.strength;
            const my = m.dipoleMoment.y * m.strength;
            const mz = m.dipoleMoment.z * m.strength;

            const mDotR = (mx * rx + my * ry + mz * rz) / r;

            out.x += (3 * mDotR * (rx / r) - mx) / r3;
            out.y += (3 * mDotR * (ry / r) - my) / r3;
            out.z += (3 * mDotR * (rz / r) - mz) / r3;
          }
        } else {
          const r2 = x * x + y * y + z * z + 0.5;
          const r = Math.sqrt(r2);
          const r3 = r2 * r;
          const mDotR = (B0 * z) / r;

          out.x = (3 * mDotR * (x / r)) / r3;
          out.y = (3 * mDotR * (y / r)) / r3;
          out.z = (3 * mDotR * (z / r) - B0) / r3;
        }
        break;
      }

      case 'tokamak': {
        const R0 = 6.0;
        const rTor = Math.sqrt(x * x + y * y);
        const phi = Math.atan2(y, x);
        const rPol = Math.sqrt((rTor - R0) * (rTor - R0) + z * z) + 0.1;

        const B_tor = (B0 * R0) / Math.max(1, rTor);
        out.x += -B_tor * Math.sin(phi);
        out.y += B_tor * Math.cos(phi);

        const B_pol = (B0 * 0.35 * rPol) / (1 + rPol * rPol);
        const theta = Math.atan2(z, rTor - R0);

        const B_pol_x = -B_pol * Math.sin(theta) * Math.cos(phi);
        const B_pol_y = -B_pol * Math.sin(theta) * Math.sin(phi);
        const B_pol_z = B_pol * Math.cos(theta);

        out.x += B_pol_x;
        out.y += B_pol_y;
        out.z += B_pol_z;
        break;
      }

      case 'rotating': {
        const omega = 2.0;
        const angle = this.time * omega;
        out.x = B0 * Math.cos(angle);
        out.y = B0 * Math.sin(angle);
        out.z = B0 * 0.2;
        break;
      }

      case 'none':
      default:
        break;
    }

    if (this.fieldType !== 'dipole' && this.magnets.length > 0) {
      for (const m of this.magnets) {
        const rx = x - m.position.x;
        const ry = y - m.position.y;
        const rz = z - m.position.z;
        const r2 = rx * rx + ry * ry + rz * rz + 0.2;
        const r = Math.sqrt(r2);
        const r3 = r2 * r;

        const mx = m.dipoleMoment.x * m.strength;
        const my = m.dipoleMoment.y * m.strength;
        const mz = m.dipoleMoment.z * m.strength;

        const mDotR = (mx * rx + my * ry + mz * rz) / r;

        out.x += (3 * mDotR * (rx / r) - mx) / r3;
        out.y += (3 * mDotR * (ry / r) - my) / r3;
        out.z += (3 * mDotR * (rz / r) - mz) / r3;
      }
    }
  }

  public updateTime(dt: number): void {
    this.time += dt;
  }
}
