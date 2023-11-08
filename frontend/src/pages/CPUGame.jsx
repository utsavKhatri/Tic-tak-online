import { useState, useEffect, useMemo } from 'react';
import { Fireworks } from '@fireworks-js/react';
import { MdRestartAlt } from 'react-icons/md';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const CPUGame = () => {
  const { id } = useParams();
  const [board, setBoard] = useState(Array(9).fill(null));
  const [turn, setTurn] = useState('X');
  const [winner, setWinner] = useState(null);

  const makeMove = (index, player) => {
    if (board[index] === null && !winner) {
      const newBoard = board.slice();
      newBoard[index] = player;
      setBoard(newBoard);

      const result = checkWinner(newBoard);
      if (result === 'draw') {
        setWinner('draw');
        return toast.success("It's a draw!", {
          style: {
            border: '1px solid #004f71',
            padding: '5px',
            color: '#004f71',
            background: '#cce0ff',
          },
          iconTheme: {
            primary: '#004f71',
            secondary: '#cce0ff',
          },
        });
      } else if (result) {
        setWinner(result);
      } else {
        return setTurn(player === 'X' ? 'O' : 'X');
      }
    }
  };

  const restartGame = () => {
    setBoard(Array(9).fill(null));
    setTurn('X');
    setWinner(null);
  };

  const checkWinner = useMemo(() => {
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

    return (squares) => {
      for (let i = 0; i < lines.length; i++) {
        const [a, b, c] = lines[i];
        if (
          squares[a] &&
          squares[a] === squares[b] &&
          squares[a] === squares[c]
        ) {
          return squares[a];
        }
      }

      if (squares.every((cell) => cell !== null)) {
        return 'draw';
      }

      return null;
    };
  }, []);

  useEffect(() => {
    const cpuMove = () => {
      if (turn === 'O' && !winner) {
        const bestMoveIndex = findBestMove();
        if (bestMoveIndex >= 0) {
          makeMove(bestMoveIndex, 'O');
        }
      }
    };

    cpuMove();
  }, [board, turn, winner]);

  const minimax = (squares, depth, isMaximizing) => {
    const scores = {
      X: -1,
      O: 1,
      draw: 0,
    };

    const winner = checkWinner(squares);
    if (winner) {
      return scores[winner];
    }

    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let i = 0; i < squares.length; i++) {
        if (squares[i] === null) {
          squares[i] = 'O';
          const score = minimax(squares, depth + 1, false);
          squares[i] = null;
          bestScore = Math.max(score, bestScore);
        }
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (let i = 0; i < squares.length; i++) {
        if (squares[i] === null) {
          squares[i] = 'X';
          const score = minimax(squares, depth + 1, true);
          squares[i] = null;
          bestScore = Math.min(score, bestScore);
        }
      }
      return bestScore;
    }
  };

  const findBestMove = () => {
    let bestMove = -1;
    let bestScore = -Infinity;
    for (let i = 0; i < board.length; i++) {
      if (board[i] === null) {
        board[i] = 'O';
        const score = minimax(board, 0, false);
        board[i] = null;
        if (score > bestScore) {
          bestScore = score;
          bestMove = i;
        }
      }
    }
    return bestMove;
  };

  useEffect(() => {
    const cpuMove = () => {
      if (turn === 'O' && !winner) {
        const bestMoveIndex = findBestMove();
        if (bestMoveIndex >= 0) {
          makeMove(bestMoveIndex, 'O');
        }
      } else {
        if (winner && winner !== 'draw') {
          return toast.success(`Player ${winner} wins!`, {
            style: {
              border: '1px solid #00753b',
              padding: '5px',
              color: '#00753b',
              background: '#E0F2F1',
            },
            iconTheme: {
              primary: '#00753b',
              secondary: '#E0F2F1',
            },
          });
        }
      }
    };

    cpuMove();
  }, [board, turn, winner]);

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
        {board.map((cell, index) => (
          <button
            key={index}
            className={`w-16 h-16 md:w-24 md:h-24 text-4xl font-bold border border-gray-300 rounded transition-colors focus:outline-none ${
              cell === 'X'
                ? 'text-blue-600 hover:bg-blue-100'
                : 'text-red-600 hover:bg-red-100'
            }`}
            onClick={() => makeMove(index, 'X')}
          >
            {cell}
          </button>
        ))}
      </div>
      <div className="bg-white rounded-lg shadow-lg p-6 flex md:flex-row flex-col items-center gap-4 max-w-4xl w-full">
        <button
          className="px-4 py-2 z-20 text-white bg-red-600 rounded hover:bg-red-700 flex items-center w-full md:w-auto whitespace-nowrap"
          onClick={restartGame}
        >
          <span className="material-icons mr-2">
            <MdRestartAlt />
          </span>
          Restart Game
        </button>
        <Link to={`/game/${id}`} className="text-blue-600 hover:underline">
          Back to Player vs Player Game
        </Link>
      </div>
    </div>
  );
};

export default CPUGame;
