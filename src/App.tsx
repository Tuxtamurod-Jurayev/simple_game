import React, { useState, useEffect, useCallback } from 'react';
import { UIOverlay } from './components/UIOverlay';
import { GameCanvas } from './components/GameCanvas';
import { BuildMenu } from './components/BuildMenu';
import { Unit, Building, BuildingType, UnitType } from './types/game';

export const App: React.FC = () => {
  const [money, setMoney] = useState<number>(1500);
  const [energy] = useState<number>(15);
  const [maxEnergy] = useState<number>(15);
  const [enemyHqHp, setEnemyHqHp] = useState<number>(1800);

  const [selectedUnits, setSelectedUnits] = useState<Unit[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);

  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);
  const [toast, setToast] = useState<string>("Baza faollashdi. Sichqoncha bilan ramka tortib bir nechta tankni guruhlab tanlang!");
  const [toastType, setToastType] = useState<'normal' | 'danger' | 'success'>('normal');

  const [buildQueue, setBuildQueue] = useState<BuildingType | null>(null);
  const [trainQueue, setTrainQueue] = useState<UnitType | null>(null);

  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [victory, setVictory] = useState<boolean>(false);

  const handleNotify = useCallback((msg: string, type: 'normal' | 'danger' | 'success' = 'normal') => {
    setToast(msg);
    setToastType(type);
  }, []);

  const handleGameOver = useCallback((isVictory: boolean) => {
    setIsGameOver(true);
    setVictory(isVictory);
  }, []);

  const handleBuild = (type: BuildingType) => {
    setBuildQueue(type);
  };

  const handleTrain = (type: UnitType) => {
    setTrainQueue(type);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isGameOver) return;
      const key = e.key.toLowerCase();
      if (key === 'q') handleBuild('Barracks');
      if (key === 'w') handleBuild('WarFactory');
      if (key === 'e') handleTrain('Worker');
      if (key === 'r') handleTrain('Ranger');
      if (key === 't') handleTrain('Tank');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGameOver]);

  const restartGame = () => {
    window.location.reload();
  };

  const activeSelected = selectedUnits.length === 1 ? selectedUnits[0] : selectedBuilding;

  return (
    <div className="min-h-screen bg-[#080d09] text-[#e2e8e2] font-mono flex flex-col items-center justify-center p-2 select-none">
      {/* Top UI Panel */}
      <UIOverlay
        money={money}
        energy={energy}
        maxEnergy={maxEnergy}
        enemyHqHp={enemyHqHp}
        selectedUnitsCount={selectedUnits.length}
        selectedEntity={activeSelected}
        audioEnabled={audioEnabled}
        onToggleAudio={() => setAudioEnabled(prev => !prev)}
        toast={toast}
        toastType={toastType}
      />

      {/* Canvas Area with Relative Toast and Modal */}
      <div className="relative">
        <GameCanvas
          money={money}
          setMoney={setMoney}
          energy={energy}
          setEnemyHqHp={setEnemyHqHp}
          selectedUnits={selectedUnits}
          setSelectedUnits={setSelectedUnits}
          selectedBuilding={selectedBuilding}
          setSelectedBuilding={setSelectedBuilding}
          audioEnabled={audioEnabled}
          onNotify={handleNotify}
          onGameOver={handleGameOver}
          buildQueue={buildQueue}
          setBuildQueue={setBuildQueue}
          trainQueue={trainQueue}
          setTrainQueue={setTrainQueue}
        />

        {/* Status Toast */}
        <div
          className={`absolute bottom-3 left-3 px-3.5 py-1.5 rounded text-xs transition-all pointer-events-none z-10 border ${
            toastType === 'danger'
              ? 'bg-[#280a0a]/95 text-[#ff6b6b] border-[#9c2e2e]'
              : toastType === 'success'
              ? 'bg-[#0a120b]/90 text-[#ffd152] border-[#8c732b]'
              : 'bg-[#0a120b]/90 text-[#92df96] border-[#39633c]'
          }`}
        >
          {toast}
        </div>

        {/* Game Over Banner Modal */}
        {isGameOver && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#080e09]/95 border-4 border-[#ffd152] p-8 rounded-lg text-center shadow-2xl z-50 min-w-[340px]">
            <h2
              className={`text-3xl font-extrabold tracking-widest mb-2 ${
                victory ? 'text-[#4caf50]' : 'text-[#f44336]'
              }`}
            >
              {victory ? "G'ALABA! (VICTORY)" : "MAG'LUBIYAT! (DEFEAT)"}
            </h2>
            <p className="text-sm text-[#c9d6ca] mb-6">
              {victory
                ? "Dushman bazasi yo'q qilindi! Siz maydonni to'liq ozod etdingiz."
                : "Bosh binongiz yo'q qilindi. Shahar dushman nazoratiga o'tdi."}
            </p>
            <button
              onClick={restartGame}
              className="bg-[#254d28] hover:bg-[#316635] text-white px-6 py-2.5 rounded font-bold border border-[#488a4c] cursor-pointer transition-all shadow-md"
            >
              Qaytadan o'ynash
            </button>
          </div>
        )}
      </div>

      {/* Command & Production HUD */}
      <BuildMenu
        onBuild={handleBuild}
        onTrain={handleTrain}
        selectedEntity={activeSelected}
        selectedUnitsCount={selectedUnits.length}
      />
    </div>
  );
};
