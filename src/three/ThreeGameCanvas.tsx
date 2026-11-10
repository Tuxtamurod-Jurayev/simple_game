import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import {
  Unit,
  Building,
  SupplyDock,
  SalvageCrate,
  Projectile,
  Particle,
  SuperweaponStrike,
  Camera,
  BuildingTypeId,
  Faction
} from '../types/game';
import { BUILDING_CONFIGS } from '../config/factions';
import { FogOfWarSystem, WORLD_WIDTH, WORLD_HEIGHT } from '../systems/fogOfWarSystem';
import { RTSCamera3D } from './systems/camera3D';
import { LightingSystem } from './systems/lightingSystem';
import { Audio3DSystem } from './systems/audio3D';
import { ParticleFX } from './effects/ParticleFX';
import { FogOfWar3D } from './effects/FogOfWar3D';
import { Terrain3D } from './entities/Terrain3D';
import { Building3DManager } from './entities/Building3D';
import { Unit3DManager } from './entities/Unit3D';
import { Projectile3DManager } from './entities/Projectile3D';

interface ThreeGameCanvasProps {
  faction: Faction;
  units: Unit[];
  setUnits: React.Dispatch<React.SetStateAction<Unit[]>>;
  buildings: Building[];
  setBuildings: React.Dispatch<React.SetStateAction<Building[]>>;
  supplyDocks: SupplyDock[];
  salvageCrates: SalvageCrate[];
  projectiles: Projectile[];
  particles: Particle[];
  superweaponStrikes: SuperweaponStrike[];
  fogSystem: FogOfWarSystem;
  camera: Camera;
  setCamera: React.Dispatch<React.SetStateAction<Camera>>;
  selectedUnits: Unit[];
  setSelectedUnits: React.Dispatch<React.SetStateAction<Unit[]>>;
  selectedBuilding: Building | null;
  setSelectedBuilding: React.Dispatch<React.SetStateAction<Building | null>>;
  placingBuildingType: BuildingTypeId | null;
  setPlacingBuildingType: (b: BuildingTypeId | null) => void;
  targetingSuperweapon: boolean;
  setTargetingSuperweapon: (t: boolean) => void;
  onLaunchSuperweaponAt: (worldX: number, worldY: number) => void;
  credits: number;
  onDeductCredits: (amount: number) => void;
  audioEnabled: boolean;
  screenShake: number;
}

