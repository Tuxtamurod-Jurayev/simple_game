/**
 * Command & Conquer: Mini-Generals 3D
 * 8-BO'LIM: MULTIPLAYER (WEBSOCKET / SOCKET.IO) VA REAL VAQTDA SINXRONIZATSIYA
 *
 * Client-side Socket.IO service for low-latency 1 vs 1 real-time matches
 */
import { io, Socket } from 'socket.io-client';
import { Faction, UnitTypeId, BuildingTypeId, Unit } from '../types/game';

export interface RemoteMoveData {
  unitIds: number[];
  targetX: number;
  targetY?: number;
  targetZ?: number;
  isAttackMoving?: boolean;
}

export interface RemoteAttackData {
  attackerIds: number[];
  targetId: number;
  targetType: 'unit' | 'building';
}

export interface RemoteSpawnData {
  unitType: UnitTypeId;
  faction: Faction;
  x: number;
  y: number;
  unitId: number;
}

export interface RemoteBuildingData {
  id: number;
  type: BuildingTypeId;
  faction: Faction;
  x: number;
  y: number;
}

export interface RemoteSyncData {
  units: { id: number; x: number; y: number; hp: number; targetX?: number | null; targetY?: number | null }[];
}

export class MultiplayerSystem {
  private static instance: MultiplayerSystem;
  private socket: Socket | null = null;

  public isConnected: boolean = false;
  public roomId: string | null = null;
  public playerNumber: 1 | 2 | null = null;
  public myFaction: Faction = 'USA';
  public opponentFaction: Faction | null = null;
  public isMultiplayerActive: boolean = false;

  // Event Listeners
  public onConnectionChange?: (connected: boolean, socketId?: string) => void;
  public onRoomJoined?: (data: {
    roomId: string;
    playerNumber: 1 | 2;
    faction: Faction;
    playerCount: number;
    opponent: { playerNumber: number; faction: Faction } | null;
  }) => void;
  public onPlayerJoined?: (data: { playerNumber: 1 | 2; faction: Faction; playerCount: number }) => void;
  public onGameReady?: (data: {
    roomId: string;
    player1: { socketId?: string; faction: Faction };
    player2: { socketId?: string; faction: Faction };
    startingCredits: number;
  }) => void;
  public onRoomFull?: (data: { message: string }) => void;
  public onRemoteMove?: (data: RemoteMoveData) => void;
  public onRemoteAttack?: (data: RemoteAttackData) => void;
  public onRemoteSpawn?: (data: RemoteSpawnData) => void;
  public onRemoteBuilding?: (data: RemoteBuildingData) => void;
  public onRemoteSuperweapon?: (data: { type: string; x: number; y: number }) => void;
  public onRemoteStateSync?: (data: RemoteSyncData) => void;
  public onOpponentDisconnected?: (data: { message: string }) => void;

  private constructor() {}

  public static getInstance(): MultiplayerSystem {
    if (!MultiplayerSystem.instance) {
      MultiplayerSystem.instance = new MultiplayerSystem();
    }
    return MultiplayerSystem.instance;
  }

  /**
   * Serverga ulanish (WebSocket / Socket.IO)
   */
  public connect(serverUrl?: string): Socket {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    const host = typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : 'localhost';
    const targetUrl = serverUrl || `http://${host}:3001`;

    console.log(`[Multiplayer] Serverga ulanmoqda: ${targetUrl}...`);

    this.socket = io(targetUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 8000
    });

    this.socket.on('connect', () => {
      console.log(`[Multiplayer] Serverga muvaffaqiyatli ulandi! Socket ID: ${this.socket?.id}`);
      this.isConnected = true;
      this.onConnectionChange?.(true, this.socket?.id);
    });

    this.socket.on('disconnect', reason => {
      console.warn(`[Multiplayer] Serverdan uzildi:`, reason);
      this.isConnected = false;
      this.onConnectionChange?.(false);
    });

    this.socket.on('connect_error', err => {
      console.error(`[Multiplayer] Ulanishda xatolik:`, err.message);
      this.isConnected = false;
      this.onConnectionChange?.(false);
    });

    // 1. Xonaga muvaffaqiyatli qo'shilganda
    this.socket.on('room_joined', data => {
      console.log(`[Multiplayer] room_joined:`, data);
      this.roomId = data.roomId;
      this.playerNumber = data.playerNumber;
      this.myFaction = data.faction;
      if (data.opponent) {
        this.opponentFaction = data.opponent.faction;
      }
      this.onRoomJoined?.(data);
    });

    // 2. Yangi o'yinchi xonaga kirganda
    this.socket.on('player_joined', data => {
      console.log(`[Multiplayer] player_joined:`, data);
      if (data.playerNumber !== this.playerNumber) {
        this.opponentFaction = data.faction;
      }
      this.onPlayerJoined?.(data);
    });

    // 3. Ikkala o'yinchi ham tayyor bo'lganda
    this.socket.on('game_ready', data => {
      console.log(`[Multiplayer] game_ready:`, data);
      this.onGameReady?.(data);
    });

