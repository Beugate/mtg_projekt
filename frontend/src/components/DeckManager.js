import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './DeckManager.css';

const DeckManager = ({ currentDeck, onLoadDeck, onClose }) => {
  const [decks, setDecks] = useState([]);
  const [saveName, setSaveName] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('load'); // 'load' or 'save'

  useEffect(() => {
    if (activeTab === 'load') {
      fetchDecks();
    }
  }, [activeTab]);

  const fetchDecks = async () => {
    try {
      const userDecks = await api.getMyDecks();
      setDecks(userDecks);
    } catch (error) {
      console.error('Error fetching decks:', error);
    }
  };

  const handleSaveDeck = async () => {
    if (!saveName.trim()) {
      alert('Please enter a deck name');
      return;
    }

    if (!currentDeck || !currentDeck.zones) {
      alert('No deck to save');
      return;
    }

    setLoading(true);
    try {
      // Get all cards from all zones (combine them for saving)
      const allCards = [
        ...currentDeck.zones.library,
        ...currentDeck.zones.hand,
        ...currentDeck.zones.battlefield,
        ...currentDeck.zones.graveyard,
        ...currentDeck.zones.exile
      ];

      // Format cards for saving
      const cards = allCards.map(card => ({
        id: card.id,
        name: card.name,
        imageUrl: card.imageUrl,
        quantity: 1
      }));

      await api.saveDeck(saveName, cards, saveDescription);
      alert('Deck saved successfully!');
      setSaveName('');
      setSaveDescription('');
      setActiveTab('load');
    } catch (error) {
      alert('Error saving deck: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleLoadDeck = async (deckId) => {
    setLoading(true);
    try {
      const deck = await api.loadDeck(deckId);
      
      // Convert deck cards to game format
      const gameCards = deck.cards.map((card, index) => ({
        id: `card-${Date.now()}-${index}-${Math.random()}`,
        name: card.name,
        imageUrl: card.imageUrl,
        tapped: false,
        position: { x: 0, y: 0 }
      }));

      onLoadDeck(gameCards);
      onClose();
    } catch (error) {
      alert('Error loading deck: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDeck = async (deckId) => {
    if (!window.confirm('Are you sure you want to delete this deck?')) {
      return;
    }

    try {
      await api.deleteDeck(deckId);
      fetchDecks();
    } catch (error) {
      alert('Error deleting deck: ' + (error.response?.data?.error || error.message));
    }
  };

  return (
    <div className="deck-manager-overlay">
      <div className="deck-manager">
        <div className="deck-manager-header">
          <h2>Deck Manager</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="deck-manager-tabs">
          <button 
            className={activeTab === 'load' ? 'active' : ''} 
            onClick={() => setActiveTab('load')}
          >
            Load Deck
          </button>
          <button 
            className={activeTab === 'save' ? 'active' : ''} 
            onClick={() => setActiveTab('save')}
          >
            Save Current Deck
          </button>
        </div>

        <div className="deck-manager-content">
          {activeTab === 'load' ? (
            <div className="deck-list">
              {decks.length === 0 ? (
                <p className="no-decks">No saved decks yet</p>
              ) : (
                decks.map(deck => (
                  <div key={deck._id} className="deck-item">
                    <div className="deck-info">
                      <h3>{deck.name}</h3>
                      {deck.description && <p>{deck.description}</p>}
                      <span className="deck-date">
                        Updated: {new Date(deck.updatedAt || deck.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="deck-actions">
                      <button 
                        onClick={() => handleLoadDeck(deck._id)}
                        disabled={loading}
                      >
                        Load
                      </button>
                      <button 
                        onClick={() => handleDeleteDeck(deck._id)}
                        disabled={loading}
                        className="delete-btn"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="save-deck-form">
              <input
                type="text"
                placeholder="Deck Name"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                maxLength="50"
              />
              <textarea
                placeholder="Description (optional)"
                value={saveDescription}
                onChange={(e) => setSaveDescription(e.target.value)}
                rows="3"
              />
              <button 
                onClick={handleSaveDeck} 
                disabled={loading || !saveName.trim() || !currentDeck}
              >
                {loading ? 'Saving...' : 'Save Deck'}
              </button>
              {!currentDeck && (
                <p style={{ color: '#888', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                  Start a game first to save a deck
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeckManager;