import { useState, useEffect, useMemo } from 'react';
import { Fireworks } from '@fireworks-js/react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import '../App.css';
import { MdRestartAlt } from 'react-icons/md';

const CPUGame = () => {
  const { id } = useParams();
  const [board, setBoard] = useState(Array(9).fill(null));
  const [turn, setTurn] = useState('X');
  const [winner, setWinner] = useState(null);
  const [cpuStarted, setCpuStarted] = useState(false);

  const [playerXWins, setPlayerXWins] = useState(
    parseInt(localStorage.getItem('playerXWins')) || 0
  );
  const [playerOWins, setPlayerOWins] = useState(
    parseInt(localStorage.getItem('playerOWins')) || 0
  );
  const [totalGamesPlayed, setTotalGamesPlayed] = useState(
    parseInt(localStorage.getItem('totalGamesPlayed')) || 0
  );
  const [totalDrawGames, setTotalDrawGames] = useState(
    parseInt(localStorage.getItem('totalDrawGames')) || 0
  );
  const updatePlayerWins = (player) => {
    setTotalGamesPlayed((prev) => prev + 1);

    if (player === 'X') {
      setPlayerXWins((prev) => {
        const newXWins = prev + 1;
        localStorage.setItem('playerXWins', newXWins);
        return newXWins;
      });
    } else if (player === 'O') {
      setPlayerOWins((prev) => {
        const newOWins = prev + 1;
        localStorage.setItem('playerOWins', newOWins);
        return newOWins;
      });
    } else if (player === 'draw') {
      setTotalDrawGames((prev) => {
        const newDrawGames = prev + 1;
        localStorage.setItem('totalDrawGames', newDrawGames);
        return newDrawGames;
      });
    }
  };

  const getPlayerWinPercentage = (playerWins) => {
    return totalGamesPlayed === 0
      ? 0
      : ((playerWins / totalGamesPlayed) * 100).toFixed(2);
  };
  const makeMove = (index, player, isInEffect) => {
    if (board[index] === null && !winner) {
      const newBoard = board.slice();
      newBoard[index] = player;
      setBoard(newBoard);

      const result = checkWinner(newBoard);

      if (result === 'draw') {
        setWinner('draw');
        if (!isInEffect) {
          updatePlayerWins('draw');
        }
      } else if (result) {
        setWinner(result);
        setCpuStarted(false);
        if (!isInEffect) {
          updatePlayerWins(result);
        }
      } else {
        return setTurn(player === 'X' ? 'O' : 'X');
      }
    }
  };

  const restartGame = () => {
    setBoard(Array(9).fill(null));
    setWinner(null);
    setTurn('X');
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

  const prioritizePlayerWin = () => {
    const availableSpots = [];
    for (let i = 0; i < board.length; i++) {
      if (board[i] === null) {
        availableSpots.push(i);
      }
    }

    // Calculate the ratio of wins between player 'X' and player 'O'
    const winRatio = playerXWins / (playerOWins + 1); // Adding 1 to avoid division by zero

    // If the ratio reaches 1:33 or greater for the player 'X' to player 'O' wins, increase chances for 'X' to win
    if (winRatio >= 1 / 33) {
      // Randomize the CPU moves to increase the real player's chances
      const randomIndex = Math.floor(Math.random() * availableSpots.length);
      return availableSpots[randomIndex]; // Return a random available spot
    }

    // Default behavior if the win ratio condition isn't met
    // Implement the default logic to prioritize moves as before
    const centerSpot = 4; // Center spot in a standard 3x3 Tic Tac Toe board
    if (availableSpots.includes(centerSpot)) {
      return centerSpot;
    }

    const cornerSpots = [0, 2, 6, 8]; // Corner spots in a standard 3x3 Tic Tac Toe board
    for (let i = 0; i < cornerSpots.length; i++) {
      if (availableSpots.includes(cornerSpots[i])) {
        return cornerSpots[i];
      }
    }

    // If neither center nor corner spots are available, prioritize any available spot
    if (availableSpots.length > 0) {
      return availableSpots[0];
    }

    return -1;
  };

  const findBestMove = () => {
    const currentGameCount = totalGamesPlayed;

    let bestMove = -1;
    let bestScore = -Infinity;
    if (currentGameCount % 10 === 0) {
      bestMove = prioritizePlayerWin();
    } else {
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
    }
    return bestMove;
  };

  useEffect(() => {
    const cpuMove = () => {
      if (turn === 'O' && !winner) {
        const bestMoveIndex = findBestMove();
        if (bestMoveIndex >= 0) {
          makeMove(bestMoveIndex, 'O', true);
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
    const totalDrawGames =
      parseInt(localStorage.getItem('totalDrawGames')) || 0;

    setPlayerXWins(playerXWins);
    setPlayerOWins(playerOWins);
    setTotalGamesPlayed(totalGamesPlayed);
    setTotalDrawGames(totalDrawGames);
  }, []);

  const handleCPUMove = () => {
    if (!cpuStarted) {
      setCpuStarted(true);
      const bestMoveIndex = findBestMove();
      if (bestMoveIndex >= 0) {
        makeMove(bestMoveIndex, 'O');
      }
    }
  };

  return (
    <div className="boda">
      <div className="flex flex-col items-center justify-center min-h-screen bg-transparent">
        <div className="nes-table-responsive overflow-x-auto max-w-4xl w-full">
          <table className="nes-table is-bordered is-centered max-w-4xl w-full bg-white border border-none rounded-lg shadow-lg mb-4 text-center">
            <thead>
              <tr className="bg-slate-900 text-white text-center">
                <th className="text-lg font-bold p-2">Player</th>
                <th className="text-lg font-bold p-2">Wins</th>
                <th className="text-lg font-bold p-2">Win %</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2 text-md font-semibold">Player X</td>
                <td className="p-2 text-md">{playerXWins}</td>
                <td
                  className={`p-2 text-md ${
                    getPlayerWinPercentage(playerXWins) < 50
                      ? 'text-red-500'
                      : 'text-green-500'
                  }`}
                >
                  {getPlayerWinPercentage(playerXWins)}%
                </td>
              </tr>
              <tr>
                <td className="p-2 text-md font-semibold">Player O</td>
                <td className="p-2 text-md">{playerOWins}</td>
                <td
                  className={`p-2 text-md ${
                    getPlayerWinPercentage(playerOWins) < 50
                      ? 'text-red-500'
                      : 'text-green-500'
                  }`}
                >
                  {getPlayerWinPercentage(playerOWins)}%
                </td>
              </tr>
              <tr>
                <td className="p-2 text-md font-semibold">Draw Games</td>
                <td className="p-2 text-md">{totalDrawGames}</td>
                <td
                  className={`p-2 text-md ${
                    getPlayerWinPercentage(totalDrawGames) < 50
                      ? 'text-red-900'
                      : 'text-green-900'
                  }`}
                >
                  {getPlayerWinPercentage(totalDrawGames)}%
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
              className={`w-16 h-16 md:w-24 md:h-24 text-4xl font-bold border border-gray-300 rounded transition-colors focus:outline-none hover:shadow-md hover:shadow-gray-400 hover:border-none ${
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
        <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col md:flex-row items-center gap-4 max-w-4xl w-full">
          <button
            className={`px-4 py-2 z-20 text-white bg-green-600 rounded hover:bg-green-700 flex items-center w-full md:w-auto whitespace-nowrap ${
              (cpuStarted || winner !== null) && 'disabled:bg-gray-400'
            }`}
            onClick={handleCPUMove}
            disabled={cpuStarted || winner !== null}
          >
            {cpuStarted ? 'CPU has started' : 'Start CPU'}
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
          <Link to={`/game/${id}`} className="text-blue-600 hover:underline">
            Back to Player vs Player Game
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CPUGame;