    // 4. Xona to'lgan bo'lsa
    this.socket.on('room_full', data => {
      console.warn(`[Multiplayer] room_full:`, data.message);
      this.onRoomFull?.(data);
    });

    // 5. Masofaviy birlik harakati
    this.socket.on('remote_unit_move', (data: RemoteMoveData) => {
      this.onRemoteMove?.(data);
    });

    // 6. Masofaviy hujum buyrug'i
    this.socket.on('remote_unit_attack', (data: RemoteAttackData) => {
      this.onRemoteAttack?.(data);
    });

    // 7. Masofaviy birlik yaratilishi (Spawn)
    this.socket.on('remote_spawn_unit', (data: RemoteSpawnData) => {
      this.onRemoteSpawn?.(data);
    });

    // 8. Masofaviy bino qurilishi
    this.socket.on('remote_place_building', (data: RemoteBuildingData) => {
      this.onRemoteBuilding?.(data);
    });

    // 9. Masofaviy superqurol
    this.socket.on('remote_superweapon', (data: { type: string; x: number; y: number }) => {
      this.onRemoteSuperweapon?.(data);
    });

    // 10. Kadrlar sinxronizatsiyasi
    this.socket.on('remote_state_sync', (data: RemoteSyncData) => {
      this.onRemoteStateSync?.(data);
    });

    // 11. Raqib chiqib ketganda
    this.socket.on('opponent_disconnected', data => {
      console.warn(`[Multiplayer] opponent_disconnected:`, data.message);
      this.onOpponentDisconnected?.(data);
    });

    return this.socket;
  }

  /**
   * Xonaga kirish buyrug'i
   */
  public joinRoom(roomId: string, faction: Faction, startingCredits: number = 5000) {
    if (!this.socket || !this.isConnected) {
      this.connect();
    }
    this.roomId = roomId;
    this.myFaction = faction;
    this.isMultiplayerActive = true;

    this.socket?.emit('join_room', {
      roomId,
      faction,
      startingCredits
    });
  }

  /**
   * O'yinchining tank/piyodalarini harakatlantirish buyrug'i
   */
  public sendMove(unitIds: number[], targetX: number, targetY: number, isAttackMoving: boolean = false) {
    if (!this.isMultiplayerActive || !this.socket || !this.roomId) return;
    this.socket.emit('player_move', {
      roomId: this.roomId,
      unitIds,
      targetX,
      targetZ: targetY, // Three.js Z tekisligi
      targetY,
      isAttackMoving
    });
  }

  /**
   * Dushmanga hujum qilish buyrug'i (Attack Order)
   */
  public sendAttack(attackerIds: number[], targetId: number, targetType: 'unit' | 'building') {
    if (!this.isMultiplayerActive || !this.socket || !this.roomId) return;
    this.socket.emit('unit_attack', {
      roomId: this.roomId,
      attackerIds,
      targetId,
      targetType
    });
  }

  /**
   * Yangi tank yoki askar yetishtirilganda (Spawn Unit)
   */
  public sendSpawn(unitType: UnitTypeId, faction: Faction, x: number, y: number, unitId: number) {
    if (!this.isMultiplayerActive || !this.socket || !this.roomId) return;
    this.socket.emit('spawn_unit', {
      roomId: this.roomId,
      unitType,
      faction,
      x,
      y,
      unitId
    });
  }

  /**
   * Bino qurilganda (Place Building)
   */
  public sendBuildingPlace(id: number, type: BuildingTypeId, faction: Faction, x: number, y: number) {
    if (!this.isMultiplayerActive || !this.socket || !this.roomId) return;
    this.socket.emit('place_building', {
      roomId: this.roomId,
      id,
      type,
      faction,
      x,
      y
    });
  }

  /**
   * Superqurol ishga tushirilganda (Launch Superweapon)
   */
  public sendSuperweapon(type: string, x: number, y: number) {
    if (!this.isMultiplayerActive || !this.socket || !this.roomId) return;
    this.socket.emit('launch_superweapon', {
      roomId: this.roomId,
      type,
      x,
      y
    });
  }

  /**
   * Har 500ms - 1s da barcha birliklar pozitsiyasi va HP holatini sinxronlash
   */
  public sendStateSync(units: Unit[]) {
    if (!this.isMultiplayerActive || !this.socket || !this.roomId) return;
    const syncData: RemoteSyncData = {
      units: units.map(u => ({
        id: u.id,
        x: Math.round(u.x),
        y: Math.round(u.y),
        hp: Math.round(u.hp),
        targetX: u.targetX !== null ? Math.round(u.targetX) : null,
        targetY: u.targetY !== null ? Math.round(u.targetY) : null
      }))
    };
    this.socket.emit('game_state_sync', syncData);
  }

  /**
   * Xonadan chiqish
   */
  public leaveRoom() {
    this.isMultiplayerActive = false;
    this.roomId = null;
    this.playerNumber = null;
    this.opponentFaction = null;
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }
}

export const multiplayerService = MultiplayerSystem.getInstance();
