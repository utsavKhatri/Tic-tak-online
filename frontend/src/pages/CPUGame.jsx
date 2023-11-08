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
  const [playerXWins, setPlayerXWins] = useState(
    parseInt(localStorage.getItem('playerXWins')) || 0
  );
  const [playerOWins, setPlayerOWins] = useState(
    parseInt(localStorage.getItem('playerOWins')) || 0
  );
  const [totalGamesPlayed, setTotalGamesPlayed] = useState(
    parseInt(localStorage.getItem('totalGamesPlayed')) || 0
  );
  const [totalDrawGames, setTotalDrawGames] = useState(0);

  const updatePlayerWins = (player) => {
    if (player === 'X') {
      setPlayerXWins((prev) => prev + 1);
      localStorage.setItem('playerXWins', playerXWins + 1);
    } else if (player === 'O') {
      setPlayerOWins((prev) => prev + 1);
      localStorage.setItem('playerOWins', playerOWins + 1);
    }
    setTotalGamesPlayed((prev) => prev + 1);
    localStorage.setItem('totalGamesPlayed', totalGamesPlayed + 1);
  };

  const getPlayerWinPercentage = (playerWins) => {
    return totalGamesPlayed === 0
      ? 0
      : ((playerWins / totalGamesPlayed) * 100).toFixed(2);
  };
  const makeMove = (index, player) => {
    if (board[index] === null && !winner) {
      const newBoard = board.slice();
      newBoard[index] = player;
      setBoard(newBoard);

      const result = checkWinner(newBoard);
      if (result === 'draw') {
        setWinner('draw');
        setTotalDrawGames((prev) => prev + 1);
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
        updatePlayerWins(result);
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

  useEffect(() => {
    // Load stats from localStorage when the component mounts
    const playerXWins = parseInt(localStorage.getItem('playerXWins')) || 0;
    const playerOWins = parseInt(localStorage.getItem('playerOWins')) || 0;
    const totalGamesPlayed =
      parseInt(localStorage.getItem('totalGamesPlayed')) || 0;

    setPlayerXWins(playerXWins);
    setPlayerOWins(playerOWins);
    setTotalGamesPlayed(totalGamesPlayed);

    // Add an event listener for when the user leaves the website or route
    const handleUnload = () => {
      // Clear stats from localStorage
      localStorage.removeItem('playerXWins');
      localStorage.removeItem('playerOWins');
      localStorage.removeItem('totalGamesPlayed');
    };

    window.addEventListener('beforeunload', handleUnload);

    // Clean up the event listener when the component unmounts
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="overflow-x-auto max-w-4xl w-full">
        <table className="max-w-4xl w-full bg-white border border-gray-300 rounded-lg shadow-lg mb-4">
          <thead>
            <tr className="bg-slate-900 text-white text-left">
              <th className="text-lg font-bold p-2">Player</th>
              <th className="text-lg font-bold p-2">Wins</th>
              <th className="text-lg font-bold p-2">Win %</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-2 text-md font-semibold">Player X</td>
              <td className="p-2 text-md">{playerXWins}</td>
              <td className="p-2 text-md">
                {getPlayerWinPercentage(playerXWins)}%
              </td>
            </tr>
            <tr>
              <td className="p-2 text-md font-semibold">Player O</td>
              <td className="p-2 text-md">{playerOWins}</td>
              <td className="p-2 text-md">
                {getPlayerWinPercentage(playerOWins)}%
              </td>
            </tr>
            <tr>
              <td className="p-2 text-md font-semibold">Draw Games</td>
              <td className="p-2 text-md" colSpan="2">
                {totalDrawGames}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

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
