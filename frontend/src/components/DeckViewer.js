import React from 'react';

const DeckViewer = ({ deck, onClose }) => {
  return (
    <div className="deck-viewer-overlay" onClick={onClose}>
      <div className="deck-viewer" onClick={(e) => e.stopPropagation()}>
        <div className="deck-viewer-header">
          <h3>Library Contents ({deck.length} cards)</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="deck-viewer-content">
          {deck.length === 0 ? (
            <p className="empty-deck">No cards in library</p>
          ) : (
            <div className="deck-grid">
              {deck.map((card, index) => (
                <div key={card.id} className="deck-card-item">
                  <span className="card-number">{index + 1}</span>
                  <img src={card.imageUrl} alt={card.name} />
                  <span className="card-name">{card.name}</span>
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