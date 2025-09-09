import React from 'react';
import api from '../services/api';

const DeckViewer = ({ deck, gameId, onClose, onUpdate }) => {
  const handleCardDoubleClick = async (card) => {
    try {
      // Move card to battlefield at top-left position
      await api.moveCard(gameId, card.id, 'library', 'battlefield', { x: 5, y: 5 });
      // Shuffle library
      await api.shuffleLibrary(gameId);
      // Update game state
      await onUpdate();
      // Close deck viewer
      onClose();
    } catch (error) {
      console.error('Error playing card from library:', error);
    }
  };

  return (
    <div className="deck-viewer-overlay" onClick={onClose}>
      <div className="deck-viewer" onClick={(e) => e.stopPropagation()}>
        <div className="deck-viewer-header">
          <h3>Library ({deck.length} cards)</h3>
          <span className="deck-viewer-hint">Double-click to play card</span>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="deck-viewer-content">
          {deck.length === 0 ? (
            <p className="empty-deck">No cards in library</p>
          ) : (
            <div className="deck-grid">
              {deck.map((card, index) => (
                <div
                  key={card.id}
                  className="deck-card-item"
                  onDoubleClick={() => handleCardDoubleClick(card)}
                >
                  <span className="card-number">{index + 1}</span>
                  <img 
                    src={card.imageUrl} 
                    alt={card.name}
                    title={`${card.name} - Double-click to play`}
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUwIiBoZWlnaHQ9IjM1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjUwIiBoZWlnaHQ9IjM1MCIgZmlsbD0iIzJhMmEyYSIvPgogIDxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjIzMCIgaGVpZ2h0PSIzMzAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzY2NiIgc3Ryb2tlLXdpZHRoPSIyIi8+CiAgPGNpcmNsZSBjeD0iMTI1IiBjeT0iMTc1IiByPSI0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjNjY2IiBzdHJva2Utd2lkdGg9IjIiLz4KPC9zdmc+';
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeckViewer;