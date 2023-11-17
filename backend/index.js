const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const cron = require('node-cron');
const { default: axios } = require('axios');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:5173', // Replace with your frontend URL
  },
});

app.use(cors());
app.use(express.static('tic-tac-toe/build'));

const gameRooms = {};

function createGameRoom(roomId) {
  gameRooms[roomId] = {
    board: Array(9).fill(null),
    isXNext: true,
    playerCount: 0,
  };
}

function calculateWinner(board) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }

  return null;
}

function isBoardFull(board) {
  return board.every((cell) => cell !== null);
}

function calculateWinnerOrDraw(board) {
  const winner = calculateWinner(board);
  if (winner) {
    return { type: 'winner', winner };
  } else if (isBoardFull(board)) {
    return { type: 'draw' };
  }
  return { type: 'continue' };
}

io.on('connection', (socket) => {
  console.log(`New player connected: ${socket.id}`);

  socket.on('createRoom', (roomId) => {
    if (!gameRooms[roomId]) {
      createGameRoom(roomId);
      socket.join(roomId);
      gameRooms[roomId].playerCount++;
      const player = gameRooms[roomId].playerCount === 1 ? 'X' : 'O';
      socket.emit('playerAssignment', {
        player,
        turn: gameRooms[roomId].playerCount === 1 ? 'X' : 'O',
      });
    } else {
      socket.emit('roomError', { message: 'Room already exists' });
    }
  });

  socket.on('makeMove', (data) => {
    const { roomId, index } = data;
    const room = gameRooms[roomId];

    try {
      if (
        room &&
        !room.board[index] &&
        !calculateWinner(room.board) &&
        ((room.isXNext && data.player === 'X') ||
          (!room.isXNext && data.player === 'O'))
      ) {
        room.board[index] = room.isXNext ? 'X' : 'O';
        room.isXNext = !room.isXNext;
        const result = calculateWinnerOrDraw(room.board);

        if (result.type === 'continue') {
          io.to(roomId).emit('updateBoard', {
            board: room.board,
            isXNext: room.isXNext,
            winner: null,
            turn: room.isXNext ? 'X' : 'O',
          });
        } else if (result.type === 'winner') {
          io.to(roomId).emit('updateBoard', {
            board: room.board,
            isXNext: room.isXNext,
            winner: result.winner,
            turn: null,
          });
        } else if (result.type === 'draw') {
          io.to(roomId).emit('updateBoard', {
            board: room.board,
            isXNext: room.isXNext,
            winner: 'draw',
            turn: null,
          });
        }
      } else {
        throw new Error('Invalid move or player turn');
      }
    } catch (error) {
      console.error(`Error processing move: ${error.message}`);
      socket.emit('moveError', { message: error.message });
    }
  });

  socket.on('joinRoom', (roomId) => {
    const room = gameRooms[roomId];
    if (room && room.playerCount < 2) {
      socket.join(roomId);
      room.playerCount++;
      const player = room.playerCount === 1 ? 'X' : 'O';
      const turn = room.playerCount === 1 ? 'X' : 'O';
      socket.emit('playerAssignment', {
        player,
        turn,
      });
      io.to(roomId).emit('updateBoard', {
        board: room.board,
        isXNext: room.isXNext,
        winner: null,
        turn: turn,
      });

      if (room.playerCount === 2) {
        io.to(roomId).emit('bothPlayersJoined');
      }
    } else if (!room) {
      socket.emit('roomError', { message: 'Room does not exist' });
    } else if (room.playerCount >= 2) {
      socket.emit('roomError', { message: 'Room is full' });
    }
  });

  socket.on('restartGame', (roomId) => {
    const room = gameRooms[roomId];
    if (room) {
      room.board = Array(9).fill(null);
      room.isXNext = true;
      io.to(roomId).emit('updateBoard', {
        board: room.board,
        isXNext: true,
        winner: null,
        turn: 'X',
      });
      delete gameRooms[roomId];
    }
  });

  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
  });

  socket.on('error', (error) => {
    console.error(`Socket error for player ${socket.id}: ${error.message}`);
  });

  socket.on('disconnecting', () => {
    const rooms = Object.keys(socket.rooms);
    rooms.forEach((roomId) => {
      const room = gameRooms[roomId];
      if (room) {
        room.playerCount--; // Decrement player count on disconnect

        if (room.playerCount === 0) {
          // Handle scenarios when both players disconnect
          delete gameRooms[roomId]; // Remove the room if it becomes empty
        } else {
          // Handle when one player disconnects
          io.to(roomId).emit('playerDisconnected', { player: room.isXNext ? 'O' : 'X' });
        }
      }
    });
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

cron.schedule('*/15 * * * *', () => {
  Object.keys(gameRooms).forEach((roomId) => {
    const roomData = gameRooms[roomId];
    if (roomData.playerCount === 0 || roomData.playerCount === 1) {
      delete gameRooms[roomId];
      console.log(`Room ${roomId} removed due to empty or single player.`);
    }
  });
  axios.get('https://example.com').then(() => {
    console.log('success keep running');
  });
});
