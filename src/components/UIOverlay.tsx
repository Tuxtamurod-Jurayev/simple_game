import React from 'react';
import {
  Faction,
  Unit,
  Building,
  GeneralPower,
  Camera,
  BuildingTypeId,
  UnitTypeId
} from '../types/game';
import { FogOfWarSystem } from '../systems/fogOfWarSystem';
import { TopTacticalBar } from './TopTacticalBar';
import { CommandHUD } from './CommandHUD';

interface UIOverlayProps {
  faction: Faction;
  credits: number;
  powerProduced: number;
  powerConsumed: number;
  generalXp: number;
  superweaponTimer: number | null;
  generalPowers: GeneralPower[];
  onTriggerPower: (powerId: GeneralPower['id']) => void;
  audioEnabled: boolean;
  onToggleAudio: () => void;
  onExitMenu: () => void;

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
  onTacticalCommand: (command: 'stop' | 'scatter' | 'guard' | 'attackMove') => void;

  placingBuildingType: BuildingTypeId | null;
  targetingSuperweapon: boolean;
  onMinimapJump?: (worldX: number, worldY: number) => void;
}

export const UIOverlay: React.FC<UIOverlayProps> = ({
  faction,
  credits,
  powerProduced,
  powerConsumed,
  generalXp,
  superweaponTimer,
  generalPowers,
  onTriggerPower,
  audioEnabled,
  onToggleAudio,
  onExitMenu,
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
  onTacticalCommand,
  placingBuildingType,
  targetingSuperweapon,
  onMinimapJump
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between overflow-hidden z-10">
      {/* 1. TOP TACTICAL BAR */}
      <div className="pointer-events-auto w-full">
        <TopTacticalBar
          faction={faction}
          credits={credits}
          powerProduced={powerProduced}
          powerConsumed={powerConsumed}
          generalXp={generalXp}
          superweaponTimer={superweaponTimer}
          generalPowers={generalPowers}
          onTriggerPower={onTriggerPower}
          audioEnabled={audioEnabled}
          onToggleAudio={onToggleAudio}
          onExitMenu={onExitMenu}
        />
      </div>

      {/* 2. CENTER TACTICAL NOTIFICATIONS */}
      <div className="flex flex-col items-center gap-1.5 pointer-events-none mb-2 px-2">
        {targetingSuperweapon && (
          <div className="bg-red-950/95 border-2 border-red-500 text-red-200 font-mono text-xs px-4 py-1.5 rounded-lg shadow-2xl animate-pulse text-center">
            ⚠️ NISHONNI TANLANG (Bekor qilish: O'ng tugma)
          </div>
        )}
        {placingBuildingType && (
          <div className="bg-emerald-950/95 border-2 border-emerald-500 text-emerald-200 font-mono text-xs px-4 py-1.5 rounded-lg shadow-2xl text-center">
            🏗️ JOY TANLANG: YASHIL — MUMKIN, QIZIL — BAND (Bekor qilish: O'ng tugma)
          </div>
        )}
      </div>

      {/* 3. BOTTOM COMMAND & CONQUER HUD BAR */}
      <div className="pointer-events-auto w-full">
        <CommandHUD
          faction={faction}
          selectedUnits={selectedUnits}
          selectedBuilding={selectedBuilding}
          camera={camera}
          setCamera={setCamera}
          fogSystem={fogSystem}
          units={units}
          buildings={buildings}
          onOrderMove={onOrderMove}
          onSelectBuildingToPlace={onSelectBuildingToPlace}
          onTrainUnit={onTrainUnit}
          onTriggerSuperweaponTargetMode={onTriggerSuperweaponTargetMode}
          isSuperweaponReady={isSuperweaponReady}
          onTacticalCommand={onTacticalCommand}
          onMinimapJump={onMinimapJump}
        />
      </div>
    </div>
  );
};
