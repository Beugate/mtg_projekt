import React, { useState } from 'react';
import LifeCounter from './LifeCounter';
import Zone from './Zone';
import Battlefield from './Battlefield';
import ControlPanel from './ControlPanel';
import DeckViewer from './DeckViewer';
import DeckImporter from './DeckImporter';
import DeckManager from './DeckManager';

import api from '../services/api';

const GameBoard = ({ gameState, gameId, onUpdate }) => {
  const [showDeck, setShowDeck] = useState(false);
  const [showImporter, setShowImporter] = useState(false);
  const [showDeckManager, setShowDeckManager] = useState(false);

  const handleReset = async () => {
    if (window.confirm('Reset the game? This will shuffle all cards back into your library.')) {
      try {
        await api.resetGame(gameId);
        onUpdate();
      } catch (error) {
        console.error('Error resetting game:', error);
      }
    }
  };

  return (
    <div className="game-board">
      <div className="game-header">
        <h1>MTG Deck Tester</h1>
        <LifeCounter
          life={gameState.life}
          gameId={gameId}
          onUpdate={onUpdate}
        />
       <div className="header-buttons">
  <button 
    className="save-deck-btn" 
    onClick={() => {
      // Get user from localStorage
      const user = JSON.parse(localStorage.getItem('user'));
      if (user) {
        setShowDeckManager(true);
      } else {
        alert('Please login to save decks');
      }
    }}
  >
    Save Deck
  </button>
  <button className="import-deck-btn" onClick={() => setShowImporter(true)}>
    Import Deck
  </button>
  <button className="reset-btn" onClick={handleReset}>
    Reset Game
  </button>
</div>
      </div>

      <div className="game-layout">
        <div className="side-panel">
          <ControlPanel
            gameId={gameId}
            onUpdate={onUpdate}
            onViewDeck={() => setShowDeck(true)}
            libraryCount={gameState.zones.library.length}
          />
          
          <Zone
            zoneName="graveyard"
            cards={gameState.zones.graveyard}
            gameId={gameId}
            onUpdate={onUpdate}
            className="graveyard-zone"
          />
          
          <Zone
            zoneName="exile"
            cards={gameState.zones.exile}
            gameId={gameId}
            onUpdate={onUpdate}
            className="exile-zone"
          />
        </div>

        <div className="main-play-area">
          <Battlefield
            cards={gameState.zones.battlefield}
            gameId={gameId}
            onUpdate={onUpdate}
          />
          
          <Zone
            zoneName="hand"
            cards={gameState.zones.hand}
            gameId={gameId}
            onUpdate={onUpdate}
            className="hand-zone-bottom"
          />
        </div>
      </div>

      {showDeck && (
        <DeckViewer
          deck={gameState.zones.library}
          gameId={gameId}
          onClose={() => setShowDeck(false)}
          onUpdate={onUpdate}
        />
      )}

      {showImporter && (
        <DeckImporter
          gameId={gameId}
          onImport={onUpdate}
          onClose={() => setShowImporter(false)}
        />
      )}

      {showDeckManager && (
  <DeckManager
    currentDeck={gameState}
    onLoadDeck={(cards) => {
      // Handle loading deck
      console.log('Loading deck:', cards);
    }}
    onClose={() => setShowDeckManager(false)}
  />
)}

      
    </div>
  );
};

export default GameBoard;