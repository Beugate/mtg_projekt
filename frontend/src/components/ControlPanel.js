import React from 'react';
import api from '../services/api';

const ControlPanel = ({ gameId, onUpdate, onViewDeck, libraryCount }) => {
  const handleDraw = async (count = 1) => {
    try {
      await api.drawCards(gameId, count);
      onUpdate();
    } catch (error) {
      console.error('Error drawing cards:', error);
    }
  };

  const handleShuffle = async () => {
    try {
      await api.shuffleLibrary(gameId);
      onUpdate();
      alert('Library shuffled!');
    } catch (error) {
      console.error('Error shuffling:', error);
    }
  };

  return (
    <div className="control-panel">
      <h3>Library ({libraryCount} cards)</h3>
      <div className="control-buttons">
        <button onClick={() => handleDraw(1)}>Draw 1</button>
        <button onClick={() => handleDraw(7)}>Draw 7</button>
        <button onClick={onViewDeck}>View Deck</button>
        <button onClick={handleShuffle}>Shuffle</button>
      </div>
    </div>
  );
};

export default ControlPanel;