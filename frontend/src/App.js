import React, { useState, useEffect, useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import GameBoard from './components/GameBoard';
import api from './services/api';
import './App.css';

function App() {
  const [gameId, setGameId] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(false);

  const refreshGameState = useCallback(async () => {
    if (!gameId) return;
    
    try {
      const game = await api.getGame(gameId);
      setGameState(game);
      console.log('Game state refreshed');
    } catch (error) {
      console.error('Error fetching game state:', error);
    }
  }, [gameId]);

  const startNewGame = async () => {
    setLoading(true);
    try {
      const newGame = await api.createGame();
      setGameId(newGame._id);
      setGameState(newGame);
    } catch (error) {
      console.error('Error creating game:', error);
      alert('Failed to create game: ' + error.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (gameId) {
      refreshGameState();
    }
  }, [gameId, refreshGameState]);

  if (!gameState) {
    return (
      <div className="start-screen">
        <h1>MTG Deck Tester</h1>
        <p>Single Player Sandbox Mode</p>
        <button onClick={startNewGame} disabled={loading}>
          {loading ? 'Creating Game...' : 'Start Testing'}
        </button>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="app">
        <GameBoard 
          gameState={gameState} 
          gameId={gameId}
          onUpdate={refreshGameState}
        />
      </div>
    </DndProvider>
  );
}

export default App;