import React, { useState, useEffect, useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import GameBoard from './components/GameBoard';
import Login from './components/Login';
import DeckManager from './components/DeckManager';
import api from './services/api';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [gameId, setGameId] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDeckManager, setShowDeckManager] = useState(false);

  // Check for existing login on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      api.setAuthToken(token);
      setUser(JSON.parse(savedUser));
    }
  }, []);

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

  useEffect(() => {
    if (gameId) {
      refreshGameState();
    }
  }, [gameId, refreshGameState]);

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

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    api.setAuthToken(null);
    setUser(null);
    setGameState(null);
    setGameId(null);
  };

  const handleLoadDeck = async (cards) => {
    // If no game exists, create one first
    if (!gameId) {
      const newGame = await api.createGame();
      setGameId(newGame._id);
      setGameState(newGame);
      
      // Wait a bit for state to update
      setTimeout(async () => {
        try {
          // Import the deck to the new game
          const deckList = cards.map(c => c.name).join('\n');
          await api.importDeck(newGame._id, deckList);
          const updatedGame = await api.getGame(newGame._id);
          setGameState(updatedGame);
        } catch (error) {
          console.error('Error loading deck into game:', error);
        }
      }, 100);
    } else {
      // Game exists, just import the deck
      try {
        const deckList = cards.map(c => c.name).join('\n');
        await api.importDeck(gameId, deckList);
        refreshGameState();
      } catch (error) {
        console.error('Error loading deck into game:', error);
      }
    }
  };

  // If not logged in, show login screen
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // If logged in but no game started
  if (!gameState) {
    return (
      <div className="start-screen">
        <div className="user-info">
          <span>Welcome, {user.username}</span>
          <button onClick={handleLogout}>Logout</button>
        </div>
        <h1>MTG Deck Tester</h1>
        <p>Single Player Sandbox Mode</p>
        <div className="start-buttons">
          <button onClick={startNewGame} disabled={loading}>
            {loading ? 'Creating Game...' : 'Start Testing'}
          </button>
          <button onClick={() => setShowDeckManager(true)}>
            My Decks
          </button>
        </div>
        {showDeckManager && (
          <DeckManager
            currentDeck={null}
            onLoadDeck={handleLoadDeck}
            onClose={() => setShowDeckManager(false)}
          />
        )}
      </div>
    );
  }

  // Game is active
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="app">
        <div className="app-header">
          <span>Logged in as: {user.username}</span>
          <button onClick={() => setShowDeckManager(true)}>My Decks</button>
          <button onClick={handleLogout}>Logout</button>
        </div>
        <GameBoard 
          gameState={gameState} 
          gameId={gameId}
          onUpdate={refreshGameState}
          onOpenDeckManager={() => setShowDeckManager(true)}
        />
        {showDeckManager && (
          <DeckManager
            currentDeck={gameState}
            onLoadDeck={handleLoadDeck}
            onClose={() => setShowDeckManager(false)}
          />
        )}
      </div>
    </DndProvider>
  );
}

export default App;