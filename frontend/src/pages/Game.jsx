import { useState, useEffect } from 'react';
import socketIOClient from 'socket.io-client';
import '../App.css';
import { TbArrowsJoin, TbHomePlus } from 'react-icons/tb';
import { MdRestartAlt } from 'react-icons/md';
const ENDPOINT = 'http://localhost:5000';
import { Fireworks } from '@fireworks-js/react';
import toast from 'react-hot-toast';
import { useParams } from 'react-router-dom';

const Game = () => {
  const { id } = useParams();
  const [socket, setSocket] = useState(null);
  const [roomId, setRoomId] = useState('');
  const [player, setPlayer] = useState(null);
  const [turn, setTurn] = useState(null);
  const [board, setBoard] = useState(Array(9).fill(null));
  const [winner, setWinner] = useState(null);
  const [isCreated, setIsCreated] = useState(false);

  const restartGame = () => {
    if (socket) {
      setIsCreated(false);
      socket.emit('restartGame', roomId);
    }
  };
  useEffect(() => {
    const socket = socketIOClient(ENDPOINT);
    setSocket(socket);

    socket.on('playerAssignment', ({ player, turn }) => {
      if (!player || !turn) {
        // Room is full, or an error occurred
        // Handle this situation as needed
        return;
      }
      setPlayer(player);
      setTurn(turn);
    });

    socket.on('updateBoard', ({ board, winner, turn }) => {
      setBoard(board);
      if (winner != null) {
        if (winner === 'draw') {
          toast('💀 Game Draw!');
        }
        toast('🎊 Congratulations! winner : ' + winner);
      }
      setWinner(winner);
      setTurn(turn);
    });

    socket.on('roomError', ({ message }) => {
      toast(message);
    });

    socket.on('moveError', ({ message }) => {
      toast(message);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const createRoom = () => {
    if (socket) {
      setIsCreated(true);
      socket.emit('createRoom', id);
    }
  };

  const joinRoom = () => {
    if (socket) {
      socket.emit('joinRoom', roomId);
    }
  };

  const makeMove = (index) => {
    if (socket) {
      socket.emit('makeMove', { roomId, index, player });
    }
  };

  const getStatus = () => {
    if (winner) {
      return `Winner: ${winner}`;
    } else if (board.every((cell) => cell !== null)) {
      return 'Draw!';
    } else {
      return `Next player: ${turn}`;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      {winner && (
        <Fireworks
          options={{ opacity: 0.5 }}
          style={{
            top: 0,
            left: 0,
            position: 'fixed',
            width: '100%',
            height: '65%',
            background: 'transparent',
          }}
        />
      )}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8 grid grid-cols-3 grid-rows-3 gap-4">
        {Array(9)
          .fill(null)
          .map((_, i) => (
            <button
              key={i + 1}
              className={`w-16 h-16 md:w-24 md:h-24 text-4xl font-bold border border-gray-300 rounded transition-colors focus:outline-none ${
                board[i] === 'X'
                  ? 'text-blue-600 hover:bg-blue-100'
                  : 'text-red-600 hover:bg-red-100'
              }`}
              onClick={() => makeMove(i)}
            >
              {board[i]}
            </button>
          ))}
      </div>
      <div className="bg-white rounded-lg shadow-lg p-6 flex md:flex-row flex-col items-center gap-4 max-w-4xl w-full">
        {getStatus() !== 'Next player: null' && (
          <div className="w-max whitespace-nowrap">
            <div className="font-bold text-2xl text-center">{getStatus()}</div>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 w-full items-center">
          {!isCreated && (
            <>
              <button
                className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 flex items-center w-full whitespace-nowrap"
                onClick={createRoom}
              >
                <span className="material-icons mr-2">
                  <TbHomePlus />
                </span>
                Create Board
              </button>
              <div className="w-auto grid grid-cols-3 items-center">
                <hr className="h-px" />
                <span className="mx-auto">OR</span>
                <hr className="h-px" />
              </div>
            </>
          )}
          <input
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="border border-gray-300 p-2 rounded w-full md:w-auto whitespace-nowrap"
            placeholder="Enter Room ID"
          />
          <button
            className="px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700 flex items-center w-full whitespace-nowrap"
            onClick={joinRoom}
          >
            <span className="material-icons mr-2">
              <TbArrowsJoin />
            </span>
            Join Board
          </button>
          <button
            className="px-4 py-2 z-20 text-white bg-red-600 rounded hover:bg-red-700 flex items-center w-full md:w-auto whitespace-nowrap"
            onClick={restartGame}
          >
            <span className="material-icons mr-2">
              <MdRestartAlt />
            </span>
            Restart Game
          </button>
        </div>
      </div>
    </div>
  );
};

export default Game;
