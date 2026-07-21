# ⚡ Plasma Filament Simulation Lab

A state-of-the-art interactive WebGL 3D simulation of plasma filament formation, electromagnetic particle interactions, ionized gas dynamics, dielectric breakdown electric arcs, magnetic confinement, plasma instabilities (kink & sausage modes), and magnetic reconnection events.

![Plasma Filament Simulation](https://raw.githubusercontent.com/MdKasif0/Plasma_Filament_Simulation/main/public/plasma-preview.png)

---

## 🔬 Physics Engine & Numerical Models

The application implements a hybrid **Particle-In-Cell (PIC)** numerical model combined with a 3D grid-based electromagnetic potential solver:

* **Dual-Species Dynamics**:
  * **Electrons**: negative charge, low mass ($m_e$), high kinetic mobility, fast thermal velocities.
  * **Positive Ions**: positive charge, heavy mass ($m_i = 100 m_e$), low mobility background drift.
* **3D Field Solver**:
  * **Cloud-In-Cell (CIC)** charge deposition onto a $32 \times 32 \times 32$ spatial grid.
  * **Successive Over-Relaxation (SOR)** 3D Poisson potential solver ($\nabla^2 \Phi = -\rho / \epsilon_0$).
  * Central difference electric field solver ($E = -\nabla \Phi$).
* **Boris Integrator**:
  * Exact Boris velocity pusher algorithm for relativistic/non-relativistic Lorentz force integration ($F = q(E + v \times B)$), preserving exact kinetic energy under magnetic gyro-rotation.
* **Magnetohydrodynamic (MHD) Instabilities**:
  * **Kink Mode ($m=1$)**: Helical displacement of current channels.
  * **Sausage Mode ($m=0$)**: Radial necking instabilities along current pinches (Z-pinch).
  * **Turbulent Eddies**: Stochastic velocity perturbations.
  * **Magnetic Reconnection**: Anti-parallel field line snapping releasing explosive kinetic energy bursts ($Joules$).
* **Dielectric Breakdown Branching Arcs**:
  * Laplacian growth branching electric discharge trees connecting electrodes and high charge-density nodes.

---

## 🎨 High-Performance WebGL Shader Pipeline

* **100,000+ Particles at 60–150+ FPS**: Custom GLSL ShaderMaterials with velocity vector motion blur streaks, kinetic energy color palette mapping (Deep Blue $\rightarrow$ Electric Cyan $\rightarrow$ Violet $\rightarrow$ Hot Pink $\rightarrow$ White), and Gaussian soft glow falloff.
* **Cinematic HDR Post-Processing**: Multi-pass Bloom (HDR energy diffusion), Chromatic Aberration, and Vignette.

---

## 🚀 Built-in Scientific Presets

1. **Tokamak Fusion Reactor**: Toroidal magnetic confinement with helical flux surfaces and internal kink mode oscillations.
2. **Solar Flare & Corona**: Dipole magnetic coronal loops with spontaneous reconnection flares and particle jets.
3. **Z-Pinch Discharge**: High-current longitudinal discharge exhibiting severe sausage ($m=0$) instabilities.
4. **Aurora Borealis**: Energetic electron cascade spiraling down polar dipole field lines.
5. **Corona Electric Arcs**: High-voltage dielectric breakdown generating multi-branching neon arcs.
6. **Plasma Globe**: Low-pressure RF electrode discharge with mobile filaments.
7. **Magnetosphere Storm**: Planetary magnetotail current sheet reconnection.
8. **Cosmic Nebula Plasma**: Cosmic turbulent cloud with self-organizing charge filaments.

---

## 🛠️ Interactive Tools & Overlays

* **Interactive Canvas Tools**: Inject Plasma, Place Anode (+), Place Cathode (-), Add Dipole Magnet, Place Dielectric Obstacle, Trigger Energy Explosion, Vacuum Eraser.
* **Educational Overlays**: 3D $E$-field vector arrows, 3D $B$-field vector arrows, Equipotential plane slicer map, Volumetric density cloud heatmap, Magnetic flux streamlines.
* **Real-time Diagnostic Dashboard**: Telemetry monitoring FPS, particle breakdown, plasma temperature ($K$), average energy ($eV$), max field strengths ($V/m$, $T$), active filament count, and reconnection energy.

---

## 💻 Tech Stack

* **Framework**: React 18, TypeScript, Vite
* **3D & WebGL**: Three.js, `@react-three/fiber`, `@react-three/drei`, GLSL Shaders
* **Post-Processing**: `@react-three/postprocessing` (Bloom, Chromatic Aberration)
* **Styling**: Tailwind CSS v4, Lucide React Icons

---

## ⚙️ Local Development Setup

```bash
# Clone repository
git clone https://github.com/MdKasif0/Plasma_Filament_Simulation.git
cd Plasma_Filament_Simulation

# Install dependencies
npm install

# Start local dev server
npm run dev

# Build production bundle
npm run build
```

---

## 📄 License

MIT License. Developed for advanced scientific plasma visualization.
