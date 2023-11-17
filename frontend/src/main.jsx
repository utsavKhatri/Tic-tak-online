import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { Toaster } from 'react-hot-toast';
import { Routes, Route, BrowserRouter } from 'react-router-dom';
import Game from './pages/Game.jsx';
import CPUGame from './pages/CPUGame.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <>
    <Toaster position="top-center" reverseOrder={false} />
    <BrowserRouter>
      <Routes>
        <Route path="/" index element={<App />} />
        <Route path="/game/:id" element={<Game />} />
        <Route path="/cpu/game/:id" element={<CPUGame />} />
      </Routes>
    </BrowserRouter>
  </>
);
