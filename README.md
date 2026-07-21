# ⚡ Plasma Filament Lab: 3D Particle-In-Cell (PIC) Simulation

[![Live Demo](https://img.shields.io/badge/Live_Demo-Netlify-00C7B7?style=for-the-badge&logo=netlify)](https://plasma-filament-simulation.netlify.app/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Three.js](https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org/)
[![WebGL2](https://img.shields.io/badge/WebGL2-990000?style=for-the-badge&logo=webgl&logoColor=white)](https://www.khronos.org/registry/webgl/)

> **Live Application URL**: [https://plasma-filament-simulation.netlify.app/](https://plasma-filament-simulation.netlify.app/)

An advanced, publication-grade interactive 3D web application simulating plasma filamentation, electromagnetic wave-particle interactions, ionized gas kinetic dynamics, dielectric breakdown branching electric arcs, magnetic confinement, magnetohydrodynamic (MHD) instabilities, and magnetic reconnection events.

Designed to mirror high-performance computational plasma physics research software while maintaining 60–150+ FPS real-time WebGL performance in modern web browsers.

---

## 🔬 Physics Engine & Mathematical Architecture

The simulation is driven by an un-scripted, emergent **Particle-In-Cell (PIC)** numerical model combined with 3D grid-based electromagnetic field solvers:

```
+-----------------------------------------------------------------------+
|                         PLASMA SIMULATION LOOP                        |
|                                                                       |
|   1. Particle Advection x(n+1) = x(n) + v(n+1/2) * dt                 |
|   2. CIC Charge Deposition -> Grid Charge Density \rho(i,j,k)        |
|   3. Red-Black SOR Potential Solve \nabla^2 \Phi = -\rho / \epsilon_0 |
|   4. Central Finite Difference E-Field E = -\nabla \Phi              |
|   5. Sample B-Field B(r) (Uniform / Dipole / Tokamak / Rotating)      |
|   6. Exact Boris Push v(n+1/2) = BorisPush(v(n-1/2), E, B, dt)       |
|   7. MHD Instabilities (Kink Mode m=1, Sausage Mode m=0, Turbulence)   |
|   8. Dielectric Arc Branching & Reconnection Burst Detection          |
+-----------------------------------------------------------------------+
```

### 1. Kinetic Dual-Species Model
- **Electrons ($e^-$)**: Negative charge ($q_e = -1.0$), low mass ($m_e = 1.0$), high mobility, rapid kinetic acceleration.
- **Positive Ions ($\text{Ion}^+$)**: Positive charge ($q_i = +1.0$), heavy mass ($m_i = 100.0 m_e$), low mobility thermal drift background.

### 2. Cloud-In-Cell (CIC) Charge Deposition
Particle charges are deposited onto a $32 \times 32 \times 32$ spatial grid using trilinear volume-weighting interpolation functions:
$$\rho_{i,j,k} = \sum_{p} q_p (1 - f_x)(1 - f_y)(1 - f_z)$$

### 3. 3D Potential & Electric Field Solver
Solves Poisson's equation for electrostatic potential $\Phi$:
$$\nabla^2 \Phi = -\frac{\rho}{\epsilon_0}$$
using Dirichlet boundary conditions on electrodes solved via **Red-Black Successive Over-Relaxation (SOR)** iterations:
$$\Phi_{i,j,k}^{(new)} = (1 - \omega)\Phi_{i,j,k}^{(old)} + \frac{\omega}{6} \left[ \sum_{\text{neighbors}} \Phi + \Delta x^2 \frac{\rho_{i,j,k}}{\epsilon_0} \right]$$
The local electric field is calculated via central finite difference:
$$\vec{E} = -\nabla \Phi \implies E_x(i,j,k) = -\frac{\Phi_{i+1,j,k} - \Phi_{i-1,j,k}}{2 \Delta x}$$

### 4. Relativistic Boris Velocity Integrator
Exact integration of the Lorentz force $\vec{F} = q(\vec{E} + \vec{v} \times \vec{B})$ without artificial numerical energy dissipation:
1. $\vec{v}^- = \vec{v}^{n-1/2} + \frac{q \vec{E}}{m} \frac{\Delta t}{2}$
2. $\vec{t} = \frac{q \vec{B}}{m} \frac{\Delta t}{2}$
3. $\vec{v}' = \vec{v}^- + \vec{v}^- \times \vec{t}$
4. $\vec{s} = \frac{2 \vec{t}}{1 + t^2}$
5. $\vec{v}^+ = \vec{v}^- + \vec{v}' \times \vec{s}$
6. $\vec{v}^{n+1/2} = \vec{v}^+ + \frac{q \vec{E}}{m} \frac{\Delta t}{2}$

### 5. Magnetohydrodynamic (MHD) Instabilities
- **Kink Mode ($m=1$)**: Helical displacement force $\vec{F}_{\text{kink}} \propto A \cos(k z - \omega t) \hat{i} + A \sin(k z - \omega t) \hat{j}$.
- **Sausage Mode ($m=0$)**: Periodic longitudinal pinch force $\vec{F}_{\text{sausage}} \propto A \cos(k z - \omega t) \hat{r}$.
- **Turbulent Eddies**: Stochastic Kolmogorov-inspired vortex velocity injection.

### 6. Magnetic Reconnection Explosions
Scans spatial magnetic field shears for anti-parallel vector alignments ($\vec{B}_1 \cdot \vec{B}_2 < -0.3$). Triggers explosive magnetic potential energy conversion into kinetic particle acceleration jets.

---

## 📂 Codebase Architecture & Key Functions

### Physics Solver Core (`/src/physics/`)

* **`PlasmaEngine.ts`**: Master simulation orchestrator.
  - `initializeParticles()`: Distributes positions & Maxwell-Boltzmann thermal velocities.
  - `step(dt)`: Executes the full PIC step loop (deposit, solve potential, Boris push, instabilities, filaments, reconnection).
  - `injectCharge(pos, count, isPositive)`: Injects electron or ion clusters at target coordinates.
  - `triggerExplosion(pos, energy)`: Radial shockwave velocity acceleration.
  - `eraseParticles(pos, radius)`: Spatial particle vacuum eraser.
  - `getDiagnosticStats(fps)`: Computes live physical metrics ($T_k$, $E_{\text{max}}$, $B_{\text{max}}$, $\rho$, energy released).

* **`FieldGrid.ts`**: 3D spatial field memory allocation and solvers.
  - `depositCharges(...)`: 3D Cloud-In-Cell trilinear weighting.
  - `solvePotential(electrodes, iterations, omega)`: Red-Black SOR Poisson solver with fixed voltage electrode masks.
  - `calculateElectricField()`: Central finite-difference gradient.
  - `sampleEField(x, y, z, out)`: Trilinear electric field sampler at continuous coordinates.

* **`BorisIntegrator.ts`**: Lorentz force integrator.
  - `pushVelocity(...)`: Implements exact Boris algorithm for cyclotron gyro-motion around $B$-field vectors.

* **`MagneticField.ts`**: Magnetic field vector evaluators.
  - `sampleBField(x, y, z, out)`: Evaluates field vectors for **Uniform**, **Dipole**, **Tokamak** ($B_{\text{toroidal}} + B_{\text{poloidal}}$), and **Rotating** field geometries.

* **`FilamentTracker.ts`**: Arc topology generator.
  - `updateFilaments(...)`: Ages existing arcs, handles decay, and triggers dielectric breakdown trees.
  - `generateArcBetween(start, end, voltage)`: Dielectric fractal tree generator with randomized lateral branches.

* **`InstabilityManager.ts`**: MHD modes.
  - `applyInstabilities(...)`: Applies helical kink ($m=1$), radial sausage ($m=0$), and turbulent eddy perturbations.

* **`ReconnectionDetector.ts`**: Energy flash triggers.
  - `detectReconnections(...)`: Detects anti-parallel $B$-field shears and accelerates local particles.

---

### WebGL Visualization Components (`/src/visualization/`)

* **`ParticleRenderer.tsx`**: Custom WebGL GLSL ShaderMaterial & dynamic BufferGeometry rendering 100,000+ glowing particles with velocity-dependent motion blur, kinetic energy thermal palettes, and soft Gaussian radial alpha falloff.
* **`FilamentRenderer.tsx`**: Renders branching dielectric electric arcs using dynamic TubeGeometry ribbons with additive energy glow shaders.
* **`VectorFieldOverlay.tsx`**: Renders 3D $E$-field vector arrows, $B$-field vector arrows, and continuous magnetic flux streamlines.
* **`DensityHeatmapOverlay.tsx`**: Renders 2D equipotential slicer planes ($\Phi$) and volumetric density fog spheres.
* **`PostProcessingEffects.tsx`**: Cinematic HDR multi-pass Bloom, Chromatic Aberration, and Vignette.
* **`CanvasContainer.tsx`**: Three.js Canvas container with OrbitControls and 3D raycasting tool interaction.

---

### UI & Dashboard Components (`/src/components/`)

* **`HeaderNav.tsx`**: Top navigation header with title, preset selector, simulation playback (Play / Pause / Step / Reset), and screenshot exporter.
* **`Dashboard.tsx`**: Glassmorphic diagnostic telemetry overlay showing real-time FPS, particle counts, species breakdown, plasma temperature ($K$), average energy ($eV$), field peaks, and filament statistics.
* **`ControlsDrawer.tsx`**: Slide-out drawer with parameters for tuning particle counts, voltage, magnetic field strength, temperature, ionization, MHD instabilities, and bloom.
* **`InteractiveToolbox.tsx`**: Bottom toolbar for switching interactive canvas tools (Camera Orbit, Inject Plasma, Anode, Cathode, Magnet, Dielectric Obstacle, Energy Burst, Vacuum).
* **`EducationalOverlayMenu.tsx`**: Layer visibility toggles for vector fields, potential maps, and field lines.
* **`PresetsModal.tsx`**: Visual card modal for selecting scientific plasma environments.

---

## 🌟 Scientific Presets Matrix

| Preset Name | Physics Focus | Magnetic Field | Key Features |
| :--- | :--- | :--- | :--- |
| **Tokamak Fusion** | Magnetic Confinement | Tokamak ($B_\phi + B_\theta$) | Helical magnetic flux surfaces, internal kink ($m=1$) mode |
| **Solar Flare & Corona** | Magnetic Reconnection | Dipole Field | Coronal loops, explosive magnetic reconnection flares |
| **Z-Pinch Discharge** | High-Current Pinch | Uniform Axial | Longitudinal electric channel, sausage ($m=0$) instability |
| **Aurora Borealis** | Atmospheric Magnetospheric | Dipole Field | Polar magnetic field spiraling, electron cascades |
| **Corona Arcs** | Dielectric Breakdown | None | Multi-branching high-voltage electric discharge trees |
| **Plasma Globe** | RF Glow Discharge | Rotating Field | Central RF electrode, mobile dielectric filaments |
| **Magnetosphere** | Solar Wind Shear | Dipole Field | Magnetotail current sheet reconnection |
| **Nebula Plasma** | Cosmic Ionized Gas | Rotating Field | Cosmic turbulent cloud, self-organizing filaments |

---

## 💻 Tech Stack

* **Frontend**: React 18, TypeScript, Vite
* **3D Rendering**: Three.js, `@react-three/fiber`, `@react-three/drei`, GLSL Custom Shaders
* **Post-Processing**: `@react-three/postprocessing` (Multi-pass Bloom, Chromatic Aberration)
* **Styling**: Tailwind CSS v4, Lucide React Icons
* **Deployment**: Netlify

---

## ⚙️ Local Development Setup

```bash
# Clone the repository
git clone https://github.com/MdKasif0/Plasma_Filament_Simulation.git
cd Plasma_Filament_Simulation

# Install dependencies
npm install

# Start local development server
npm run dev

# Build production bundle
npm run build
```

---

## 🔗 Live Application

The application is deployed and live at:
👉 **[https://plasma-filament-simulation.netlify.app/](https://plasma-filament-simulation.netlify.app/)**

---

## 📄 License

MIT License. Developed for advanced scientific visualization and plasma physics research demonstration.
