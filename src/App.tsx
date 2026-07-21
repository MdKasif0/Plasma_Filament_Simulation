import React, { useMemo, useState } from 'react';
import { PlasmaEngine } from './physics/PlasmaEngine';
import type {
  DiagnosticStats,
  EducationalOverlayConfig,
  InteractionTool,
  PhysicsParameters,
  PresetConfig,
} from './types/plasma';
import { CanvasContainer } from './visualization/CanvasContainer';
import { HeaderNav } from './components/HeaderNav';
import { Dashboard } from './components/Dashboard';
import { ControlsDrawer } from './components/ControlsDrawer';
import { InteractiveToolbox } from './components/InteractiveToolbox';
import { EducationalOverlayMenu } from './components/EducationalOverlayMenu';
import { PresetsModal } from './components/PresetsModal';

const initialPhysicsParams: PhysicsParameters = {
  particleCount: 55000,
  voltage: 600,
  current: 10,
  magneticFieldStrength: 3.5,
  magneticFieldType: 'tokamak',
  electricFieldStrength: 3.0,
  temperature: 12000,
  ionizationRate: 0.9,
  pressure: 0.5,
  turbulence: 0.25,
  branchProbability: 0.45,
  filamentPersistence: 0.65,
  glowIntensity: 0.9,
  simulationSpeed: 1.0,
  timeScale: 1.0,
  collisionRate: 0.1,
  energyLoss: 0.02,
  kinkInstability: 0.3,
  sausageInstability: 0.15,
};

export const App: React.FC = () => {
  // Instantiate Plasma Engine once
  const engine = useMemo(() => new PlasmaEngine(initialPhysicsParams), []);

  const [currentPresetName, setCurrentPresetName] = useState<string>('Tokamak Fusion Reactor');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [activeTool, setActiveTool] = useState<InteractionTool>('select');

  const [showControlsDrawer, setShowControlsDrawer] = useState<boolean>(false);
  const [showOverlaysMenu, setShowOverlaysMenu] = useState<boolean>(false);
  const [showPresetsModal, setShowPresetsModal] = useState<boolean>(false);

  const [overlayConfig, setOverlayConfig] = useState<EducationalOverlayConfig>({
    showEFieldVectors: false,
    showBFieldVectors: false,
    showPotentialMap: false,
    showDensityHeatmap: false,
    showCurrentVectors: false,
    showFilamentSkeleton: false,
    showFieldLines: false,
  });

  const [stats, setStats] = useState<DiagnosticStats>({
    particleCount: 55000,
    electronCount: 41250,
    ionCount: 13750,
    avgEnergy: 120,
    maxEField: 350,
    maxBField: 3.5,
    plasmaTemp: 1390000,
    plasmaDensity: 8.25e18,
    filamentCount: 4,
    avgFilamentLength: 8.5,
    energyReleased: 0,
    fps: 60,
    instabilityIndex: 0.45,
  });

  const handleFPSUpdate = (fps: number) => {
    if (engine) {
      setStats(engine.getDiagnosticStats(fps));
    }
  };

  const handleParamChange = (updated: Partial<PhysicsParameters>) => {
    if (!engine) return;
    Object.assign(engine.params, updated);

    if (updated.particleCount !== undefined) {
      engine.setParticleCount(updated.particleCount);
    }
    setStats(engine.getDiagnosticStats(stats.fps));
  };

  const handleSelectPreset = (preset: PresetConfig) => {
    if (!engine) return;
    setCurrentPresetName(preset.name);

    // Update params
    const merged = { ...initialPhysicsParams, ...preset.params };
    engine.params = merged;
    engine.magneticField.fieldType = merged.magneticFieldType;
    engine.magneticField.baseStrength = merged.magneticFieldStrength;

    // Reset electrodes/magnets/obstacles if provided
    engine.electrodes = preset.electrodes
      ? preset.electrodes.map((e, idx) => ({ ...e, id: `preset-el-${idx}` }))
      : [];

    engine.magnets = preset.magnets
      ? preset.magnets.map((m, idx) => ({ ...m, id: `preset-mag-${idx}` }))
      : [];

    engine.obstacles = preset.obstacles
      ? preset.obstacles.map((o, idx) => ({ ...o, id: `preset-obs-${idx}` }))
      : [];

    engine.setParticleCount(merged.particleCount);
    engine.initializeParticles();
  };

  const handleReset = () => {
    if (!engine) return;
    engine.initializeParticles();
    engine.totalEnergyReleased = 0;
    engine.filamentTracker.filaments = [];
    engine.reconnectionDetector.activeEvents = [];
  };

  const handleStepSimulation = () => {
    if (engine) {
      engine.step(0.016);
      setStats(engine.getDiagnosticStats(stats.fps));
    }
  };

  const handleTakeScreenshot = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `plasma-filament-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#020206] font-sans antialiased text-white">
      {/* Navigation Header */}
      <HeaderNav
        currentPresetName={currentPresetName}
        isPaused={isPaused}
        onTogglePause={() => setIsPaused(!isPaused)}
        onStepSimulation={handleStepSimulation}
        onReset={handleReset}
        onOpenPresets={() => setShowPresetsModal(true)}
        onToggleControls={() => {
          setShowControlsDrawer(!showControlsDrawer);
          if (showOverlaysMenu) setShowOverlaysMenu(false);
        }}
        onToggleOverlays={() => {
          setShowOverlaysMenu(!showOverlaysMenu);
          if (showControlsDrawer) setShowControlsDrawer(false);
        }}
        onTakeScreenshot={handleTakeScreenshot}
        showControlsDrawer={showControlsDrawer}
        showOverlaysMenu={showOverlaysMenu}
      />

      {/* Main 3D Canvas Stage */}
      <CanvasContainer
        engine={engine}
        overlayConfig={overlayConfig}
        activeTool={activeTool}
        isPaused={isPaused}
        onFPSUpdate={handleFPSUpdate}
      />

      {/* Diagnostic Dashboard */}
      <Dashboard stats={stats} />

      {/* Physics Controls Drawer */}
      {showControlsDrawer && (
        <ControlsDrawer
          params={engine.params}
          onChange={handleParamChange}
          onClose={() => setShowControlsDrawer(false)}
        />
      )}

      {/* Educational Overlays Menu */}
      {showOverlaysMenu && (
        <EducationalOverlayMenu
          config={overlayConfig}
          onChange={(updated) => setOverlayConfig({ ...overlayConfig, ...updated })}
          onClose={() => setShowOverlaysMenu(false)}
        />
      )}

      {/* Interactive Toolbar */}
      <InteractiveToolbox activeTool={activeTool} onSelectTool={setActiveTool} />

      {/* Scientific Presets Selector Modal */}
      {showPresetsModal && (
        <PresetsModal
          onSelectPreset={handleSelectPreset}
          onClose={() => setShowPresetsModal(false)}
        />
      )}
    </div>
  );
};

export default App;
