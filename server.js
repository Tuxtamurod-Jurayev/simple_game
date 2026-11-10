/**
 * Command & Conquer: Mini-Generals 3D
 * 8-BO'LIM: Node.js + Socket.IO Authoritative Relay Server
 * 1 vs 1 Real-time Multiplayer & Room Synchronization
 */
import http from 'node:http';
import { Server } from 'socket.io';

const PORT = process.env.PORT || 3001;

// HTTP Health Check Server
const httpServer = http.createServer((req, res) => {
  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(
    JSON.stringify({
      status: 'online',
      game: 'Command & Conquer: Mini-Generals 3D',
      version: '0.8.0',
      port: PORT,
      timestamp: new Date().toISOString()
    })
  );
});

// Socket.IO Server with unrestricted CORS
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  pingInterval: 10000,
  pingTimeout: 5000
});

// Room registry
const rooms = new Map();

io.on('connection', socket => {
  console.log(`[Multiplayer] Yangi o'yinchi ulandi: ${socket.id}`);

  let currentRoomId = null;

  // 1. Join or Create Room
  socket.on('join_room', data => {
    const { roomId = 'BATTLE_ROOM_1', faction = 'USA', startingCredits = 5000 } = data || {};
    currentRoomId = roomId;

    let room = rooms.get(roomId);
    if (!room) {
      room = {
        roomId,
        players: new Map(),
        gameStarted: false,
        startingCredits
      };
      rooms.set(roomId, room);
    }

    // Check if room already has 2 players
    if (room.players.size >= 2 && !room.players.has(socket.id)) {
      socket.emit('room_full', {
        message: 'Bu xonada allaqachon 2 ta o\'yinchi bor. Iltimos boshqa xona tanlang!'
      });
      return;
    }

    // Determine player number (1 or 2)
    const existingPlayerNumbers = Array.from(room.players.values()).map(p => p.playerNumber);
    const assignedPlayerNumber = existingPlayerNumbers.includes(1) ? 2 : 1;

    const session = {
      socketId: socket.id,
      playerNumber: assignedPlayerNumber,
      faction,
      ready: true
    };
    room.players.set(socket.id, session);
    socket.join(roomId);

    console.log(
      `[Multiplayer] O'yinchi [${socket.id}] xonaga kirdi: "${roomId}" (O'yinchi #${assignedPlayerNumber}, Fraktsiya: ${faction})`
    );

    // Find opponent if present
    const opponentSession = Array.from(room.players.values()).find(p => p.socketId !== socket.id);

    // Notify joining player
    socket.emit('room_joined', {
      roomId,
      playerNumber: assignedPlayerNumber,
      faction,
      startingCredits: room.startingCredits,
      playerCount: room.players.size,
      opponent: opponentSession
        ? { playerNumber: opponentSession.playerNumber, faction: opponentSession.faction }
        : null
    });

    // Notify other player in the room
    socket.to(roomId).emit('player_joined', {
      playerNumber: assignedPlayerNumber,
      faction,
      playerCount: room.players.size
    });

    // If both players joined, notify game ready
    if (room.players.size === 2) {
      const p1 = Array.from(room.players.values()).find(p => p.playerNumber === 1);
      const p2 = Array.from(room.players.values()).find(p => p.playerNumber === 2);

      io.to(roomId).emit('game_ready', {
        roomId,
        player1: { socketId: p1?.socketId, faction: p1?.faction },
        player2: { socketId: p2?.socketId, faction: p2?.faction },
        startingCredits: room.startingCredits
      });
      console.log(`[Multiplayer] "${roomId}" xonasida ikkala o'yinchi tayyor! Jang boshlanishi mumkin.`);
    }
  });

  // 2. Unit Movement Relay
  socket.on('player_move', moveData => {
    if (!currentRoomId) return;
    // Harakat buyrug'ini xonadagi ikkinchi o'yinchiga uzatish
    socket.to(currentRoomId).emit('remote_unit_move', moveData);
  });

  // 3. Unit Spawn Relay (Training complete)
  socket.on('spawn_unit', spawnData => {
    if (!currentRoomId) return;
    socket.to(currentRoomId).emit('remote_spawn_unit', spawnData);
  });

  // 4. Attack Order Relay
  socket.on('unit_attack', attackData => {
    if (!currentRoomId) return;
    socket.to(currentRoomId).emit('remote_unit_attack', attackData);
  });

  // 5. Building Placement Relay
  socket.on('place_building', buildData => {
    if (!currentRoomId) return;
    socket.to(currentRoomId).emit('remote_place_building', buildData);
  });

  // 6. Superweapon Strike Relay
  socket.on('launch_superweapon', swData => {
    if (!currentRoomId) return;
    socket.to(currentRoomId).emit('remote_superweapon', swData);
  });

  // 7. General Powers Relay
  socket.on('trigger_power', powerData => {
    if (!currentRoomId) return;
    socket.to(currentRoomId).emit('remote_power', powerData);
  });

  // 8. Game State Sync Relay (Periodic sync of unit coordinates & HP)
  socket.on('game_state_sync', syncData => {
    if (!currentRoomId) return;
    socket.to(currentRoomId).emit('remote_state_sync', syncData);
  });

  // 9. Player Disconnect Handling
  socket.on('disconnect', () => {
    console.log(`[Multiplayer] O'yinchi chiqib ketdi: ${socket.id}`);
    if (currentRoomId && rooms.has(currentRoomId)) {
      const room = rooms.get(currentRoomId);
      room.players.delete(socket.id);

      // Notify remaining player
      socket.to(currentRoomId).emit('opponent_disconnected', {
        message: "Raqib aloqasi uzildi! O'yin yakunlandi."
      });

      if (room.players.size === 0) {
        rooms.delete(currentRoomId);
        console.log(`[Multiplayer] Bo'sh xona tozalandi: "${currentRoomId}"`);
      }
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` COMMAND & CONQUER: MINI-GENERALS 3D MULTIPLAYER   `);
  console.log(` WebSocket & Socket.IO Server faol: port ${PORT}    `);
  console.log(` URL: http://localhost:${PORT}                      `);
  console.log(`====================================================`);
});
