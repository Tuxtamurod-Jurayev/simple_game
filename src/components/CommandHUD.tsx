import React, { useRef, useEffect, useState } from 'react';
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
  const [activeTab, setActiveTab] = useState<'build' | 'train' | 'tactics'>('build');

  // 1. MINIMAP RENDER & INTERACTION
  useEffect(() => {
    const canvas = minimapCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear background (Desert minimap ground)
    ctx.fillStyle = '#1c150c';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const scaleX = canvas.width / WORLD_WIDTH;
    const scaleY = canvas.height / WORLD_HEIGHT;

    // Draw central river
    ctx.fillStyle = '#1d4ed8';
    ctx.fillRect(1150 * scaleX, 0, 100 * scaleX, canvas.height);

    // Draw Bridge
    ctx.fillStyle = '#71717a';
    ctx.fillRect(1130 * scaleX, 720 * scaleY, 140 * scaleX, 160 * scaleY);

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

    // Draw Camera Viewport Box
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
      setCamera(prev => ({
        ...prev,
        x: Math.max(0, Math.min(WORLD_WIDTH - 1100, targetWorldX - 550)),
        y: Math.max(0, Math.min(WORLD_HEIGHT - 540, targetWorldY - 270))
      }));
    } else if (e.button === 2) {
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
      ctx.fillStyle = '#090d0b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.fillStyle = u.team === 'player' ? FACTION_COLORS[u.faction].primary : '#7f1d1d';
      ctx.fillRect(-18, -14, 36, 28);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(0, -3, 22, 6);
      ctx.restore();
    } else if (selectedBuilding) {
      ctx.fillStyle = '#090d0b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('BINO', canvas.width / 2, canvas.height / 2 + 4);
    }
  }, [selectedUnits, selectedBuilding]);

  // Determine available build options based on faction
  const getFactionBuildings = (): BuildingTypeId[] => {
    if (faction === 'USA') {
      return [
        'USA_Reactor',
        'USA_SupplyDepot',
        'USA_Barracks',
        'USA_WarFactory',
        'USA_Airfield',
        'USA_Patriot',
        'USA_ParticleCannon'
      ];
    }
    if (faction === 'China') {
      return [
        'China_Reactor',
        'China_SupplyCenter',
        'China_Barracks',
        'China_WarFactory',
        'China_Airfield',
        'China_GatlingCannon',
        'China_NukeSilo'
      ];
    }
    return [
      'GLA_SupplyStash',
      'GLA_Barracks',
      'GLA_WarFactory',
      'GLA_StingerSite',
      'GLA_ScudStorm'
    ];
  };

  // Determine available train options based on selected building
  const getTrainableUnits = (): UnitTypeId[] => {
    if (selectedBuilding) {
      if (selectedBuilding.type.includes('WarFactory')) {
        if (faction === 'USA') return ['Humvee', 'Crusader', 'Paladin'];
        if (faction === 'China') return ['SupplyTruck_China', 'GattlingTank', 'Battlemaster', 'Overlord'];
        return ['Technical', 'Scorpion', 'Marauder', 'GLA_RocketBuggy'];
      }
      if (selectedBuilding.type.includes('Barracks')) {
        if (faction === 'USA') return ['Ranger'];
        if (faction === 'China') return ['RedGuard'];
        return ['Worker_GLA', 'Rebel'];
      }
      if (selectedBuilding.type.includes('Airfield') || selectedBuilding.type.includes('HQ')) {
        if (faction === 'USA') return ['SupplyChinook', 'USA_Raptor', 'USA_Comanche'];
        if (faction === 'China') return ['SupplyTruck_China', 'China_MiG', 'China_Helix'];
        return ['Worker_GLA'];
      }
    }
    // Default fallback to all faction units
    if (faction === 'USA') return ['SupplyChinook', 'Ranger', 'Humvee', 'Crusader', 'Paladin', 'USA_Raptor', 'USA_Comanche'];
    if (faction === 'China') return ['SupplyTruck_China', 'RedGuard', 'GattlingTank', 'Battlemaster', 'Overlord', 'China_MiG', 'China_Helix'];
    return ['Worker_GLA', 'Rebel', 'Technical', 'Scorpion', 'Marauder', 'GLA_RocketBuggy'];
  };

  const hotkeys = ['Q', 'W', 'E', 'R', 'A', 'S', 'D', 'F', 'Z', 'X', 'C', 'V'];

  return (
    <div className="w-full max-w-[1240px] h-44 bg-gradient-to-b from-[#182219]/95 to-[#0b100c]/98 backdrop-blur-md border-x-2 border-t-2 border-slate-600/90 grid grid-cols-12 gap-2.5 p-2 shadow-2xl select-none font-mono rounded-t-lg">
      {/* 1. CHAP BLOK — TAKTIK RADAR (MINIMAP) */}
      <div className="col-span-3 bg-black/90 border-2 border-slate-700/80 rounded p-1 flex flex-col items-center justify-between shadow-inner">
        <div className="w-full flex justify-between text-[10px] text-emerald-400 px-1 font-bold">
          <span>TAKTIK RADAR</span>
          <span className="text-slate-400">60x40 SETKA</span>
        </div>
        <canvas
          ref={minimapCanvasRef}
          width={240}
          height={130}
          onMouseDown={handleMinimapClick}
          onContextMenu={e => e.preventDefault()}
          className="cursor-crosshair border border-emerald-950/80 block rounded"
        />
      </div>

      {/* 2. O'RTA BLOK — TANLANGAN OBYEKT PORTRETI VA STATUSI */}
      <div className="col-span-4 bg-[#111912]/90 border-2 border-slate-700/80 rounded p-2 flex gap-2.5 shadow-inner">
        <canvas
          ref={portraitCanvasRef}
          width={65}
          height={65}
          className="border border-slate-700 rounded bg-slate-950 self-start shadow"
        />

        <div className="flex-1 flex flex-col justify-between text-xs overflow-hidden">
          {selectedUnits.length > 0 ? (
            <div>
              <div className="flex justify-between items-center border-b border-slate-700 pb-1 mb-1">
                <span className="font-bold text-amber-400 truncate">
                  {selectedUnits.length === 1
                    ? UNIT_CONFIGS[selectedUnits[0].type]?.uzbekName || selectedUnits[0].type
                    : `${selectedUnits.length} ta Birlik (Guruh)`}
                </span>
                {selectedUnits.length === 1 && selectedUnits[0].veterancy > 0 && (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 rounded border border-amber-400 shrink-0">
                    Daraja {selectedUnits[0].veterancy}
                  </span>
                )}
              </div>
              {selectedUnits.length === 1 ? (
                <div className="text-[11px] text-slate-300 space-y-0.5">
                  <div>
                    Sog'liq (HP): {Math.max(0, Math.floor(selectedUnits[0].hp))} / {selectedUnits[0].maxHp}
                  </div>
                  <div>Zarar: {selectedUnits[0].damage} | Otish masofasi: {selectedUnits[0].range}</div>
                  {selectedUnits[0].carrying > 0 && (
                    <div className="text-amber-400 font-bold">Mablag' tashilmoqda: +${selectedUnits[0].carrying}</div>
                  )}
                </div>
              ) : (
                <div className="text-[11px] text-slate-400">
                  Guruh buyruqqa tayyor. Xaritadagi nishonga o'ng tugma orqali harakatlantiring.
                </div>
              )}
            </div>
          ) : selectedBuilding ? (
            <div>
              <div className="flex justify-between items-center border-b border-slate-700 pb-1 mb-1">
                <span className="font-bold text-sky-400 truncate">
                  {BUILDING_CONFIGS[selectedBuilding.type]?.uzbekName || selectedBuilding.type}
                </span>
                <span className="text-[10px] text-emerald-400 shrink-0">
                  {selectedBuilding.buildProgress < 100
                    ? `Qurilish: ${Math.floor(selectedBuilding.buildProgress)}%`
                    : 'FAOL (TAYYOR)'}
                </span>
              </div>
              <div className="text-[11px] text-slate-300 space-y-0.5">
                <div>
                  Mustahkamlik: {Math.max(0, Math.floor(selectedBuilding.hp))} / {selectedBuilding.maxHp}
                </div>
                {selectedBuilding.productionQueue.length > 0 && (
                  <div className="text-amber-300 font-bold">
                    Ishlab chiqarilmoqda: {selectedBuilding.productionQueue[0]} ({Math.floor(selectedBuilding.productionProgress)}%)
                  </div>
                )}
                {selectedBuilding.isDefense && (
                  <div className="text-red-400 font-bold">Avtomatik mudofaa: Masofa {selectedBuilding.range}</div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-slate-400 flex flex-col justify-center h-full">
              <span className="text-amber-400 font-bold text-xs uppercase">{faction} QO'MONDONLIK PULTI</span>
              <span className="text-[11px]">Birliklarni tanlash uchun chap tugma bilan ramka torting yoki bino ustiga bosing.</span>
            </div>
          )}

          <div className="text-[10px] text-slate-500 border-t border-slate-800 pt-0.5 flex justify-between">
            <span>Xarita: 2400x1600</span>
            <span>Aloqa: Himoyalangan</span>
          </div>
        </div>
      </div>

      {/* 3. O'NG BLOK — 12 TUGMALI TAKTIK BOSHQARUV SETKASI (COMMAND GRID) */}
      <div className="col-span-5 bg-[#0f1710]/90 border-2 border-slate-700/80 rounded p-1.5 flex flex-col justify-between shadow-inner">
        {/* Toifalar (Tabs) */}
        <div className="flex gap-1 border-b border-slate-700/80 pb-1 mb-1">
          <button
            onClick={() => setActiveTab('build')}
            className={`flex-1 py-0.5 text-[10px] font-bold rounded uppercase transition cursor-pointer ${
              activeTab === 'build'
                ? 'bg-amber-500 text-black shadow'
                : 'bg-black/50 text-slate-400 hover:text-slate-200'
            }`}
          >
            🏗️ Inshootlar (Binolar)
          </button>
          <button
            onClick={() => setActiveTab('train')}
            className={`flex-1 py-0.5 text-[10px] font-bold rounded uppercase transition cursor-pointer ${
              activeTab === 'train'
                ? 'bg-amber-500 text-black shadow'
                : 'bg-black/50 text-slate-400 hover:text-slate-200'
            }`}
          >
            ⚔️ Qo'shinlar (Texnika/Havo)
          </button>
          <button
            onClick={() => setActiveTab('tactics')}
            className={`flex-1 py-0.5 text-[10px] font-bold rounded uppercase transition cursor-pointer ${
              activeTab === 'tactics'
                ? 'bg-amber-500 text-black shadow'
                : 'bg-black/50 text-slate-400 hover:text-slate-200'
            }`}
          >
            🎯 Taktik Buyruqlar
          </button>
        </div>

        {/* 12-Tugmali Setka */}
        <div className="grid grid-cols-4 gap-1 flex-1">
          {activeTab === 'build' && (
            <>
              {getFactionBuildings().map((bType, idx) => {
                const cfg = BUILDING_CONFIGS[bType];
                return (
                  <button
                    key={bType}
                    onClick={() => onSelectBuildingToPlace(bType)}
                    title={`${cfg.uzbekName} ($${cfg.cost}) - ${cfg.description}`}
                    className="bg-[#1b261c] hover:bg-emerald-900/60 border border-emerald-600/40 hover:border-emerald-400 text-white p-1 rounded flex flex-col justify-between text-left transition cursor-pointer relative overflow-hidden group shadow"
                  >
                    <span className="text-[9px] text-amber-400 font-bold truncate block">
                      [{hotkeys[idx]}] {cfg.uzbekName.split('(')[0]}
                    </span>
                    <span className="text-[10px] text-emerald-300 font-black">${cfg.cost}</span>
                  </button>
                );
              })}
            </>
          )}

          {activeTab === 'train' && (
            <>
              {getTrainableUnits().map((uType, idx) => {
                const cfg = UNIT_CONFIGS[uType];
                return (
                  <button
                    key={uType}
                    onClick={() => onTrainUnit(uType)}
                    title={`${cfg.uzbekName} ($${cfg.cost}) - ${cfg.description}`}
                    className="bg-[#1b261c] hover:bg-amber-900/60 border border-amber-600/40 hover:border-amber-400 text-white p-1 rounded flex flex-col justify-between text-left transition cursor-pointer relative overflow-hidden group shadow"
                  >
                    <span className="text-[9px] text-amber-300 font-bold truncate block">
                      [{hotkeys[idx]}] {cfg.uzbekName.split('(')[0]}
                    </span>
                    <span className="text-[10px] text-amber-400 font-black">${cfg.cost}</span>
                  </button>
                );
              })}
            </>
          )}

          {activeTab === 'tactics' && (
            <>
              <button
                onClick={() => onTacticalCommand('stop')}
                className="bg-red-950/70 hover:bg-red-800 border border-red-600 p-1 rounded text-left transition cursor-pointer"
              >
                <span className="text-[9px] text-red-300 font-bold block">[Q] TO'XTASH</span>
                <span className="text-[9px] text-slate-300">Harakatni to'xtatish</span>
              </button>
              <button
                onClick={() => onTacticalCommand('scatter')}
                className="bg-amber-950/70 hover:bg-amber-800 border border-amber-600 p-1 rounded text-left transition cursor-pointer"
              >
                <span className="text-[9px] text-amber-300 font-bold block">[W] TARQALISH</span>
                <span className="text-[9px] text-slate-300">Zarbadan qochish</span>
              </button>
              <button
                onClick={() => onTacticalCommand('guard')}
                className="bg-sky-950/70 hover:bg-sky-800 border border-sky-600 p-1 rounded text-left transition cursor-pointer"
              >
                <span className="text-[9px] text-sky-300 font-bold block">[E] QO'RIQLASH</span>
                <span className="text-[9px] text-slate-300">Hududni himoya qilish</span>
              </button>
              <button
                disabled={!isSuperweaponReady}
                onClick={onTriggerSuperweaponTargetMode}
                className={`p-1 rounded text-left transition cursor-pointer border ${
                  isSuperweaponReady
                    ? 'bg-red-600 hover:bg-red-500 border-red-400 text-white animate-pulse shadow-lg'
                    : 'bg-black/40 border-slate-700 text-slate-500 cursor-not-allowed'
                }`}
              >
                <span className="text-[9px] font-bold block">[R] SUPERQUROL</span>
                <span className="text-[9px]">{isSuperweaponReady ? 'ZARBA BERISH!' : 'Qayta quvvatlanmoqda'}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
