import React, { useRef, useEffect } from 'react';
import {
  Unit,
  Building,
  Faction,
  UnitTypeId,
  BuildingTypeId,
  Camera
} from '../types/game';
import { UNIT_CONFIGS, BUILDING_CONFIGS, FACTION_COLORS } from '../config/factions';
import { FogOfWarSystem, WORLD_WIDTH, WORLD_HEIGHT } from '../systems/fogOfWarSystem';

interface CommandHUDProps {
  faction: Faction;
  selectedUnits: Unit[];
  selectedBuilding: Building | null;
  camera: Camera;
  setCamera: React.Dispatch<React.SetStateAction<Camera>>;
  fogSystem: FogOfWarSystem;
  units: Unit[];
  buildings: Building[];
  onOrderMove: (worldX: number, worldY: number) => void;
  onSelectBuildingToPlace: (type: BuildingTypeId) => void;
  onTrainUnit: (type: UnitTypeId) => void;
  onTriggerSuperweaponTargetMode: () => void;
  isSuperweaponReady: boolean;
  onTacticalCommand: (command: 'stop' | 'scatter' | 'guard') => void;
}

export const CommandHUD: React.FC<CommandHUDProps> = ({
  faction,
  selectedUnits,
  selectedBuilding,
  camera,
  setCamera,
  fogSystem,
  units,
  buildings,
  onOrderMove,
  onSelectBuildingToPlace,
  onTrainUnit,
  onTriggerSuperweaponTargetMode,
  isSuperweaponReady,
  onTacticalCommand
}) => {
  const minimapCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const portraitCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // 1. MINIMAP RENDER & INTERACTION
  useEffect(() => {
    const canvas = minimapCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#0b140d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const scaleX = canvas.width / WORLD_WIDTH;
    const scaleY = canvas.height / WORLD_HEIGHT;

    // Render buildings
    buildings.forEach(b => {
      ctx.fillStyle = b.team === 'player' ? '#38bdf8' : '#ef4444';
      ctx.fillRect(b.x * scaleX, b.y * scaleY, Math.max(3, b.width * scaleX), Math.max(3, b.height * scaleY));
    });

    // Render units
    units.forEach(u => {
      ctx.fillStyle = u.team === 'player' ? '#22c55e' : '#f87171';
      ctx.fillRect(u.x * scaleX, u.y * scaleY, 3, 3);
    });

    // Render Fog overlay on minimap
    fogSystem.renderMinimapFog(ctx, canvas.width, canvas.height);

    // Draw Camera Viewport Box (White outline)
    const viewW = 1100 * scaleX;
    const viewH = 540 * scaleY;
    const camX = camera.x * scaleX;
    const camY = camera.y * scaleY;

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(camX, camY, viewW, viewH);
  }, [camera, units, buildings, fogSystem]);

  // Handle Minimap clicks
  const handleMinimapClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = minimapCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const targetWorldX = (clickX / canvas.width) * WORLD_WIDTH;
    const targetWorldY = (clickY / canvas.height) * WORLD_HEIGHT;

    if (e.button === 0) {
      // Left click: Pan camera centered on that point
      setCamera(prev => ({
        ...prev,
        x: Math.max(0, Math.min(WORLD_WIDTH - 1100, targetWorldX - 550)),
        y: Math.max(0, Math.min(WORLD_HEIGHT - 540, targetWorldY - 270))
      }));
    } else if (e.button === 2) {
      // Right click: Order units to that location
      onOrderMove(targetWorldX, targetWorldY);
    }
  };

  // 2. PROCEDURAL PORTRAIT DRAWING
  useEffect(() => {
    const canvas = portraitCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (selectedUnits.length === 1) {
      const u = selectedUnits[0];
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.fillStyle = u.team === 'player' ? FACTION_COLORS[u.faction].primary : '#7f1d1d';
      ctx.fillRect(-18, -14, 36, 28);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(0, -3, 22, 6); // Barrel
      ctx.restore();
    } else if (selectedBuilding) {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
    }
  }, [selectedUnits, selectedBuilding]);

  // Determine available build options based on faction
  const getFactionBuildings = (): BuildingTypeId[] => {
    if (faction === 'USA') return ['USA_Reactor', 'USA_Barracks', 'USA_WarFactory', 'USA_ParticleCannon'];
    if (faction === 'China') return ['China_Reactor', 'China_Barracks', 'China_WarFactory', 'China_NukeSilo'];
    return ['GLA_SupplyStash', 'GLA_Barracks', 'GLA_WarFactory', 'GLA_ScudStorm'];
  };

  const getFactoryUnits = (): UnitTypeId[] => {
    if (faction === 'USA') return ['SupplyChinook', 'Humvee', 'Crusader', 'Paladin'];
    if (faction === 'China') return ['SupplyTruck_China', 'GattlingTank', 'Battlemaster', 'Overlord'];
    return ['Technical', 'Scorpion', 'Marauder'];
  };

  const getBarracksUnits = (): UnitTypeId[] => {
    if (faction === 'USA') return ['Ranger'];
    if (faction === 'China') return ['RedGuard'];
    return ['Worker_GLA', 'Rebel'];
  };

  const isFactorySelected = selectedBuilding?.type.includes('WarFactory');
  const isBarracksSelected = selectedBuilding?.type.includes('Barracks');
  const hasCombatSelection = selectedUnits.some(u => u.range > 0);

  return (
    <div className="w-[1100px] h-44 bg-gradient-to-b from-[#1c241e] to-[#0f1510] border-2 border-slate-600 grid grid-cols-12 gap-3 p-2.5 shadow-2xl select-none font-mono">
      {/* 1. CHAP BLOK (260px) — TAKTIK RADAR (MINIMAP) */}
      <div className="col-span-3 bg-black border-2 border-slate-700 rounded p-1 flex flex-col items-center">
        <div className="w-full flex justify-between text-[10px] text-emerald-400 px-1 mb-0.5 font-bold">
          <span>TACTICAL RADAR</span>
          <span>60x40 GRID</span>
        </div>
        <canvas
          ref={minimapCanvasRef}
          width={240}
          height={135}
          onMouseDown={handleMinimapClick}
          onContextMenu={e => e.preventDefault()}
          className="cursor-crosshair border border-emerald-950 block"
        />
      </div>

      {/* 2. O'RTA BLOK (340px) — TANLANGAN OBYEKT PORTRETI VA STATUSI */}
      <div className="col-span-4 bg-[#131b14] border-2 border-slate-700 rounded p-2.5 flex gap-3">
        {/* Portrait preview canvas */}
        <canvas
          ref={portraitCanvasRef}
          width={70}
          height={70}
          className="border border-slate-700 rounded bg-slate-950 self-start"
        />

        <div className="flex-1 flex flex-col justify-between text-xs">
          {selectedUnits.length > 0 ? (
            <div>
              <div className="flex justify-between items-center border-b border-slate-700 pb-1 mb-1">
                <span className="font-bold text-amber-400">
                  {selectedUnits.length === 1
                    ? UNIT_CONFIGS[selectedUnits[0].type]?.name || selectedUnits[0].type
                    : `${selectedUnits.length} ta Birlik (Guruh)`}
                </span>
                {selectedUnits.length === 1 && selectedUnits[0].veterancy > 0 && (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 rounded border border-amber-400">
                    Rank {selectedUnits[0].veterancy}
                  </span>
                )}
              </div>
              {selectedUnits.length === 1 ? (
                <div className="text-[11px] text-slate-300 space-y-0.5">
                  <div>
                    HP: {Math.max(0, Math.floor(selectedUnits[0].hp))} / {selectedUnits[0].maxHp}
                  </div>
                  <div>Zarar: {selectedUnits[0].damage} | Masofa: {selectedUnits[0].range}</div>
                  {selectedUnits[0].carrying > 0 && (
                    <div className="text-amber-400 font-bold">Resurs: ${selectedUnits[0].carrying}</div>
                  )}
                </div>
              ) : (
                <div className="text-[11px] text-slate-400">
                  Barcha birliklar buyruqqa tayyor. O'ng tugma bilan yangi koordinataga yuboring.
                </div>
              )}
            </div>
          ) : selectedBuilding ? (
            <div>
              <div className="flex justify-between items-center border-b border-slate-700 pb-1 mb-1">
                <span className="font-bold text-sky-400">
                  {BUILDING_CONFIGS[selectedBuilding.type]?.name || selectedBuilding.type}
                </span>
                <span className="text-[10px] text-emerald-400">
                  {selectedBuilding.buildProgress < 100 ? `${Math.floor(selectedBuilding.buildProgress)}%` : 'ONLINE'}
                </span>
              </div>
              <div className="text-[11px] text-slate-300 space-y-0.5">
                <div>
                  HP: {Math.max(0, Math.floor(selectedBuilding.hp))} / {selectedBuilding.maxHp}
                </div>
                {selectedBuilding.productionQueue.length > 0 && (
                  <div className="text-amber-300 font-bold">
                    Ishlab chiqarish: {selectedBuilding.productionQueue[0]} ({Math.floor(selectedBuilding.productionProgress)}%)
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-slate-400 flex flex-col justify-center h-full">
              <span className="text-amber-400 font-bold text-xs uppercase">{faction} COMMAND TERMINAL</span>
              <span className="text-[11px]">Birliklarni guruhlab tanlash uchun sichqoncha bilan ramka torting.</span>
            </div>
          )}

          <div className="text-[10px] text-slate-500 border-t border-slate-800 pt-1 flex justify-between">
            <span>Grid: 2400x1600</span>
            <span>Radio: Encrypted</span>
          </div>
        </div>
      </div>

      {/* 3. O'NG BLOK (500px) — 12 TUGMALI COMMAND GRID (4x3 SETKA) */}
      <div className="col-span-5 bg-[#131b14] border-2 border-slate-700 rounded p-2 grid grid-cols-4 grid-rows-3 gap-1.5">
        {/* If War Factory selected -> Vehicle production */}
        {isFactorySelected ? (
          <>
            {getFactoryUnits().map((uType, idx) => {
              const uCfg = UNIT_CONFIGS[uType];
              const hotkeys = ['Q', 'W', 'E', 'R'];
              return (
                <button
                  key={uType}
                  onClick={() => onTrainUnit(uType)}
                  className="bg-[#1e2821] hover:bg-emerald-900/60 border border-emerald-600/60 rounded p-1 flex flex-col justify-between text-left cursor-pointer transition"
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="text-[10px] font-bold text-emerald-300 truncate">{uCfg.name}</span>
                    <span className="text-[9px] bg-black/60 text-amber-400 px-1 rounded">[{hotkeys[idx]}]</span>
                  </div>
                  <span className="text-[10px] text-amber-400 font-bold">${uCfg.cost}</span>
                </button>
              );
            })}
          </>
        ) : isBarracksSelected ? (
          <>
            {getBarracksUnits().map((uType, idx) => {
              const uCfg = UNIT_CONFIGS[uType];
              const hotkeys = ['Q', 'W'];
              return (
                <button
                  key={uType}
                  onClick={() => onTrainUnit(uType)}
                  className="bg-[#1e2821] hover:bg-emerald-900/60 border border-emerald-600/60 rounded p-1 flex flex-col justify-between text-left cursor-pointer transition"
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="text-[10px] font-bold text-emerald-300 truncate">{uCfg.name}</span>
                    <span className="text-[9px] bg-black/60 text-amber-400 px-1 rounded">[{hotkeys[idx]}]</span>
                  </div>
                  <span className="text-[10px] text-amber-400 font-bold">${uCfg.cost}</span>
                </button>
              );
            })}
          </>
        ) : hasCombatSelection ? (
          <>
            {/* Tactical Stance buttons */}
            <button
              onClick={() => onTacticalCommand('stop')}
              className="bg-[#1e2821] hover:bg-slate-700 border border-slate-600 rounded p-1 text-center font-bold text-xs text-white"
            >
              [S] Stop
            </button>
            <button
              onClick={() => onTacticalCommand('scatter')}
              className="bg-[#1e2821] hover:bg-slate-700 border border-slate-600 rounded p-1 text-center font-bold text-xs text-amber-300"
            >
              [X] Scatter
            </button>
            <button
              onClick={() => onTacticalCommand('guard')}
              className="bg-[#1e2821] hover:bg-slate-700 border border-slate-600 rounded p-1 text-center font-bold text-xs text-emerald-300"
            >
              [G] Guard
            </button>
          </>
        ) : (
          <>
            {/* Default Base Building Buttons */}
            {getFactionBuildings().map((bType, idx) => {
              const bCfg = BUILDING_CONFIGS[bType];
              const hotkeys = ['Q', 'W', 'E', 'R'];
              return (
                <button
                  key={bType}
                  onClick={() => onSelectBuildingToPlace(bType)}
                  className="bg-[#24211b] hover:bg-amber-900/50 border border-amber-600/60 rounded p-1 flex flex-col justify-between text-left cursor-pointer transition"
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="text-[10px] font-bold text-amber-300 truncate">{bCfg.name}</span>
                    <span className="text-[9px] bg-black/60 text-amber-400 px-1 rounded">[{hotkeys[idx]}]</span>
                  </div>
                  <span className="text-[10px] text-amber-400 font-bold">${bCfg.cost}</span>
                </button>
              );
            })}
          </>
        )}

        {/* Superweapon Launch Trigger */}
        {isSuperweaponReady && (
          <button
            onClick={onTriggerSuperweaponTargetMode}
            className="col-span-2 bg-red-900/80 hover:bg-red-700 border-2 border-red-400 text-white rounded p-1 font-bold text-xs flex items-center justify-center animate-pulse cursor-pointer shadow-lg"
          >
            🚀 LAUNCH SUPERWEAPON!
          </button>
        )}
      </div>
    </div>
  );
};
