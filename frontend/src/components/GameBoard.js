import React, { useState } from 'react';
import LifeCounter from './LifeCounter';
import Zone from './Zone';
import ControlPanel from './ControlPanel';
import DeckViewer from './DeckViewer';
import api from '../services/api';

const GameBoard = ({ gameState, gameId, onUpdate }) => {
  const [showDeck, setShowDeck] = useState(false);

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
        <button className="reset-btn" onClick={handleReset}>
          Reset Game
        </button>
      </div>

      <div className="main-area">
        <div className="left-panel">
          <Zone
            zoneName="hand"
            cards={gameState.zones.hand}
            gameId={gameId}
            onUpdate={onUpdate}
            className="hand-zone"
          />
          
          <ControlPanel
            gameId={gameId}
            onUpdate={onUpdate}
            onViewDeck={() => setShowDeck(true)}
            libraryCount={gameState.zones.library.length}
          />
        </div>

        <Zone
          zoneName="battlefield"
          cards={gameState.zones.battlefield}
          gameId={gameId}
          onUpdate={onUpdate}
          className="battlefield-zone"
        />

        <div className="right-panel">
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
      </div>

      {showDeck && (
        <DeckViewer
          deck={gameState.zones.library}
          onClose={() => setShowDeck(false)}
        />
      )}
    </div>
  );
};

export default GameBoard;