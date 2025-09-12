import React, { useState } from 'react';
import api from '../services/api';

const DeckImporter = ({ gameId, onImport, onClose }) => {
  const [deckList, setDeckList] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const sampleDeck = `4 Lightning Bolt
  4 Snapcaster Mage
  4 Counterspell
4 Birds of Paradise
4 Llanowar Elves
3 Wrath of God
2 Serra Angel
1 Black Lotus
20 Forest
10 Island
4Mountain`;

  const handleImport = async () => {
    if (!deckList.trim()) return;
    
    setIsImporting(true);
    try {
      await api.importDeck(gameId, deckList);
      onImport();
      onClose();
    } catch (error) {
      console.error('Error importing deck:', error);
      alert('Error importing deck. Please check the format.');
    }
    setIsImporting(false);
  };

  return (
    <div className="deck-importer-overlay" onClick={onClose}>
      <div className="deck-importer" onClick={(e) => e.stopPropagation()}>
        <div className="deck-importer-header">
          <h3>Import Deck</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="deck-importer-content">
          <p className="import-instructions">
            Enter your deck list below. Format: one card per line<br/>
            Optional quantity at the beginning (e.g., "4 Lightning Bolt" or just "Lightning Bolt")
          </p>
          <textarea
            value={deckList}
            onChange={(e) => setDeckList(e.target.value)}
            placeholder={sampleDeck}
            rows={15}
            className="deck-input"
          />
          <div className="import-buttons">
            <button 
              onClick={() => setDeckList(sampleDeck)}
              className="sample-btn"
            >
              Load Sample Deck
            </button>
            <button 
              onClick={handleImport} 
              disabled={isImporting || !deckList.trim()}
              className="import-btn"
            >
              {isImporting ? 'Importing...' : 'Import Deck'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeckImporter;