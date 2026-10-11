import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { CustomerSim, GameState, WeatherInfo, BusinessRubroId } from '../types';
import {
  initVoxelMaterials,
  buildVoxelTerrain,
  buildVoxelStand,
  buildVoxelCharacter,
  buildVoxelSky,
  buildVoxelRain,
  updateCharacterRigAnimation,
  VoxelCharacterRig,
  VoxelMaterials
} from '../game/voxelWorld';
import { BUSINESS_RUBROS, LOCATIONS } from '../game/constants';
import { sound } from '../audio/chiptune';
import { t } from '../utils/i18n';

export type CameraPreset = 'isometric' | 'front' | 'barista' | 'topdown' | 'cinematic';

interface MinecraftWorld3DProps {
  gameState: GameState;
  customers?: CustomerSim[];
  timeMinutes?: number; // 480 (8:00) to 1140 (19:00)
  interactive?: boolean;
  onCustomerClick?: (cust: CustomerSim) => void;
  className?: string;
}

export const MinecraftWorld3D: React.FC<MinecraftWorld3DProps> = ({
  gameState,
  customers = [],
  timeMinutes = 8 * 60,
  interactive = true,
  onCustomerClick,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('isometric');
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSim | null>(null);

  // References for Three.js lifecycle
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const materialsRef = useRef<VoxelMaterials | null>(null);
  const standGroupRef = useRef<THREE.Group | null>(null);
  const terrainGroupRef = useRef<THREE.Group | null>(null);
  const skyGroupRef = useRef<THREE.Group | null>(null);
  const updateSunRef = useRef<((timeNorm: number) => void) | null>(null);
  const rainSystemRef = useRef<{ group: THREE.Group; update: () => void } | null>(null);
  const mascotRigRef = useRef<VoxelCharacterRig | null>(null);

  // Map of customer ID -> VoxelCharacterRig
  const customerRigsRef = useRef<Map<number, VoxelCharacterRig>>(new Map());

  // Orbit & Mouse drag tracking
  const orbitState = useRef({
    isDragging: false,
    prevMouseX: 0,
    prevMouseY: 0,
    azimuth: Math.PI / 4, // 45 deg
    polar: Math.PI / 3.8, // ~47 deg
    distance: 16,
    target: new THREE.Vector3(0, 1.4, 0),
  });

  const activeRubroId = gameState.activeRubroId || 'lemonade';
  const currentRubro = BUSINESS_RUBROS.find((r) => r.id === activeRubroId) || BUSINESS_RUBROS[0];
  const currentLocation = LOCATIONS.find((l) => l.id === gameState.currentLocationId) || LOCATIONS[0];

  // Set camera target & position according to preset
  const applyCameraPreset = useCallback((preset: CameraPreset) => {
    setCameraPreset(preset);
    const state = orbitState.current;

    if (preset === 'isometric') {
      state.azimuth = Math.PI / 4;
      state.polar = Math.PI / 3.6;
      state.distance = 15;
      state.target.set(0, 1.2, 0);
      setIsAutoRotating(false);
    } else if (preset === 'front') {
      state.azimuth = 0;
      state.polar = Math.PI / 2.3;
      state.distance = 8.5;
      state.target.set(0, 1.4, 0.5);
      setIsAutoRotating(false);
    } else if (preset === 'barista') {
      state.azimuth = Math.PI;
      state.polar = Math.PI / 2.2;
      state.distance = 5.5;
      state.target.set(0, 1.4, 1.2);
      setIsAutoRotating(false);
    } else if (preset === 'topdown') {
      state.azimuth = 0;
      state.polar = 0.15;
      state.distance = 18;
      state.target.set(0, 0, 0);
      setIsAutoRotating(false);
    } else if (preset === 'cinematic') {
      setIsAutoRotating(true);
    }
    sound.playButtonTone();
  }, []);

  // Initialize Three.js Scene
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const width = containerRef.current.clientWidth || 600;
    const height = containerRef.current.clientHeight || 400;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Background color depending on weather/time
    const isRainy = gameState.weatherToday.type === 'rain' || gameState.weatherToday.type === 'thunderstorm';
    scene.background = new THREE.Color(isRainy ? 0x4a5568 : 0x78b0f0);
    scene.fog = new THREE.Fog(isRainy ? 0x4a5568 : 0x78b0f0, 20, 48);

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    cameraRef.current = camera;

    // Renderer with pixelated crispness
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: false, // Minecraft aesthetic prefers sharp block edges
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // Lighting (Warm Minecraft Sunlight + Ambient)
    const ambientLight = new THREE.AmbientLight(0xffffff, isRainy ? 0.5 : 0.75);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffaed, 1.1);
    sunLight.position.set(12, 20, 10);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 50;
    sunLight.shadow.camera.left = -14;
    sunLight.shadow.camera.right = 14;
    sunLight.shadow.camera.top = 14;
    sunLight.shadow.camera.bottom = -14;
    scene.add(sunLight);

    // Initialize Materials
    const materials = initVoxelMaterials();
    materialsRef.current = materials;

    // Build Terrain
    const terrain = buildVoxelTerrain(materials, gameState.currentLocationId);
    terrainGroupRef.current = terrain;
    scene.add(terrain);

    // Build Stand
    const standLevel = gameState.upgrades.stand || 1;
    const stand = buildVoxelStand(materials, activeRubroId, standLevel, gameState.player.standName);
    standGroupRef.current = stand;
    scene.add(stand);

    // Build Sky & Square Sun
    const sky = buildVoxelSky(gameState.weatherToday);
    skyGroupRef.current = sky.group;
    updateSunRef.current = sky.updateSun;
    scene.add(sky.group);

    // Rain System if rainy
    if (isRainy) {
      const rain = buildVoxelRain(140);
      rainSystemRef.current = rain;
      scene.add(rain.group);
    }

    // Mascot Rig if hired
    if (gameState.staff.mascot) {
      const mascot = buildVoxelCharacter(materials, 'mascot', activeRubroId);
      mascot.root.position.set(-2.6, 0, 1.2);
      mascot.root.rotation.y = Math.PI / 4;
      mascotRigRef.current = mascot;
      scene.add(mascot.root);
    }

    // Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0 && cameraRef.current && rendererRef.current) {
          cameraRef.current.aspect = w / h;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(containerRef.current);

    // Main Render Loop
    let animationFrameId: number;
    let lastTime = performance.now();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const now = performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Auto-Rotation
      if (isAutoRotating) {
        orbitState.current.azimuth += delta * 0.3;
      }

      // Update Camera Position from Spherical Coordinates
      const state = orbitState.current;
      const x = state.target.x + state.distance * Math.sin(state.polar) * Math.sin(state.azimuth);
      const y = state.target.y + state.distance * Math.cos(state.polar);
      const z = state.target.z + state.distance * Math.sin(state.polar) * Math.cos(state.azimuth);

      if (cameraRef.current) {
        cameraRef.current.position.set(x, y, z);
        cameraRef.current.lookAt(state.target);
      }

      // Update Sun and Clouds
      if (updateSunRef.current) {
        const timeNorm = Math.max(0, Math.min(1, (timeMinutes - 480) / (1140 - 480)));
        updateSunRef.current(timeNorm);
      }

      // Update Rain
      if (rainSystemRef.current) {
        rainSystemRef.current.update();
      }

      // Update Mascot
      if (mascotRigRef.current) {
        updateCharacterRigAnimation(mascotRigRef.current, false, false, true, delta);
      }

      // Render
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      renderer.dispose();
      customerRigsRef.current.clear();
    };
  }, [gameState.currentLocationId, activeRubroId, gameState.weatherToday.type, Boolean(gameState.staff.mascot)]);

  // Synchronize Live Customers with 3D Character Rigs
  useEffect(() => {
    if (!sceneRef.current || !materialsRef.current) return;

    const scene = sceneRef.current;
    const materials = materialsRef.current;
    const currentMap = customerRigsRef.current;
    const activeIds = new Set(customers.map((c) => c.id));

    // 1. Remove rigs that left the simulation
    for (const [id, rig] of currentMap.entries()) {
      if (!activeIds.has(id)) {
        scene.remove(rig.root);
        currentMap.delete(id);
      }
    }

    // 2. Create or Update Rigs
    for (const cust of customers) {
      let rig = currentMap.get(cust.id);

      if (!rig) {
        // Pick character type based on spriteIndex
        const charTypes: ('steve' | 'alex' | 'villager' | 'business')[] = ['steve', 'alex', 'villager', 'business'];
        const charType = charTypes[cust.spriteIndex % charTypes.length];
        rig = buildVoxelCharacter(materials, charType, activeRubroId);
        rig.root.name = `customer_${cust.id}`;
        scene.add(rig.root);
        currentMap.set(cust.id, rig);
      }

      // Convert 2D sim coordinate (0-100%) to 3D world space
      const targetWorldX = (cust.x - 50) * 0.16;
      const targetWorldZ = 1.8 + Math.sin(cust.id * 1.5) * 0.6; // slightly staggered line depth

      // Smooth position interpolation
      rig.root.position.x = targetWorldX;
      rig.root.position.z = targetWorldZ;
      rig.root.position.y = 0;

      // Rotation facing direction
      if (cust.state === 'walking_in') {
        rig.root.rotation.y = cust.x < cust.targetX ? Math.PI / 2 : -Math.PI / 2;
      } else if (cust.state === 'buying' || cust.state === 'in_line') {
        rig.root.rotation.y = Math.PI; // Face counter
      } else if (cust.state === 'drinking') {
        rig.root.rotation.y = Math.PI; // Face player / counter enjoying drink
      } else if (cust.state === 'walking_out') {
        rig.root.rotation.y = cust.targetX > cust.x ? Math.PI / 2 : -Math.PI / 2;
      }

      // Animate Limbs
      const isWalking = cust.state === 'walking_in' || cust.state === 'walking_out';
      const isDrinking = cust.state === 'drinking';
      updateCharacterRigAnimation(rig, isWalking, isDrinking, false, 0.03);
    }
  }, [customers, activeRubroId]);

  // Mouse / Touch Interaction for 3D Orbit & Raycasting
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!interactive) return;
    orbitState.current.isDragging = true;
    orbitState.current.prevMouseX = e.clientX;
    orbitState.current.prevMouseY = e.clientY;
    setIsAutoRotating(false);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!orbitState.current.isDragging || !interactive) return;

    const deltaX = e.clientX - orbitState.current.prevMouseX;
    const deltaY = e.clientY - orbitState.current.prevMouseY;

    orbitState.current.prevMouseX = e.clientX;
    orbitState.current.prevMouseY = e.clientY;

    const rotSpeed = 0.006;
    orbitState.current.azimuth -= deltaX * rotSpeed;
    orbitState.current.polar = Math.max(0.1, Math.min(Math.PI / 2.05, orbitState.current.polar - deltaY * rotSpeed));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    orbitState.current.isDragging = false;

    // Check click for raycasting customer selection
    if (!interactive || !canvasRef.current || !cameraRef.current || !sceneRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), cameraRef.current);

    const intersects = raycaster.intersectObjects(sceneRef.current.children, true);
    if (intersects.length > 0) {
      // Look for customer root or stand
      let hit = intersects[0].object;
      while (hit.parent && hit.parent !== sceneRef.current) {
        if (hit.name.startsWith('customer_')) {
          const custId = parseInt(hit.name.replace('customer_', ''), 10);
          const foundCust = customers.find((c) => c.id === custId);
          if (foundCust) {
            sound.playCoin();
            setSelectedCustomer(foundCust);
            if (onCustomerClick) onCustomerClick(foundCust);
            return;
          }
        } else if (hit.name === 'stand_root' || hit.name === 'stand_counter') {
          sound.playButtonTone();
          return;
        }
        hit = hit.parent;
      }
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    if (!interactive) return;
    e.preventDefault();
    const zoomSpeed = 0.01;
    orbitState.current.distance = Math.max(5, Math.min(26, orbitState.current.distance + e.deltaY * zoomSpeed));
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden select-none font-mono ${className}`}
    >
      {/* Three.js 3D WebGL Canvas */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        className="w-full h-full cursor-grab active:cursor-grabbing block"
      />

      {/* 3D Camera Controls & Minecraft HUD Overlay */}
      <div className="absolute top-2 right-2 flex flex-col gap-1.5 z-20">
        <div className="bg-[#1a1c1a]/90 backdrop-blur-xs border-2 border-[#8bac0f] p-1 rounded shadow-lg flex items-center gap-1">
          <button
            id="camera-isometric-btn"
            onClick={() => applyCameraPreset('isometric')}
            className={`px-2 py-1 rounded text-[9px] font-bold transition-colors ${
              cameraPreset === 'isometric' && !isAutoRotating
                ? 'bg-[#8bac0f] text-[#0f380f]'
                : 'bg-[#0f380f] text-[#9bbc0f] hover:bg-[#1a4a1a]'
            }`}
            title="Vista Isométrica 3D Clásica"
          >
            🧭 3D Iso
          </button>
          <button
            id="camera-front-btn"
            onClick={() => applyCameraPreset('front')}
            className={`px-2 py-1 rounded text-[9px] font-bold transition-colors ${
              cameraPreset === 'front' && !isAutoRotating
                ? 'bg-[#8bac0f] text-[#0f380f]'
                : 'bg-[#0f380f] text-[#9bbc0f] hover:bg-[#1a4a1a]'
            }`}
            title="Vista Frontal Mostrador"
          >
            🏪 Frente
          </button>
          <button
            id="camera-barista-btn"
            onClick={() => applyCameraPreset('barista')}
            className={`px-2 py-1 rounded text-[9px] font-bold transition-colors ${
              cameraPreset === 'barista' && !isAutoRotating
                ? 'bg-[#8bac0f] text-[#0f380f]'
                : 'bg-[#0f380f] text-[#9bbc0f] hover:bg-[#1a4a1a]'
            }`}
            title="Vista Primera Persona / Barista"
          >
            🧑‍🍳 Atendedor
          </button>
          <button
            id="camera-cinematic-btn"
            onClick={() => applyCameraPreset('cinematic')}
            className={`px-2 py-1 rounded text-[9px] font-bold transition-colors ${
              isAutoRotating
                ? 'bg-[#8bac0f] text-[#0f380f]'
                : 'bg-[#0f380f] text-[#9bbc0f] hover:bg-[#1a4a1a]'
            }`}
            title="Cámara Cinemática 360°"
          >
            🔄 360°
          </button>
        </div>
      </div>

      {/* Minecraft Style Stand Floating Name Banner */}
      <div className="absolute top-2 left-2 z-20 pointer-events-none">
        <div className="bg-[#1a1c1a]/90 border-2 border-[#8bac0f] px-2.5 py-1 rounded shadow-md flex items-center gap-1.5">
          <span className="text-base">{currentRubro.icon}</span>
          <div>
            <div className="text-[10px] font-bold text-[#9bbc0f] uppercase tracking-wide">
              {gameState.player.standName || currentRubro.name}
            </div>
            <div className="text-[8px] text-[#8bac0f]">
              {currentLocation.icon} {t('es', currentLocation.nameKey)} • Nivel {gameState.upgrades.stand || 1}
            </div>
          </div>
        </div>
      </div>

      {/* 3D Customer Thought Bubbles in Screen Overlay */}
      {customers.map((cust) => {
        if (!cust.thought) return null;
        // Project customer X onto screen
        const screenLeftPercent = Math.max(10, Math.min(90, cust.x));

        return (
          <div
            key={`thought_${cust.id}`}
            className="absolute top-16 transition-all duration-300 pointer-events-none z-20 transform -translate-x-1/2"
            style={{ left: `${screenLeftPercent}%` }}
          >
            <div className="bg-[#1a1c1a]/95 border-2 border-[#8bac0f] text-[#9bbc0f] px-2 py-0.5 rounded shadow-xl flex items-center gap-1 text-[9px] animate-bounce font-mono">
              <span className="text-xs">{cust.thought.icon}</span>
              <span className="text-[8px] font-bold whitespace-nowrap">{t('es', cust.thought.textKey)}</span>
            </div>
          </div>
        );
      })}

      {/* Selected Customer Inspector Card */}
      {selectedCustomer && (
        <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:w-80 bg-[#1a1c1a]/95 border-2 border-[#8bac0f] p-2.5 rounded shadow-2xl z-30 text-xs text-[#9bbc0f] animate-fade-in font-mono">
          <div className="flex items-center justify-between border-b border-[#8bac0f]/40 pb-1.5 mb-1.5">
            <div className="flex items-center gap-1.5 font-bold uppercase text-[10px]">
              <span>🧑 Cliente #{selectedCustomer.id}</span>
              <span className="text-[#8bac0f]">({selectedCustomer.state})</span>
            </div>
            <button
              onClick={() => setSelectedCustomer(null)}
              className="text-[#8bac0f] hover:text-[#9bbc0f] text-xs font-bold px-1"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[9px]">
            <div>
              <span className="text-[#8bac0f]">Preferencia Dulce:</span>{' '}
              <span className="font-bold">{Math.round(selectedCustomer.tastePreference.sweetnessBias * 100)}%</span>
            </div>
            <div>
              <span className="text-[#8bac0f]">Tolerancia Ácida:</span>{' '}
              <span className="font-bold">{Math.round(selectedCustomer.tastePreference.sournessBias * 100)}%</span>
            </div>
            <div>
              <span className="text-[#8bac0f]">Necesidad Frío:</span>{' '}
              <span className="font-bold">{selectedCustomer.tastePreference.iceNeed} cubos</span>
            </div>
            <div>
              <span className="text-[#8bac0f]">Presupuesto Max:</span>{' '}
              <span className="font-bold">${selectedCustomer.tastePreference.budgetLimit.toFixed(2)}</span>
            </div>
          </div>

          {selectedCustomer.thought && (
            <div className="mt-2 pt-1 border-t border-[#8bac0f]/30 flex items-center gap-1 text-[9px] text-[#8bac0f]">
              <span>{selectedCustomer.thought.icon}</span>
              <span>"{t('es', selectedCustomer.thought.textKey)}"</span>
            </div>
          )}
        </div>
      )}

      {/* Minecraft Navigation Hint */}
      <div className="absolute bottom-2 right-2 text-[8px] text-[#8bac0f]/70 bg-[#1a1c1a]/60 px-1.5 py-0.5 rounded pointer-events-none z-10 hidden sm:block">
        🖱️ Arrastra para rotar 3D • Rueda para zoom
      </div>
    </div>
  );
};
