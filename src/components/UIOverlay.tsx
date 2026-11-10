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
  onTacticalCommand: (command: 'stop' | 'scatter' | 'guard') => void;

  placingBuildingType: BuildingTypeId | null;
  targetingSuperweapon: boolean;
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
  targetingSuperweapon
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between overflow-hidden">
      {/* 1. TOP TACTICAL BAR */}
      <div className="pointer-events-auto flex justify-center">
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
      <div className="flex flex-col items-center gap-1.5 pointer-events-none mb-1">
        {targetingSuperweapon && (
          <div className="bg-red-950/95 border border-red-500 text-red-200 font-mono text-xs px-4 py-1.5 rounded shadow-xl animate-pulse">
            ⚠️ NISHONNI TANLANG (Bekor qilish: O'ng tugma)
          </div>
        )}
        {placingBuildingType && (
          <div className="bg-emerald-950/95 border border-emerald-500 text-emerald-200 font-mono text-xs px-4 py-1.5 rounded shadow-xl">
            🏗️ JOY TANLANG (Bekor qilish: O'ng tugma)
          </div>
        )}
      </div>

      {/* 3. BOTTOM COMMAND & CONQUER HUD BAR */}
      <div className="pointer-events-auto flex justify-center">
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
        />
      </div>
    </div>
  );
};