export const ThreeGameCanvas: React.FC<ThreeGameCanvasProps> = ({
  faction,
  units,
  setUnits,
  buildings,
  setBuildings,
  supplyDocks,
  salvageCrates,
  projectiles,
  particles,
  superweaponStrikes,
  fogSystem,
  camera,
  setCamera,
  selectedUnits,
  setSelectedUnits,
  selectedBuilding,
  setSelectedBuilding,
  placingBuildingType,
  setPlacingBuildingType,
  targetingSuperweapon,
  setTargetingSuperweapon,
  onLaunchSuperweaponAt,
  credits,
  onDeductCredits,
  audioEnabled,
  screenShake
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 3D Engine subsystems refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const rtsCameraRef = useRef<RTSCamera3D | null>(null);
  const lightingRef = useRef<LightingSystem | null>(null);
  const audio3DRef = useRef<Audio3DSystem>(new Audio3DSystem());
  const particleFXRef = useRef<ParticleFX | null>(null);
  const fog3DRef = useRef<FogOfWar3D | null>(null);
  const terrainRef = useRef<Terrain3D | null>(null);
  const buildingMgrRef = useRef<Building3DManager | null>(null);
  const unitMgrRef = useRef<Unit3DManager | null>(null);
  const projMgrRef = useRef<Projectile3DManager | null>(null);

  // Ghost building placement mesh
  const ghostMeshRef = useRef<THREE.Mesh | null>(null);
  const ghostValidRef = useRef<boolean>(true);

  // Move marker decal
  const moveMarkerRef = useRef<THREE.Mesh | null>(null);
  const moveMarkerTimer = useRef<number>(0);

  // Drag selection state
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ screenX: number; screenY: number }>({ screenX: 0, screenY: 0 });
  const [dragBox, setDragBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  // World bounds in 3D scale (240 x 160)
  const WORLD_3D_W = WORLD_WIDTH * 0.1;
  const WORLD_3D_D = WORLD_HEIGHT * 0.1;

  // Initialize Three.js Engine
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 1100;
    const height = containerRef.current.clientHeight || 540;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xd4b886); // Desert sky
    scene.fog = new THREE.FogExp2(0xd4b886, 0.0055);
    sceneRef.current = scene;

    // 2. Camera
    const rtsCamera = new RTSCamera3D(width, height);
    rtsCamera.setTarget(30, 30, true);
    rtsCameraRef.current = rtsCamera;

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    rendererRef.current = renderer;

    // 4. Subsystems
    lightingRef.current = new LightingSystem(scene);
    particleFXRef.current = new ParticleFX(scene);
    fog3DRef.current = new FogOfWar3D(scene, WORLD_3D_W, WORLD_3D_D);
    terrainRef.current = new Terrain3D(WORLD_3D_W, WORLD_3D_D);
    scene.add(terrainRef.current.group);

    buildingMgrRef.current = new Building3DManager(scene);
    unitMgrRef.current = new Unit3DManager(scene);
    projMgrRef.current = new Projectile3DManager(scene);

    // 5. Ghost Placement Group (Wireframe Box + Ground Grid Footprint)
    const ghostGroup = new THREE.Group();
    const gGeo = new THREE.BoxGeometry(6, 4, 6);
    const gMat = new THREE.MeshBasicMaterial({ color: 0x22c55e, wireframe: true, transparent: true, opacity: 0.85 });
    const gBox = new THREE.Mesh(gGeo, gMat);
    ghostGroup.add(gBox);

    const gPlaneGeo = new THREE.PlaneGeometry(6, 6);
    gPlaneGeo.rotateX(-Math.PI / 2);
    const gPlaneMat = new THREE.MeshBasicMaterial({ color: 0x22c55e, transparent: true, opacity: 0.35, depthWrite: false });
    const gPlane = new THREE.Mesh(gPlaneGeo, gPlaneMat);
    gPlane.position.y = -1.95;
    ghostGroup.add(gPlane);

    ghostGroup.visible = false;
    scene.add(ghostGroup);
    ghostMeshRef.current = ghostGroup as any;

    // 6. Right-Click Waypoint Marker Decal (Green for Move, Red for Attack)
    const mGeo = new THREE.RingGeometry(0.8, 1.4, 24);
    mGeo.rotateX(-Math.PI / 2);
    const mMat = new THREE.MeshBasicMaterial({ color: 0x22c55e, transparent: true, opacity: 0.9 });
    const mMesh = new THREE.Mesh(mGeo, mMat);
    mMesh.position.y = 0.12;
    mMesh.visible = false;
    scene.add(mMesh);
    moveMarkerRef.current = mMesh;

    // Resize Observer
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0) {
          renderer.setSize(w, h);
          rtsCamera.resize(w, h);
        }
      }
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      renderer.dispose();
      buildingMgrRef.current?.dispose();
      unitMgrRef.current?.dispose();
    };
  }, []);

  // Sync Audio Setting
  useEffect(() => {
    audio3DRef.current.enabled = audioEnabled;
  }, [audioEnabled]);

  // Main 60 FPS Render Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      animId = requestAnimationFrame(loop);
      const delta = Math.min(0.08, (currentTime - lastTime) / 1000);
      lastTime = currentTime;

      const rtsCam = rtsCameraRef.current;
      const scene = sceneRef.current;
      const renderer = rendererRef.current;
      const lighting = lightingRef.current;

      if (!rtsCam || !scene || !renderer || !lighting) return;

      // Update 3D Camera Pan & Zoom
      rtsCam.update(delta, { minX: 0, maxX: WORLD_3D_W, minZ: 0, maxZ: WORLD_3D_D });

      // Apply screen shake if active
      if (screenShake > 0) {
        rtsCam.camera.position.x += (Math.random() - 0.5) * screenShake * 0.2;
        rtsCam.camera.position.z += (Math.random() - 0.5) * screenShake * 0.2;
      }

      // Sync 2D Camera state for Minimap & HUD
      setCamera(prev => {
        const simX = rtsCam.currentTarget.x * 10 - 550;
        const simY = rtsCam.currentTarget.z * 10 - 270;
        if (Math.abs(prev.x - simX) > 2 || Math.abs(prev.y - simY) > 2) {
          return { ...prev, x: Math.max(0, simX), y: Math.max(0, simY) };
        }
        return prev;
      });

      // Update Subsystems
      lighting.update(delta, rtsCam.currentTarget);
      audio3DRef.current.setCameraPosition(rtsCam.currentTarget.x, rtsCam.currentTarget.z);
      particleFXRef.current?.update(delta);
      fog3DRef.current?.update(fogSystem);

      // Move marker decay
      if (moveMarkerRef.current && moveMarkerTimer.current > 0) {
        moveMarkerTimer.current -= delta;
        if (moveMarkerTimer.current <= 0) {
          moveMarkerRef.current.visible = false;
        } else {
          const s = 1 + (0.5 - moveMarkerTimer.current) * 0.8;
          moveMarkerRef.current.scale.set(s, 1, s);
        }
      }

      // Update 3D Entities
      const selIds = new Set(selectedUnits.map(u => u.id));
      unitMgrRef.current?.update(units, rtsCam.camera, id => selIds.has(id), delta);
      buildingMgrRef.current?.update(buildings, rtsCam.camera, delta);
      projMgrRef.current?.updateProjectiles(projectiles);
      projMgrRef.current?.updateDocksAndCrates(supplyDocks, salvageCrates, delta);
      projMgrRef.current?.updateSuperweapons(superweaponStrikes, delta);

      // Render 3D Scene
      renderer.render(scene, rtsCam.camera);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [units, buildings, projectiles, supplyDocks, salvageCrates, superweaponStrikes, selectedUnits, screenShake, fogSystem, setCamera]);

  // Sync Particles from App to 3D ParticleFX & Explosions
  const prevParticleCount = useRef(particles.length);
  useEffect(() => {
    if (particles.length > prevParticleCount.current && particleFXRef.current) {
      // New particles were added -> spawn 3D explosion and light flash
      const latest = particles[particles.length - 1];
      const p3dX = latest.x * 0.1;
      const p3dZ = latest.y * 0.1;
      const isAnthrax = latest.isAnthrax;

      if (isAnthrax) {
        particleFXRef.current.spawnAnthraxCloud(p3dX, 0, p3dZ);
        lightingRef.current?.triggerExplosionFlash(p3dX, 1.5, p3dZ, 0x22c55e, 4.0);
      } else {
        particleFXRef.current.spawnExplosion(p3dX, 0, p3dZ, 1.2);
        lightingRef.current?.triggerExplosionFlash(p3dX, 1.5, p3dZ, 0xff7700, 5.5);
        audio3DRef.current.playPositionalExplosion(p3dX, p3dZ);
      }
    }
    prevParticleCount.current = particles.length;
  }, [particles]);

  // Input Handling: Mouse Down
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return; // Left click only
    const canvas = canvasRef.current;
    const rtsCam = rtsCameraRef.current;
    if (!canvas || !rtsCam) return;

    const rect = canvas.getBoundingClientRect();
    const groundHit = rtsCam.getGroundIntersection(e.clientX, e.clientY, rect);
    if (!groundHit) return;

    const worldX = groundHit.x * 10;
    const worldY = groundHit.z * 10;

    // 1. Superweapon Targeting
    if (targetingSuperweapon) {
      onLaunchSuperweaponAt(worldX, worldY);
      setTargetingSuperweapon(false);
      return;
    }

    // 2. Building Placement
    if (placingBuildingType) {
      if (ghostValidRef.current) {
        const cfg = BUILDING_CONFIGS[placingBuildingType];
        const snappedWorldX = Math.round(worldX / 10) * 10;
        const snappedWorldY = Math.round(worldY / 10) * 10;

        if (credits >= cfg.cost) {
          onDeductCredits(cfg.cost);
          const newBuilding: Building = {
            id: Date.now(),
            type: placingBuildingType,
            team: 'player',
            faction,
            x: snappedWorldX - cfg.width / 2,
            y: snappedWorldY - cfg.height / 2,
            width: cfg.width,
            height: cfg.height,
            hp: cfg.hp,
            maxHp: cfg.hp,
            buildProgress: 0,
            isCompleted: false,
            powerProduced: cfg.powerProduced,
            powerConsumed: cfg.powerConsumed,
            productionQueue: [],
            productionProgress: 0,
            cost: cfg.cost,
            radarAngle: 0,
            isDefense: cfg.isDefense,
            range: cfg.range,
            damage: cfg.damage,
            fireRate: cfg.fireRate
          };
          setBuildings(prev => [...prev, newBuilding]);
          audio3DRef.current.playBuildSound();
          audio3DRef.current.speak('buildComplete', faction);
        }
      }
      setPlacingBuildingType(null);
      if (ghostMeshRef.current) ghostMeshRef.current.visible = false;
      return;
    }

    // 3. Start Drag Selection Box
    isDraggingRef.current = true;
    dragStartRef.current = { screenX: e.clientX - rect.left, screenY: e.clientY - rect.top };
    setDragBox(null);
  };

  // Input Handling: Mouse Move
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const rtsCam = rtsCameraRef.current;
    if (!canvas || !rtsCam) return;

    const rect = canvas.getBoundingClientRect();
    rtsCam.handleMouseMove(e.clientX, e.clientY, rect);

    // Update Ghost Building Mesh with 10px Grid Snap
    if (placingBuildingType && ghostMeshRef.current) {
      const hit = rtsCam.getGroundIntersection(e.clientX, e.clientY, rect);
      if (hit) {
        const cfg = BUILDING_CONFIGS[placingBuildingType];
        const snappedWorldX = Math.round((hit.x * 10) / 10) * 10;
        const snappedWorldY = Math.round((hit.z * 10) / 10) * 10;
        const snap3dX = snappedWorldX * 0.1;
        const snap3dZ = snappedWorldY * 0.1;

        ghostMeshRef.current.visible = true;
        ghostMeshRef.current.scale.set(cfg.width * 0.1, 4.0, cfg.height * 0.1);
        ghostMeshRef.current.position.set(snap3dX, 2.0, snap3dZ);

        // Check placement validity
        const simX = snappedWorldX;
        const simY = snappedWorldY;
        const canAfford = credits >= cfg.cost;
        const outOfBounds = simX < 80 || simX > WORLD_WIDTH - 80 || simY < 80 || simY > WORLD_HEIGHT - 80;

        // Collision against existing buildings (padding 14px)
        const bW = cfg.width;
        const bH = cfg.height;
        const bLeft = simX - bW / 2;
        const bRight = simX + bW / 2;
        const bTop = simY - bH / 2;
        const bBottom = simY + bH / 2;

        const overlapsBuilding = buildings.some(b => {
          const pad = 14;
          return !(
            bRight + pad < b.x ||
            bLeft - pad > b.x + b.width ||
            bBottom + pad < b.y ||
            bTop - pad > b.y + b.height
          );
        });

        // Water collision (cannot build inside river except bridge)
        const inRiver = simX >= 1140 && simX <= 1260 && !(simY >= 710 && simY <= 890);

        const isValid = canAfford && !outOfBounds && !overlapsBuilding && !inRiver;
        ghostValidRef.current = isValid;

        ghostMeshRef.current.traverse((child: any) => {
          if (child.material) {
            child.material.color.setHex(isValid ? 0x10b981 : 0xef4444);
          }
        });
      }
    }

    // Update Drag Selection Box
    if (isDraggingRef.current) {
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;
      const startX = dragStartRef.current.screenX;
      const startY = dragStartRef.current.screenY;

      const bx = Math.min(startX, currentX);
      const by = Math.min(startY, currentY);
      const bw = Math.abs(currentX - startX);
      const bh = Math.abs(currentY - startY);

      if (bw > 4 || bh > 4) {
        setDragBox({ x: bx, y: by, w: bw, h: bh });
      }
    }
  };

  // Input Handling: Mouse Up
  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0 || !isDraggingRef.current) return;
    isDraggingRef.current = false;

    const canvas = canvasRef.current;
    const rtsCam = rtsCameraRef.current;
    if (!canvas || !rtsCam) {
      setDragBox(null);
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    const startX = dragStartRef.current.screenX;
    const startY = dragStartRef.current.screenY;
    const dist = Math.hypot(currentX - startX, currentY - startY);

    if (dist < 6) {
      // Single Click Selection
      const hit = rtsCam.getGroundIntersection(e.clientX, e.clientY, rect);
      if (hit) {
        const wx = hit.x * 10;
        const wy = hit.z * 10;

        // 1. Check unit under cursor
        const clickedUnit = units.find(u => {
          const d = Math.hypot(u.x - wx, u.y - wy);
          return d <= (u.radius + 18);
        });

        if (clickedUnit) {
          if (clickedUnit.team === 'player') {
            setSelectedUnits([clickedUnit]);
            setSelectedBuilding(null);
            audio3DRef.current.speak('select', clickedUnit.faction);
          } else {
            // Target enemy with currently selected units
            if (selectedUnits.length > 0) {
              if (moveMarkerRef.current) {
                moveMarkerRef.current.position.set(clickedUnit.x * 0.1, 0.12, clickedUnit.y * 0.1);
                (moveMarkerRef.current.material as THREE.MeshBasicMaterial).color.setHex(0xef4444);
                moveMarkerRef.current.visible = true;
                moveMarkerTimer.current = 0.65;
              }
              setUnits(prev =>
                prev.map(u => (selectedUnits.some(su => su.id === u.id) ? { ...u, targetX: clickedUnit.x, targetY: clickedUnit.y } : u))
              );
              audio3DRef.current.speak('attack', faction);
            }
          }
        } else {
          // 2. Check building under cursor
          const clickedBuilding = buildings.find(b => {
            return wx >= b.x && wx <= b.x + b.width && wy >= b.y && wy <= b.y + b.height;
          });

          if (clickedBuilding) {
            if (clickedBuilding.team === 'player') {
              setSelectedBuilding(clickedBuilding);
              setSelectedUnits([]);
            } else {
              // Target enemy building with currently selected units
              if (selectedUnits.length > 0) {
                const bCenterX = clickedBuilding.x + clickedBuilding.width / 2;
                const bCenterY = clickedBuilding.y + clickedBuilding.height / 2;
                if (moveMarkerRef.current) {
                  moveMarkerRef.current.position.set(bCenterX * 0.1, 0.12, bCenterY * 0.1);
                  (moveMarkerRef.current.material as THREE.MeshBasicMaterial).color.setHex(0xef4444);
                  moveMarkerRef.current.visible = true;
                  moveMarkerTimer.current = 0.65;
                }
                setUnits(prev =>
                  prev.map(u => (selectedUnits.some(su => su.id === u.id) ? { ...u, targetX: bCenterX, targetY: bCenterY } : u))
                );
                audio3DRef.current.speak('attack', faction);
              }
            }
          } else {
            // Deselect all
            setSelectedUnits([]);
            setSelectedBuilding(null);
          }
        }
      }
    } else if (dragBox) {
      // Box Drag Selection: Select all player units inside box
      const newlySelected: Unit[] = [];
      const dummyVec = new THREE.Vector3();

      for (const u of units) {
        if (u.team === 'player') {
          dummyVec.set(u.x * 0.1, u.isFlying ? 18 : 0, u.y * 0.1);
          const screenPos = rtsCam.worldToScreen(dummyVec, rect);
          if (
            screenPos.x >= dragBox.x &&
            screenPos.x <= dragBox.x + dragBox.w &&
            screenPos.y >= dragBox.y &&
            screenPos.y <= dragBox.y + dragBox.h
          ) {
            newlySelected.push(u);
          }
        }
      }

      if (newlySelected.length > 0) {
        setSelectedUnits(newlySelected);
        setSelectedBuilding(null);
        audio3DRef.current.speak('select', faction);
      }
    }

    setDragBox(null);
  };

  // Right Click: Move or Attack Command
  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();

    // Cancel building placement
    if (placingBuildingType) {
      setPlacingBuildingType(null);
      if (ghostMeshRef.current) ghostMeshRef.current.visible = false;
      return;
    }

    if (targetingSuperweapon) {
      setTargetingSuperweapon(false);
      return;
    }

    const canvas = canvasRef.current;
    const rtsCam = rtsCameraRef.current;
    if (!canvas || !rtsCam || selectedUnits.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const hit = rtsCam.getGroundIntersection(e.clientX, e.clientY, rect);
    if (!hit) return;

    const worldX = hit.x * 10;
    const worldY = hit.z * 10;

    // Check if right-clicked on an enemy unit or building
    const enemyUnit = units.find(u => u.team === 'enemy' && Math.hypot(u.x - worldX, u.y - worldY) <= u.radius + 24);
    const enemyBuilding = buildings.find(b => b.team === 'enemy' && worldX >= b.x && worldX <= b.x + b.width && worldY >= b.y && worldY <= b.y + b.height);

    if (enemyUnit || enemyBuilding) {
      const tx = enemyUnit ? enemyUnit.x : (enemyBuilding!.x + enemyBuilding!.width / 2);
      const ty = enemyUnit ? enemyUnit.y : (enemyBuilding!.y + enemyBuilding!.height / 2);

      // Show RED attack marker
      if (moveMarkerRef.current) {
        moveMarkerRef.current.position.set(tx * 0.1, 0.12, ty * 0.1);
        (moveMarkerRef.current.material as THREE.MeshBasicMaterial).color.setHex(0xef4444);
        moveMarkerRef.current.visible = true;
        moveMarkerTimer.current = 0.7;
      }

      setUnits(prev =>
        prev.map(u => (selectedUnits.some(su => su.id === u.id) ? { ...u, targetX: tx, targetY: ty } : u))
      );
      audio3DRef.current.speak('attack', faction);
      return;
    }

    // Show GREEN move waypoint marker in 3D
    if (moveMarkerRef.current) {
      moveMarkerRef.current.position.set(hit.x, 0.12, hit.z);
      (moveMarkerRef.current.material as THREE.MeshBasicMaterial).color.setHex(0x10b981);
      moveMarkerRef.current.visible = true;
      moveMarkerTimer.current = 0.55;
    }

    // Issue formation movement to selected units
    const count = selectedUnits.length;
    const spacing = 45;
    const cols = Math.ceil(Math.sqrt(count));

    setUnits(prev =>
      prev.map(u => {
        const idx = selectedUnits.findIndex(su => su.id === u.id);
        if (idx !== -1) {
          const row = Math.floor(idx / cols);
          const col = idx % cols;
          const targetX = worldX + (col - cols / 2) * spacing;
          const targetY = worldY + (row - cols / 2) * spacing;
          return { ...u, targetX, targetY };
        }
        return u;
      })
    );

    audio3DRef.current.speak('move', faction);
  };

  // Mouse Wheel Zoom
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    rtsCameraRef.current?.zoom(e.deltaY);
  };

  // Keyboard navigation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      rtsCameraRef.current?.handleKeyDown(e.key);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      rtsCameraRef.current?.handleKeyUp(e.key);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-full select-none overflow-hidden bg-zinc-950">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onContextMenu={handleContextMenu}
        onWheel={handleWheel}
        className="w-full h-full cursor-crosshair block"
      />

      {/* 2D Tactical Drag Selection Box Overlay */}
      {dragBox && (
        <div
          className="absolute pointer-events-none border-2 border-emerald-400 bg-emerald-500/20 shadow-sm shadow-emerald-500/50"
          style={{
            left: `${dragBox.x}px`,
            top: `${dragBox.y}px`,
            width: `${dragBox.w}px`,
            height: `${dragBox.h}px`
          }}
        />
      )}

      {/* 3D Mode Active Status Badge */}
      <div className="absolute top-14 left-4 pointer-events-none flex items-center gap-2 bg-zinc-900/90 border border-emerald-500/50 px-3 py-1.5 rounded text-xs font-mono text-emerald-400 shadow-xl backdrop-blur-sm">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="font-bold tracking-wider">THREE.JS 3D DVIJOK • 60 FPS • 100VH TO'LIQ MAYDON</span>
      </div>
    </div>
  );
};
