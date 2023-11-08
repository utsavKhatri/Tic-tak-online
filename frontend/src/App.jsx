import { Link } from 'react-router-dom';

const App = () => {
  const generateRoomId = () => {
    const result = `room${(Math.random() * 10000).toFixed(0)}`;
    return result;
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="text-center">
        <div>
          <img
            src="/icon.png"
            alt="Logo"
            className="w-36 h-36 mx-auto mb-6 drop-shadow-2xl"
          />
          <h1 className="text-4xl font-bold mb-6">Welcome to Tic-Tac-Toe</h1>
        </div>
        <div className="w-full">
          <Link
            to={`/game/${generateRoomId()}`}
            className="block bg-green-500 text-white font-bold py-2 px-4 rounded mb-2"
          >
            Start Game
          </Link>
          <Link
            to={`/cpu/game/${generateRoomId()}`}
            className="block bg-blue-500 text-white font-bold py-2 px-4 rounded"
          >
            Start CPU Game
          </Link>
        </div>
      </div>
    </div>
  );
};

export default App;
