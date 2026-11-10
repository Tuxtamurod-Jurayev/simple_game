import React, { useState, useEffect } from 'react';
import { Faction, Difficulty, GameSettings } from '../types/game';
import { playBuildSound } from '../systems/audioSystem';
import { multiplayerService } from '../systems/multiplayerSystem';

interface SkirmishMenuProps {
  onStartGame: (settings: GameSettings) => void;
}

export const SkirmishMenu: React.FC<SkirmishMenuProps> = ({ onStartGame }) => {
  // Game Mode: Singleplayer (AI) or Multiplayer (1 vs 1)
  const [gameMode, setGameMode] = useState<'single' | 'multiplayer'>('single');
  const [playerFaction, setPlayerFaction] = useState<Faction>('USA');
  const [enemyFaction, setEnemyFaction] = useState<Faction>('China');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [startingCredits, setStartingCredits] = useState<number>(5000);
  const [isDeploying, setIsDeploying] = useState<boolean>(false);

  // Multiplayer Room State
  const [roomId, setRoomId] = useState<string>('BATTLE_ROOM_1');
  const [serverOnline, setServerOnline] = useState<boolean>(false);
  const [roomJoined, setRoomJoined] = useState<boolean>(false);
  const [playerNumber, setPlayerNumber] = useState<1 | 2 | null>(null);
  const [playerCount, setPlayerCount] = useState<number>(1);
  const [opponentFaction, setOpponentFaction] = useState<Faction | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const factions = [
    {
      id: 'USA' as Faction,
      name: 'USA',
      sub: 'Yuqori texnologiya',
      color: 'from-blue-600/30 to-blue-950/80',
      border: 'border-blue-500',
      accent: 'text-blue-400',
      features: ['Paladin lazer tanki', 'Chinook vertolyoti', 'Zarracha to\'pi'],
      stats: { attack: '85%', armor: '75%', tech: '100%' }
    },
    {
      id: 'China' as Faction,
      name: 'Xitoy',
      sub: 'Og\'ir zirh & o\'rda',
      color: 'from-red-600/30 to-red-950/80',
      border: 'border-red-500',
      accent: 'text-red-400',
      features: ['Overlord supertanki', 'Gatling tezotar to\'pi', 'Yadroviy raketa'],
      stats: { attack: '100%', armor: '95%', tech: '70%' }
    },
    {
      id: 'GLA' as Faction,
      name: 'GLA',
      sub: 'Partizan & Salvage',
      color: 'from-emerald-600/30 to-emerald-950/80',
      border: 'border-emerald-500',
      accent: 'text-emerald-400',
      features: ['Elektr talab etilmaydi', 'Salvage qurol kuchi', 'Skad bo\'roni'],
      stats: { attack: '80%', armor: '60%', tech: '85%' }
    }
  ];

  // Socket.IO Setup for Multiplayer Mode
  useEffect(() => {
    if (gameMode !== 'multiplayer') return;

    multiplayerService.connect();

    multiplayerService.onConnectionChange = (connected) => {
      setServerOnline(connected);
      if (connected) {
        setStatusMessage('Serverga ulandi. Xonaga qo\'shilishingiz mumkin.');
      } else {
        setStatusMessage('Serverga ulanish kutilmoqda (Port: 3001)...');
        setRoomJoined(false);
      }
    };

    multiplayerService.onRoomJoined = (data) => {
      setRoomJoined(true);
      setPlayerNumber(data.playerNumber);
      setPlayerCount(data.playerCount);
      if (data.opponent) {
        setOpponentFaction(data.opponent.faction);
        setEnemyFaction(data.opponent.faction);
        setStatusMessage(`Raqib ulandi! Fraktsiyasi: ${data.opponent.faction}`);
      } else {
        setStatusMessage('Xona ochildi. Ikkinchi o\'yinchi kutilmoqda (1/2)...');
      }
    };

    multiplayerService.onPlayerJoined = (data) => {
      setPlayerCount(data.playerCount);
      setOpponentFaction(data.faction);
      setEnemyFaction(data.faction);
      setStatusMessage(`2-O'yinchi kirdi! Fraktsiyasi: ${data.faction}`);
    };

    multiplayerService.onGameReady = (data) => {
      setPlayerCount(2);
      const oppFaction = data.player1.faction === playerFaction ? data.player2.faction : data.player1.faction;
      setOpponentFaction(oppFaction);
      setEnemyFaction(oppFaction);
      setStatusMessage('Ikkala o\'yinchi tayyor! Jangni boshlashingiz mumkin!');
    };

    multiplayerService.onRoomFull = (data) => {
      setStatusMessage(data.message);
      setRoomJoined(false);
    };

    return () => {
      // Keep connection or clean listeners
    };
  }, [gameMode, playerFaction]);

  // Join Multiplayer Room
  const handleJoinMultiplayerRoom = () => {
    if (!roomId.trim()) return;
    multiplayerService.joinRoom(roomId.trim(), playerFaction, startingCredits);
    playBuildSound();
  };

  const handleStart = () => {
    setIsDeploying(true);
    playBuildSound();
    setTimeout(() => {
      onStartGame({
        playerFaction,
        enemyFaction: gameMode === 'multiplayer' && opponentFaction ? opponentFaction : enemyFaction,
        difficulty,
        startingCredits,
        isMultiplayer: gameMode === 'multiplayer',
        roomId: gameMode === 'multiplayer' ? roomId : undefined,
        playerNumber: gameMode === 'multiplayer' ? (playerNumber ?? 1) : 1
      });
    }, 450);
  };

  return (
    <div className="w-screen h-screen fixed inset-0 bg-[#050906] flex items-center justify-center p-2 sm:p-4 font-mono select-none overflow-y-auto">
      {/* Background Military Radar Sweeper */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-20">
        <div className="w-[750px] h-[750px] rounded-full border border-emerald-500/30 relative flex items-center justify-center">
          <div className="w-[500px] h-[500px] rounded-full border border-emerald-500/20" />
          <div className="w-[250px] h-[250px] rounded-full border border-emerald-500/20" />
          <div className="absolute w-full h-[1px] bg-emerald-500/20" />
          <div className="absolute h-full w-[1px] bg-emerald-500/20" />
          <div className="absolute w-full h-full rounded-full animate-spin [animation-duration:8s] bg-gradient-to-tr from-transparent via-transparent to-emerald-500/20 pointer-events-none" />
        </div>
      </div>

      {/* Main Tactical Skirmish Card */}
      <div className="relative z-10 w-full max-w-4xl my-auto bg-[#0c140e]/95 border-2 border-amber-500/80 rounded-xl p-3 sm:p-5 shadow-2xl backdrop-blur-md flex flex-col gap-3 sm:gap-4 max-h-[96vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700/80 pb-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <div>
              <h1 className="text-lg sm:text-xl font-black tracking-widest text-amber-400 uppercase drop-shadow">
                C&C: GENERALS 3D
              </h1>
              <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold">
                Harbiy Taktika • 3D Three.js & Socket.IO Multiplayer
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {gameMode === 'multiplayer' && (
              <div className={`text-[9px] sm:text-[10px] px-2 py-0.5 rounded font-bold border ${
                serverOnline
                  ? 'bg-emerald-950/80 border-emerald-500 text-emerald-400'
                  : 'bg-red-950/80 border-red-500 text-red-400'
              }`}>
                {serverOnline ? '● SERVER ONLINE (3001)' : '○ SERVER OFFLINE'}
              </div>
            )}
            <div className="text-[9px] sm:text-[10px] text-emerald-400 bg-emerald-950/70 border border-emerald-500/40 px-2 sm:px-2.5 py-0.5 rounded font-bold shrink-0">
              60 FPS
            </div>
          </div>
        </div>

        {/* Mode Switcher: Singleplayer vs Multiplayer */}
        <div className="grid grid-cols-2 gap-2 bg-black/60 p-1.5 rounded-lg border border-slate-700/80">
          <button
            onClick={() => setGameMode('single')}
            className={`py-2 text-xs sm:text-sm font-black tracking-wider uppercase rounded transition flex items-center justify-center gap-2 cursor-pointer ${
              gameMode === 'single'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <span>⚔️ YAKKA JANG (AI)</span>
          </button>
          <button
            onClick={() => setGameMode('multiplayer')}
            className={`py-2 text-xs sm:text-sm font-black tracking-wider uppercase rounded transition flex items-center justify-center gap-2 cursor-pointer ${
              gameMode === 'multiplayer'
                ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <span>🌐 MULTIPLAYER (1 VS 1)</span>
          </button>
        </div>

        {/* Multiplayer Room Controls Panel (Only when Multiplayer is selected) */}
        {gameMode === 'multiplayer' && (
          <div className="bg-cyan-950/30 border border-cyan-500/40 rounded-lg p-3 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex-1 w-full flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <label className="text-[10px] sm:text-[11px] font-black text-cyan-300 uppercase tracking-wider shrink-0">
                Xona Kodi:
              </label>
              <input
                type="text"
                value={roomId}
                onChange={e => setRoomId(e.target.value.toUpperCase())}
                placeholder="XONA NOMI (MASALAN: BATTLE_1)"
                className="bg-black/80 border border-cyan-500/50 rounded px-2.5 py-1 text-xs text-cyan-200 font-bold focus:outline-none focus:border-cyan-300 w-full sm:w-56"
              />
              <button
                onClick={handleJoinMultiplayerRoom}
                className="px-4 py-1 bg-cyan-600 hover:bg-cyan-500 text-black font-black text-xs rounded transition shadow cursor-pointer shrink-0"
              >
                {roomJoined ? '✓ XONADASIZ' : 'XONAGA KIRISH'}
              </button>
            </div>

            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-300 bg-black/60 px-3 py-1.5 rounded border border-slate-700/80 shrink-0">
              <span className={`w-2 h-2 rounded-full ${roomJoined ? (playerCount === 2 ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400') : 'bg-slate-500'}`} />
              <span>
                {roomJoined
                  ? `O'yinchi #${playerNumber || 1} (${playerCount}/2 o'yinchi)`
                  : 'Xonaga ulanmagan'}
              </span>
            </div>
          </div>
        )}

        {/* Status Message Alert */}
        {gameMode === 'multiplayer' && statusMessage && (
          <div className="text-[10px] sm:text-[11px] px-3 py-1.5 rounded bg-black/50 border border-amber-500/30 text-amber-300 font-bold flex items-center gap-2">
            <span className="text-amber-400 animate-pulse">ℹ</span>
            <span>{statusMessage}</span>
          </div>
        )}

        {/* 1. Faction Selection (Responsive Cards) */}
        <div>
          <label className="text-[10px] sm:text-[11px] font-black text-amber-300 uppercase tracking-wider block mb-1.5 sm:mb-2">
            1. SIZNING FRAKTSIYANGIZ:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
            {factions.map(f => {
              const isSelected = playerFaction === f.id;
              return (
                <div
                  key={f.id}
                  onClick={() => setPlayerFaction(f.id)}
                  className={`cursor-pointer rounded-lg p-2.5 sm:p-3 border-2 transition-all duration-200 relative overflow-hidden bg-gradient-to-b ${f.color} ${
                    isSelected
                      ? `${f.border} shadow-lg scale-[1.01] bg-opacity-95`
                      : 'border-slate-700/80 hover:border-slate-500 opacity-75 hover:opacity-100'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-0 right-0 bg-amber-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded-bl uppercase">
                      ✓
                    </div>
                  )}

                  <div className="flex items-baseline justify-between mb-0.5">
                    <span className="text-sm font-black text-white tracking-wide">{f.name}</span>
                  </div>
                  <div className={`text-[10px] font-bold ${f.accent} mb-1.5`}>{f.sub}</div>

                  {/* Bullet points */}
                  <div className="space-y-1 text-[9px] sm:text-[10px] text-slate-200 mb-2 border-t border-white/10 pt-1.5">
                    {f.features.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>

                  {/* Stats Bar */}
                  <div className="grid grid-cols-3 gap-1 text-[9px] text-slate-300 border-t border-white/10 pt-1.5 text-center">
                    <div>
                      <span className="text-slate-400 block">Hujum</span>
                      <span className="font-bold text-amber-300">{f.stats.attack}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Zirh</span>
                      <span className="font-bold text-sky-300">{f.stats.armor}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Tech</span>
                      <span className="font-bold text-emerald-300">{f.stats.tech}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Tactical Settings Grid (Responsive) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5 border-t border-slate-700/80 pt-2 sm:pt-2.5">
          {/* Raqib Fraktsiyasi */}
          <div className="bg-black/60 border border-slate-700 rounded p-2">
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 block mb-1 uppercase">
              {gameMode === 'multiplayer' ? '2. RAQIB (MULTIPLAYER):' : '2. RAQIB (AI):'}
            </span>
            {gameMode === 'multiplayer' ? (
              <div className="py-2 px-2 text-center bg-cyan-950/40 border border-cyan-500/40 rounded text-cyan-300 text-xs font-bold">
                {opponentFaction ? `Raqib: ${opponentFaction}` : "Raqib ulanishi kutilmoqda..."}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1">
                {(['USA', 'China', 'GLA'] as Faction[]).map(f => (
                  <button
                    key={f}
                    onClick={() => setEnemyFaction(f)}
                    className={`py-1 text-[11px] sm:text-xs font-bold rounded transition cursor-pointer ${
                      enemyFaction === f
                        ? 'bg-red-600 text-white shadow'
                        : 'bg-[#141e16] text-slate-400 hover:text-white'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* AI Qiyinchilik Darajasi (Only for Singleplayer) */}
          <div className="bg-black/60 border border-slate-700 rounded p-2">
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 block mb-1 uppercase">
              {gameMode === 'multiplayer' ? '3. REJIM:' : '3. AI DARAJASI:'}
            </span>
            {gameMode === 'multiplayer' ? (
              <div className="py-2 px-2 text-center bg-emerald-950/40 border border-emerald-500/40 rounded text-emerald-300 text-xs font-bold">
                PvP (1 vs 1 Tarmoqli)
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1">
                {[
                  { id: 'easy' as Difficulty, label: 'Oson' },
                  { id: 'medium' as Difficulty, label: 'O\'rta' },
                  { id: 'hard' as Difficulty, label: 'Qiyin' }
                ].map(d => (
                  <button
                    key={d.id}
                    onClick={() => setDifficulty(d.id)}
                    className={`py-1 text-[11px] sm:text-xs font-bold rounded transition cursor-pointer ${
                      difficulty === d.id
                        ? 'bg-amber-500 text-black shadow'
                        : 'bg-[#141e16] text-slate-400 hover:text-white'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Boshlang'ich Mablag' */}
          <div className="bg-black/60 border border-slate-700 rounded p-2">
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 block mb-1 uppercase">
              4. MABLAG':
            </span>
            <div className="grid grid-cols-3 gap-1">
              {[2500, 5000, 10000].map(cash => (
                <button
                  key={cash}
                  onClick={() => setStartingCredits(cash)}
                  className={`py-1 text-[11px] sm:text-xs font-bold rounded transition cursor-pointer ${
                    startingCredits === cash
                      ? 'bg-emerald-600 text-white shadow'
                      : 'bg-[#141e16] text-slate-400 hover:text-white'
                  }`}
                >
                  ${cash}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Launch Button */}
        <button
          onClick={handleStart}
          disabled={isDeploying || (gameMode === 'multiplayer' && !serverOnline && !roomJoined)}
          className={`w-full py-2.5 sm:py-3 text-xs sm:text-sm font-black tracking-widest uppercase rounded-lg shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 border-2 ${
            isDeploying
              ? 'bg-emerald-400 text-black border-emerald-300 scale-[0.99] animate-pulse'
              : gameMode === 'multiplayer'
              ? 'bg-gradient-to-r from-cyan-500 via-cyan-400 to-cyan-500 hover:from-cyan-400 hover:to-cyan-300 text-black border-cyan-300 shadow-cyan-500/20 hover:scale-[1.005]'
              : 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-black border-amber-300 shadow-amber-500/20 hover:scale-[1.005]'
          }`}
        >
          <span>
            {isDeploying
              ? 'JANGGA KIRILMOQDA...'
              : gameMode === 'multiplayer'
              ? 'MULTIPLAYER JANGINI BOSHLASH'
              : 'JANGNI BOSHLASH'}
          </span>
          <span className="text-base sm:text-lg">➔</span>
        </button>
      </div>
    </div>
  );
};
