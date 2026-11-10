import React, { useRef, useEffect, useState } from 'react';
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
import { RenderSystem } from '../systems/renderSystem';
import { PhysicsSystem } from '../systems/physicsSystem';
import { playBuildSound, speakVoice } from '../systems/audioSystem';

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
}

export const BattlefieldCanvas: React.FC<BattlefieldCanvasProps> = ({
  faction,
  units,
  buildings,
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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Mouse drag selection
  const [dragState, setDragState] = useState<{
    active: boolean;
    startWorldX: number;
    startWorldY: number;
    currentWorldX: number;
    currentWorldY: number;
  }>({
    active: false,
    startWorldX: 0,
    startWorldY: 0,
    currentWorldX: 0,
    currentWorldY: 0
  });

  // Current mouse world coordinate for ghost building placement
  const [mouseWorld, setMouseWorld] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // 1. KEYBOARD CAMERA MOVEMENT (WASD / Arrows)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
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
          x: Math.max(0, Math.min(WORLD_WIDTH - 1100, nx)),
          y: Math.max(0, Math.min(WORLD_HEIGHT - 540, ny))
        };
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [camera.speed, setCamera]);

  // 2. EDGE SCROLLING (25px border inside canvas)
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const worldX = mouseX + camera.x;
    const worldY = mouseY + camera.y;
    setMouseWorld({ x: worldX, y: worldY });

    // Edge scroll check
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
        x: Math.max(0, Math.min(WORLD_WIDTH - 1100, prev.x + dx)),
        y: Math.max(0, Math.min(WORLD_HEIGHT - 540, prev.y + dy))
      }));
    }

    // Update drag selection
    if (dragState.active) {
      setDragState(prev => ({
        ...prev,
        currentWorldX: worldX,
        currentWorldY: worldY
      }));
    }
  };

  // 3. MOUSE CLICKS & SELECTION & PLACEMENT
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
      return;
    }

    // B) GHOST BUILDING PLACEMENT
    if (placingBuildingType && e.button === 0) {
      const bCfg = BUILDING_CONFIGS[placingBuildingType];
      if (credits >= bCfg.cost) {
        onDeductCredits(bCfg.cost);
        playBuildSound(audioEnabled);
        speakVoice('buildComplete', faction, audioEnabled);

        const newBuilding: Building = {
          id: Date.now(),
          type: placingBuildingType,
          team: 'player',
          faction,
          x: worldX - bCfg.width / 2,
          y: worldY - bCfg.height / 2,
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
          radarAngle: 0
        };
        buildings.push(newBuilding);
      }
      setPlacingBuildingType(null);
      return;
    }

    // Cancel building placement on right-click
    if (placingBuildingType && e.button === 2) {
      setPlacingBuildingType(null);
      return;
    }

    // C) LEFT CLICK: START BOX SELECTION
    if (e.button === 0) {
      setDragState({
        active: true,
        startWorldX: worldX,
        startWorldY: worldY,
        currentWorldX: worldX,
        currentWorldY: worldY
      });
    }

    // D) RIGHT CLICK: MOVE / ATTACK ORDER
    if (e.button === 2) {
      e.preventDefault();
      if (selectedUnits.length > 0) {
        speakVoice('move', faction, audioEnabled);

        // Tactical formation offset
        selectedUnits.forEach((su, idx) => {
          const row = Math.floor(idx / 3);
          const col = idx % 3;
          su.targetX = worldX + (col - 1) * 32;
          su.targetY = worldY + (row - 1) * 32;
        });
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0 || !dragState.active) return;

    const minX = Math.min(dragState.startWorldX, dragState.currentWorldX);
    const maxX = Math.max(dragState.startWorldX, dragState.currentWorldX);
    const minY = Math.min(dragState.startWorldY, dragState.currentWorldY);
    const maxY = Math.max(dragState.startWorldY, dragState.currentWorldY);
    const dragDist = Math.hypot(maxX - minX, maxY - minY);

    if (dragDist < 8) {
      // Single click selection
      const clickedUnit = units.find(
        u => u.team === 'player' && Math.hypot(u.x - minX, u.y - minY) <= u.radius + 6
      );
      const clickedBuilding = !clickedUnit
        ? buildings.find(
            b => b.team === 'player' && minX >= b.x && minX <= b.x + b.width && minY >= b.y && minY <= b.y + b.height
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
        u => u.team === 'player' && u.x >= minX && u.x <= maxX && u.y >= minY && u.y <= maxY
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

  // 4. MAIN 60 FPS RENDER LOOP
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      ctx.save();

      // Screen Shake offset (Nuclear Missile / heavy explosion)
      if (screenShake > 0) {
        const shakeX = (Math.random() - 0.5) * screenShake;
        const shakeY = (Math.random() - 0.5) * screenShake;
        ctx.translate(shakeX, shakeY);
      }

      // 1. Clear & Render Desert Terrain
      RenderSystem.renderTerrain(ctx, camera, canvas.width, canvas.height);

      // 2. Supply Docks
      RenderSystem.renderSupplyDocks(ctx, supplyDocks, camera);

      // 3. GLA Salvage Crates
      RenderSystem.renderSalvageCrates(ctx, salvageCrates, camera);

      // 4. Buildings (with Scaffolding progress)
      RenderSystem.renderBuildings(ctx, buildings, camera, selectedBuilding);

      // 5. Units (Tank turrets, Chinooks, Overlords, Horde auras, Veterancy)
      RenderSystem.renderUnits(ctx, units, camera, selectedUnits);

      // 6. Projectiles
      RenderSystem.renderProjectiles(ctx, projectiles, camera);

      // 7. Particles (Explosions, Smoke, Anthrax)
      RenderSystem.renderParticles(ctx, particles, camera);

      // 8. Superweapon Strikes (Particle Cannon, Nuke shockwave, Scud Storm)
      RenderSystem.renderSuperweapons(ctx, superweaponStrikes, camera);

      // 9. FOG OF WAR (60x40 Grid System)
      fogSystem.render(ctx, camera, canvas.width, canvas.height);

      // 10. DRAG SELECTION BOX OVERLAY
      if (dragState.active) {
        const sx = dragState.startWorldX - camera.x;
        const sy = dragState.startWorldY - camera.y;
        const cx = dragState.currentWorldX - camera.x;
        const cy = dragState.currentWorldY - camera.y;

        const bx = Math.min(sx, cx);
        const by = Math.min(sy, cy);
        const bw = Math.abs(cx - sx);
        const bh = Math.abs(cy - sy);

        ctx.fillStyle = 'rgba(34, 197, 94, 0.15)';
        ctx.fillRect(bx, by, bw, bh);
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(bx, by, bw, bh);
      }

      // 11. GHOST BUILDING PREVIEW (Joylashuvni tanlash)
      if (placingBuildingType) {
        const bCfg = BUILDING_CONFIGS[placingBuildingType];
        const gx = mouseWorld.x - camera.x - bCfg.width / 2;
        const gy = mouseWorld.y - camera.y - bCfg.height / 2;

        ctx.save();
        ctx.fillStyle = 'rgba(34, 197, 94, 0.35)'; // Green valid
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2;
        ctx.fillRect(gx, gy, bCfg.width, bCfg.height);
        ctx.strokeRect(gx, gy, bCfg.width, bCfg.height);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(bCfg.name, gx + bCfg.width / 2, gy - 6);
        ctx.restore();
      }

      // 12. SUPERWEAPON TARGETING RETICLE
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
        ctx.moveTo(rx - 80, ry); ctx.lineTo(rx + 80, ry);
        ctx.moveTo(rx, ry - 80); ctx.lineTo(rx, ry + 80);
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
    screenShake
  ]);

  return (
    <div className="relative w-[1100px] h-[540px] border-2 border-slate-700 shadow-2xl overflow-hidden bg-black">
      <canvas
        ref={canvasRef}
        width={1100}
        height={540}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onContextMenu={e => e.preventDefault()}
        className="block cursor-crosshair"
      />
    </div>
  );
};
