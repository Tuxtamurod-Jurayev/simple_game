import React, { useRef, useEffect, useState, useCallback } from 'react';
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
  Faction,
  MoveCommand
} from '../types/game';
import { BUILDING_CONFIGS } from '../config/factions';
import { FogOfWarSystem, WORLD_WIDTH, WORLD_HEIGHT } from '../systems/fogOfWarSystem';
import { RenderSystem } from '../systems/renderSystem';
import { playBuildSound, speakVoice } from '../systems/audioSystem';

interface ClickMarker {
  x: number;
  y: number;
  color: string;
  radius: number;
  maxRadius: number;
  alpha: number;
}

interface BattlefieldCanvasProps {
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
  cameraJump?: { x: number; y: number; timestamp: number } | null;
  onUnitMoveOrder?: (commands: MoveCommand[]) => void;
  onUnitAttackOrder?: (unitIds: number[], targetId: number, targetType: 'unit' | 'building') => void;
  onUnitAttackMoveOrder?: (unitIds: number[], targetX: number, targetY: number) => void;
  onBuildingPlaced?: (building: Building) => void;
}

export const BattlefieldCanvas: React.FC<BattlefieldCanvasProps> = ({
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
  screenShake,
  cameraJump,
  onUnitMoveOrder,
  onUnitAttackOrder,
  onUnitAttackMoveOrder,
  onBuildingPlaced
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Viewport size state
  const [viewportSize, setViewportSize] = useState<{ width: number; height: number }>({
    width: window.innerWidth || 1100,
    height: window.innerHeight || 540
  });

  // Attack-Move state ('A' key pressed)
  const [isAttackMoveActive, setIsAttackMoveActive] = useState<boolean>(false);

  // Visual click markers
  const clickMarkersRef = useRef<ClickMarker[]>([]);

  // Drag selection box
  const [dragState, setDragState] = useState<{
    active: boolean;
    startScreenX: number;
    startScreenY: number;
    currentScreenX: number;
    currentScreenY: number;
    startWorldX: number;
    startWorldY: number;
    currentWorldX: number;
    currentWorldY: number;
  }>({
    active: false,
    startScreenX: 0,
    startScreenY: 0,
    currentScreenX: 0,
    currentScreenY: 0,
    startWorldX: 0,
    startWorldY: 0,
    currentWorldX: 0,
    currentWorldY: 0
  });

  // Mouse world coordinates
  const [mouseWorld, setMouseWorld] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Add click pulse ring
  const addClickMarker = useCallback((x: number, y: number, color: string) => {
    clickMarkersRef.current.push({
      x,
      y,
      color,
      radius: 4,
      maxRadius: 24,
      alpha: 1.0
    });
  }, []);

  // 1. DYNAMIC RESIZE LISTENER
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth || window.innerWidth;
        const h = containerRef.current.clientHeight || window.innerHeight;
        setViewportSize({ width: w, height: h });
        if (canvasRef.current) {
          canvasRef.current.width = w;
          canvasRef.current.height = h;
        }
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 2. MINIMAP CAMERA JUMP
  useEffect(() => {
    if (cameraJump) {
      const halfW = viewportSize.width / 2;
      const halfH = viewportSize.height / 2;
      setCamera(prev => ({
        ...prev,
        x: Math.max(0, Math.min(WORLD_WIDTH - viewportSize.width, cameraJump.x - halfW)),
        y: Math.max(0, Math.min(WORLD_HEIGHT - viewportSize.height, cameraJump.y - halfH))
      }));
    }
  }, [cameraJump, viewportSize, setCamera]);

  // 3. KEYBOARD CAMERA MOVEMENT (WASD & Arrows) & ATTACK-MOVE KEY ('A')
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const key = e.key.toLowerCase();
      if (key === 'a') {
        setIsAttackMoveActive(prev => !prev);
        return;
      }

      const speed = camera.speed;
      setCamera(prev => {
        let nx = prev.x;
        let ny = prev.y;

        if (key === 'w' || key === 'arrowup') ny -= speed;
        if (key === 's' || key === 'arrowdown') ny += speed;
        if (key === 'a' || key === 'arrowleft') nx -= speed;
        if (key === 'd' || key === 'arrowright') nx += speed;

        return {
          ...prev,
          x: Math.max(0, Math.min(WORLD_WIDTH - viewportSize.width, nx)),
          y: Math.max(0, Math.min(WORLD_HEIGHT - viewportSize.height, ny))
        };
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [camera.speed, viewportSize, setCamera]);

  // 4. MOUSE MOVE & EDGE SCROLLING
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const worldX = mouseX + camera.x;
    const worldY = mouseY + camera.y;
    setMouseWorld({ x: worldX, y: worldY });

    // Edge scroll check (25px border)
    const border = 25;
    let dx = 0;
    let dy = 0;

    if (mouseX < border) dx = -camera.speed * 0.7;
    else if (mouseX > canvas.width - border) dx = camera.speed * 0.7;

    if (mouseY < border) dy = -camera.speed * 0.7;
    else if (mouseY > canvas.height - border) dy = camera.speed * 0.7;

    if (dx !== 0 || dy !== 0) {
      setCamera(prev => ({
        ...prev,
        x: Math.max(0, Math.min(WORLD_WIDTH - viewportSize.width, prev.x + dx)),
        y: Math.max(0, Math.min(WORLD_HEIGHT - viewportSize.height, prev.y + dy))
      }));
    }

    // Update Drag selection box
    if (dragState.active) {
      setDragState(prev => ({
        ...prev,
        currentScreenX: mouseX,
        currentScreenY: mouseY,
        currentWorldX: worldX,
        currentWorldY: worldY
      }));
    }
  };

  // 5. MOUSE DOWN HANDLER
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const worldX = mouseX + camera.x;
    const worldY = mouseY + camera.y;

    // A) SUPERWEAPON TARGETING
    if (targetingSuperweapon && e.button === 0) {
      onLaunchSuperweaponAt(worldX, worldY);
      setTargetingSuperweapon(false);
      addClickMarker(worldX, worldY, '#ef4444');
      return;
    }

    // B) GHOST BUILDING PLACEMENT (Left-click)
    if (placingBuildingType && e.button === 0) {
      const bCfg = BUILDING_CONFIGS[placingBuildingType];
      const snappedWorldX = Math.round(worldX / 10) * 10;
      const snappedWorldY = Math.round(worldY / 10) * 10;

      if (credits >= bCfg.cost) {
        onDeductCredits(bCfg.cost);
        playBuildSound(audioEnabled);
        speakVoice('buildComplete', faction, audioEnabled);

        const newBuilding: Building = {
          id: Date.now(),
          type: placingBuildingType,
          team: 'player',
          faction,
          x: snappedWorldX - bCfg.width / 2,
          y: snappedWorldY - bCfg.height / 2,
          width: bCfg.width,
          height: bCfg.height,
          hp: bCfg.hp,
          maxHp: bCfg.hp,
          buildProgress: 0,
          isCompleted: false,
          powerProduced: bCfg.powerProduced,
          powerConsumed: bCfg.powerConsumed,
          productionQueue: [],
          productionProgress: 0,
          cost: bCfg.cost,
          radarAngle: 0,
          isDefense: bCfg.isDefense,
          range: bCfg.range,
          damage: bCfg.damage,
          fireRate: bCfg.fireRate
        };

        setBuildings(prev => [...prev, newBuilding]);
        onBuildingPlaced?.(newBuilding);
        addClickMarker(snappedWorldX, snappedWorldY, '#10b981');
      }
      setPlacingBuildingType(null);
      return;
    }

    // Cancel building placement on right-click
    if (placingBuildingType && e.button === 2) {
      setPlacingBuildingType(null);
      return;
    }

    // Cancel superweapon targeting on right-click
    if (targetingSuperweapon && e.button === 2) {
      setTargetingSuperweapon(false);
      return;
    }

    // C) ATTACK-MOVE ORDER (Left-click when active)
    if (isAttackMoveActive && e.button === 0) {
      setIsAttackMoveActive(false);
      const playerUnits = selectedUnits.filter(u => u.team === 'player' && u.hp > 0);
      if (playerUnits.length > 0) {
        addClickMarker(worldX, worldY, '#f97316');
        speakVoice('move', faction, audioEnabled);

        const count = playerUnits.length;
        setUnits(prev =>
          prev.map(u => {
            const idx = playerUnits.findIndex(pu => pu.id === u.id);
            if (idx !== -1) {
              const offsetX = count === 1 ? 0 : ((idx % 3) * 3 - 3) * 10;
              const offsetY = count === 1 ? 0 : (Math.floor(idx / 3) * 3 - 3) * 10;
              return {
                ...u,
                targetX: worldX + offsetX,
                targetY: worldY + offsetY,
                attackTargetId: null,
                attackTargetType: null,
                isAttackMoving: true
              };
            }
            return u;
          })
        );
        onUnitAttackMoveOrder?.(playerUnits.map(u => u.id), worldX, worldY);
      }
      return;
    }

    // D) LEFT CLICK: START BOX SELECTION
    if (e.button === 0) {
      setDragState({
        active: true,
        startScreenX: mouseX,
        startScreenY: mouseY,
        currentScreenX: mouseX,
        currentScreenY: mouseY,
        startWorldX: worldX,
        startWorldY: worldY,
        currentWorldX: worldX,
        currentWorldY: worldY
      });
    }

    // E) RIGHT CLICK: CONTEXT MOVE / ATTACK / HARVEST
    if (e.button === 2) {
      e.preventDefault();
      const playerUnits = selectedUnits.filter(u => u.team === 'player' && u.hp > 0);
      if (playerUnits.length === 0) return;

      // 1. Enemy unit click -> Attack Target
      const targetEnemyUnit = units.find(
        u => u.team === 'enemy' && u.hp > 0 && Math.hypot(u.x - worldX, u.y - worldY) <= u.radius + 14
      );

      if (targetEnemyUnit) {
        addClickMarker(targetEnemyUnit.x, targetEnemyUnit.y, '#ef4444');
        speakVoice('attack', faction, audioEnabled);

        const attackerIds = playerUnits.map(u => u.id);
        const idSet = new Set(attackerIds);
        setUnits(prev =>
          prev.map(u => (idSet.has(u.id) ? { ...u, attackTargetId: targetEnemyUnit.id, attackTargetType: 'unit', isAttackMoving: false } : u))
        );
        onUnitAttackOrder?.(attackerIds, targetEnemyUnit.id, 'unit');
        return;
      }

      // 2. Enemy building click -> Attack Building
      const targetEnemyBuilding = buildings.find(
        b =>
          b.team === 'enemy' &&
          b.hp > 0 &&
          worldX >= b.x - 10 &&
          worldX <= b.x + b.width + 10 &&
          worldY >= b.y - 10 &&
          worldY <= b.y + b.height + 10
      );

      if (targetEnemyBuilding) {
        const bx = targetEnemyBuilding.x + targetEnemyBuilding.width / 2;
        const by = targetEnemyBuilding.y + targetEnemyBuilding.height / 2;
        addClickMarker(bx, by, '#ef4444');
        speakVoice('attack', faction, audioEnabled);

        const attackerIds = playerUnits.map(u => u.id);
        const idSet = new Set(attackerIds);
        setUnits(prev =>
          prev.map(u => (idSet.has(u.id) ? { ...u, attackTargetId: targetEnemyBuilding.id, attackTargetType: 'building', isAttackMoving: false } : u))
        );
        onUnitAttackOrder?.(attackerIds, targetEnemyBuilding.id, 'building');
        return;
      }

      // 3. Supply Dock click -> Harvest
      const clickedDock = supplyDocks.find(
        sd =>
          worldX >= sd.x - 16 &&
          worldX <= sd.x + sd.width + 16 &&
          worldY >= sd.y - 16 &&
          worldY <= sd.y + sd.height + 16
      );
      const hasHarvester = playerUnits.some(u => u.type.includes('Supply') || u.type.includes('Worker'));

      if (clickedDock && hasHarvester) {
        const dockCX = clickedDock.x + clickedDock.width / 2;
        const dockCY = clickedDock.y + clickedDock.height / 2;
        addClickMarker(dockCX, dockCY, '#f59e0b');
        speakVoice('move', faction, audioEnabled);

        const cmdList: MoveCommand[] = playerUnits.map(pu => ({ unitId: pu.id, targetX: dockCX, targetY: dockCY }));
        const idSet = new Set(playerUnits.map(pu => pu.id));
        setUnits(prev =>
          prev.map(u => (idSet.has(u.id) ? { ...u, targetX: dockCX, targetY: dockCY, attackTargetId: null, isAttackMoving: false } : u))
        );
        onUnitMoveOrder?.(cmdList);
        return;
      }

      // 4. Ground Move with formation offsets
      addClickMarker(worldX, worldY, '#10b981');
      speakVoice('move', faction, audioEnabled);

      const moveCommands: MoveCommand[] = playerUnits.map((su, idx) => {
        const count = playerUnits.length;
        const row = count === 1 ? 0 : Math.floor(idx / 3) - 1;
        const col = count === 1 ? 0 : (idx % 3) - 1;
        return {
          unitId: su.id,
          targetX: worldX + col * 28,
          targetY: worldY + row * 28
        };
      });

      const cmdMap = new Map(moveCommands.map(c => [c.unitId, c]));
      setUnits(prev =>
        prev.map(u => {
          const cmd = cmdMap.get(u.id);
          if (cmd) {
            return {
              ...u,
              targetX: cmd.targetX,
              targetY: cmd.targetY,
              attackTargetId: null,
              attackTargetType: null,
              isAttackMoving: false
            };
          }
          return u;
        })
      );
      onUnitMoveOrder?.(moveCommands);
    }
  };

  // 6. MOUSE UP HANDLER (Complete selection)
  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0 || !dragState.active) return;

    const minX = Math.min(dragState.startWorldX, dragState.currentWorldX);
    const maxX = Math.max(dragState.startWorldX, dragState.currentWorldX);
    const minY = Math.min(dragState.startWorldY, dragState.currentWorldY);
    const maxY = Math.max(dragState.startWorldY, dragState.currentWorldY);
    const dragDist = Math.hypot(maxX - minX, maxY - minY);

    if (dragDist < 8) {
      // Single click selection: find unit within click proximity
      const clickedUnit = units.find(
        u => u.team === 'player' && u.hp > 0 && Math.hypot(u.x - minX, u.y - minY) <= u.radius + 14
      );

      const clickedBuilding = !clickedUnit
        ? buildings.find(
            b =>
              b.team === 'player' &&
              b.hp > 0 &&
              minX >= b.x &&
              minX <= b.x + b.width &&
              minY >= b.y &&
              minY <= b.y + b.height
          )
        : null;

      if (clickedUnit) {
        setSelectedUnits([clickedUnit]);
        setSelectedBuilding(null);
        speakVoice('select', faction, audioEnabled);
      } else if (clickedBuilding) {
        setSelectedUnits([]);
        setSelectedBuilding(clickedBuilding);
      } else {
        setSelectedUnits([]);
        setSelectedBuilding(null);
      }
    } else {
      // Box selection
      const boxed = units.filter(
        u => u.team === 'player' && u.hp > 0 && u.x >= minX && u.x <= maxX && u.y >= minY && u.y <= maxY
      );
      if (boxed.length > 0) {
        setSelectedUnits(boxed);
        setSelectedBuilding(null);
        speakVoice('select', faction, audioEnabled);
      } else {
        setSelectedUnits([]);
        setSelectedBuilding(null);
      }
    }

    setDragState(prev => ({ ...prev, active: false }));
  };

  // 7. MAIN 60 FPS RENDER LOOP
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      ctx.save();

      // Screen Shake offset (Nuclear explosion / heavy strike)
      if (screenShake > 0) {
        const shakeX = (Math.random() - 0.5) * screenShake * 2;
        const shakeY = (Math.random() - 0.5) * screenShake * 2;
        ctx.translate(shakeX, shakeY);
      }

      // 1. Clear & Render Desert Terrain
      RenderSystem.renderTerrain(ctx, camera, canvas.width, canvas.height);

      // 2. Supply Docks
      RenderSystem.renderSupplyDocks(ctx, supplyDocks, camera);

      // 3. GLA Salvage Crates
      RenderSystem.renderSalvageCrates(ctx, salvageCrates, camera);

      // 4. Buildings (Scaffolding & Completed)
      RenderSystem.renderBuildings(ctx, buildings, camera, selectedBuilding);

      // 5. Units (Tanks, Turrets, Chinooks, Overlords, Veterancy, Selection)
      RenderSystem.renderUnits(ctx, units, camera, selectedUnits);

      // 6. Projectiles
      RenderSystem.renderProjectiles(ctx, projectiles, camera);

      // 7. Particles (Explosions, Smoke, Anthrax)
      RenderSystem.renderParticles(ctx, particles, camera);

      // 8. Superweapon Strikes (Particle Cannon, Nuclear Mushroom, Scud Storm)
      RenderSystem.renderSuperweapons(ctx, superweaponStrikes, camera);

      // 9. Fog of War Grid
      fogSystem.render(ctx, camera, canvas.width, canvas.height);

      // 10. Click Pulse Rings
      ctx.save();
      ctx.translate(-camera.x, -camera.y);
      for (let i = clickMarkersRef.current.length - 1; i >= 0; i--) {
        const m = clickMarkersRef.current[i];
        m.radius += 1.2;
        m.alpha -= 0.05;

        ctx.strokeStyle = m.color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = Math.max(0, m.alpha);
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
        ctx.stroke();

        if (m.alpha <= 0 || m.radius >= m.maxRadius) {
          clickMarkersRef.current.splice(i, 1);
        }
      }
      ctx.restore();

      // 11. Drag Selection Box
      if (dragState.active) {
        const bx = Math.min(dragState.startScreenX, dragState.currentScreenX);
        const by = Math.min(dragState.startScreenY, dragState.currentScreenY);
        const bw = Math.abs(dragState.currentScreenX - dragState.startScreenX);
        const bh = Math.abs(dragState.currentScreenY - dragState.startScreenY);

        ctx.fillStyle = 'rgba(34, 197, 94, 0.15)';
        ctx.fillRect(bx, by, bw, bh);
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(bx, by, bw, bh);
      }

      // 12. Ghost Building Placement Preview
      if (placingBuildingType) {
        const bCfg = BUILDING_CONFIGS[placingBuildingType];
        const snappedX = Math.round(mouseWorld.x / 10) * 10;
        const snappedY = Math.round(mouseWorld.y / 10) * 10;
        const gx = snappedX - camera.x - bCfg.width / 2;
        const gy = snappedY - camera.y - bCfg.height / 2;

        const canAfford = credits >= bCfg.cost;
        const color = canAfford ? '#10b981' : '#ef4444';

        ctx.save();
        ctx.fillStyle = canAfford ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)';
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.fillRect(gx, gy, bCfg.width, bCfg.height);
        ctx.strokeRect(gx, gy, bCfg.width, bCfg.height);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${bCfg.name} ($${bCfg.cost})`, gx + bCfg.width / 2, gy - 6);
        ctx.restore();
      }

      // 13. Superweapon Targeting Reticle
      if (targetingSuperweapon) {
        const rx = mouseWorld.x - camera.x;
        const ry = mouseWorld.y - camera.y;

        ctx.save();
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(rx, ry, 60, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(rx - 80, ry);
        ctx.lineTo(rx + 80, ry);
        ctx.moveTo(rx, ry - 80);
        ctx.lineTo(rx, ry + 80);
        ctx.stroke();
        ctx.restore();
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [
    camera,
    buildings,
    units,
    projectiles,
    particles,
    salvageCrates,
    superweaponStrikes,
    dragState,
    placingBuildingType,
    mouseWorld,
    targetingSuperweapon,
    screenShake,
    selectedUnits,
    selectedBuilding,
    fogSystem,
    credits
  ]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative overflow-hidden bg-[#241f18] select-none"
    >
      <canvas
        ref={canvasRef}
        width={viewportSize.width}
        height={viewportSize.height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onContextMenu={e => e.preventDefault()}
        className={`block w-full h-full ${
          targetingSuperweapon
            ? 'cursor-crosshair'
            : isAttackMoveActive
            ? 'cursor-crosshair'
            : placingBuildingType
            ? 'cursor-cell'
            : 'cursor-default'
        }`}
      />
    </div>
  );
};
