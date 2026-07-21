import type { Vector3D } from '../types/plasma';

export class BorisIntegrator {
  /**
   * Pushes velocity v by timestep dt under E and B fields using the exact Boris algorithm.
   */
  public static pushVelocity(
    vx: number,
    vy: number,
    vz: number,
    Ex: number,
    Ey: number,
    Ez: number,
    Bx: number,
    By: number,
    Bz: number,
    qOverM: number,
    dt: number,
    outVel: Vector3D
  ): void {
    const halfDtQOverM = 0.5 * dt * qOverM;

    // Step 1: Half-step E acceleration
    const vMinusX = vx + Ex * halfDtQOverM;
    const vMinusY = vy + Ey * halfDtQOverM;
    const vMinusZ = vz + Ez * halfDtQOverM;

    // Step 2: Calculate rotation vector t
    const tx = Bx * halfDtQOverM;
    const ty = By * halfDtQOverM;
    const tz = Bz * halfDtQOverM;

    const t2 = tx * tx + ty * ty + tz * tz;

    // Step 3: v' = vMinus + vMinus x t
    const vPrimeX = vMinusX + (vMinusY * tz - vMinusZ * ty);
    const vPrimeY = vMinusY + (vMinusZ * tx - vMinusX * tz);
    const vPrimeZ = vMinusZ + (vMinusX * ty - vMinusY * tx);

    // Step 4: s = 2 * t / (1 + t^2)
    const sFactor = 2.0 / (1.0 + t2);
    const sx = tx * sFactor;
    const sy = ty * sFactor;
    const sz = tz * sFactor;

    // Step 5: vPlus = vMinus + vPrime x s
    const vPlusX = vMinusX + (vPrimeY * sz - vPrimeZ * sy);
    const vPlusY = vMinusY + (vPrimeZ * sx - vPrimeX * sz);
    const vPlusZ = vMinusZ + (vPrimeX * sy - vPrimeY * sx);

    // Step 6: Second half-step E acceleration
    outVel.x = vPlusX + Ex * halfDtQOverM;
    outVel.y = vPlusY + Ey * halfDtQOverM;
    outVel.z = vPlusZ + Ez * halfDtQOverM;
  }
}
