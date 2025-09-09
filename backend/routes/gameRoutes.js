import express from 'express';
import Game from '../models/Game.js';

const router = express.Router();

// Create new game
router.post('/', async (req, res) => {
  try {
    const { deck } = req.body;
    
    const newGame = new Game({
      life: 20,
      zones: {
        library: deck || generateSampleDeck(),
        hand: [],
        battlefield: [],
        graveyard: [],
        exile: []
      }
    });
    
    const savedGame = await newGame.save();
    res.json(savedGame);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get game state
router.get('/:id', async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    res.json(game);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update life total
router.patch('/:id/life', async (req, res) => {
  try {
    const { change } = req.body;
    const game = await Game.findById(req.params.id);
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    game.life += change;
    game.updatedAt = Date.now();
    
    const updatedGame = await game.save();
    res.json(updatedGame);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Draw cards
router.patch('/:id/draw', async (req, res) => {
  try {
    const { count = 1 } = req.body;
    const game = await Game.findById(req.params.id);
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    const drawnCards = game.zones.library.splice(0, count);
    game.zones.hand.push(...drawnCards);
    game.updatedAt = Date.now();
    
    const updatedGame = await game.save();
    res.json(updatedGame);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// View deck (library)
router.get('/:id/deck', async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    res.json(game.zones.library);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle tap/untap - FIXED VERSION
router.patch('/:id/tap', async (req, res) => {
  try {
    const { cardId } = req.body;
    const game = await Game.findById(req.params.id);
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    const card = game.zones.battlefield.find(c => c.id === cardId);
    
    if (card) {
      // Toggle the tapped state
      card.tapped = !card.tapped;
      
      // Mark as modified to ensure save
      game.markModified('zones.battlefield');
      
      game.updatedAt = Date.now();
      const updatedGame = await game.save();
      res.json(updatedGame);
    } else {
      res.status(404).json({ error: 'Card not found on battlefield' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Move card between zones
router.patch('/:id/move-card', async (req, res) => {
  try {
    const { cardId, fromZone, toZone, position } = req.body;
    console.log('Backend: Moving card', { cardId, fromZone, toZone });
    
    const game = await Game.findById(req.params.id);
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    // Find the card in the source zone
    const cardIndex = game.zones[fromZone].findIndex(c => c.id === cardId);
    
    if (cardIndex === -1) {
      console.log('Card not found in', fromZone);
      console.log('Available cards:', game.zones[fromZone].map(c => c.id));
      return res.status(404).json({ error: `Card not found in ${fromZone}` });
    }
    
    // Remove card from source zone
    const [card] = game.zones[fromZone].splice(cardIndex, 1);
    console.log('Removed card from', fromZone);
    
    // Update card properties based on destination
    if (toZone === 'battlefield' && position) {
      card.position = position;
    } else if (toZone !== 'battlefield') {
      card.tapped = false;
      card.position = { x: 0, y: 0 };
    }
    
    // Add card to destination zone
    game.zones[toZone].push(card);
    console.log('Added card to', toZone);
    
    // Save
    game.markModified('zones');
    game.updatedAt = Date.now();
    
    const updatedGame = await game.save();
    console.log('Game saved successfully');
    res.json(updatedGame);
  } catch (error) {
    console.error('Backend error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Shuffle library
router.patch('/:id/shuffle', async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    // Fisher-Yates shuffle
    const library = game.zones.library;
    for (let i = library.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [library[i], library[j]] = [library[j], library[i]];
    }
    
    game.updatedAt = Date.now();
    const updatedGame = await game.save();
    res.json(updatedGame);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reset game (keep same deck)
router.patch('/:id/reset', async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    // Collect all cards
    const allCards = [
      ...game.zones.library,
      ...game.zones.hand,
      ...game.zones.battlefield,
      ...game.zones.graveyard,
      ...game.zones.exile
    ];
    
    // Reset all cards
    allCards.forEach(card => {
      card.tapped = false;
      card.position = { x: 0, y: 0 };
    });
    
    // Shuffle and put back in library
    for (let i = allCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allCards[i], allCards[j]] = [allCards[j], allCards[i]];
    }
    
    // Reset game state
    game.life = 20;
    game.zones = {
      library: allCards,
      hand: [],
      battlefield: [],
      graveyard: [],
      exile: []
    };
    game.updatedAt = Date.now();
    
    const updatedGame = await game.save();
    res.json(updatedGame);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to generate sample deck
function generateSampleDeck() {
  const sampleCards = [];
  for (let i = 0; i < 60; i++) {
    sampleCards.push({
      id: `card-${Date.now()}-${i}`,
      name: `Card ${i + 1}`,
      imageUrl: `https://via.placeholder.com/250x350?text=Card+${i + 1}`,
      tapped: false,
      position: { x: 0, y: 0 }
    });
  }
  return sampleCards;
}

// Import deck from text format
router.post('/:id/import-deck', async (req, res) => {
  try {
    const { deckList } = req.body;
    const game = await Game.findById(req.params.id);
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    const cards = [];
    const lines = deckList.split('\n').filter(line => line.trim());
    
    lines.forEach(line => {
      const match = line.match(/^(\d+)?\s*(.+)$/);
      if (match) {
        const count = parseInt(match[1]) || 1;
        const cardName = match[2].trim();
        
        for (let i = 0; i < count; i++) {
          cards.push({
            id: `card-${Date.now()}-${Math.random()}`,
            name: cardName,
            // Use Scryfall API for card images
            imageUrl: `https://api.scryfall.com/cards/named?format=image&face=front&fuzzy=${encodeURIComponent(cardName)}`,
            tapped: false,
            position: { x: 0, y: 0 }
          });
        }
      }
    });
    
    // Reset game with new deck
    game.life = 20;
    game.zones = {
      library: cards,
      hand: [],
      battlefield: [],
      graveyard: [],
      exile: []
    };
    game.updatedAt = Date.now();
    
    const updatedGame = await game.save();
    res.json(updatedGame);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update card position on battlefield (update the existing move-card route)
router.patch('/:id/move-card', async (req, res) => {
  try {
    const { cardId, fromZone, toZone, position } = req.body;
    const game = await Game.findById(req.params.id);
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    // If moving within battlefield, just update position
    if (fromZone === 'battlefield' && toZone === 'battlefield') {
      const card = game.zones.battlefield.find(c => c.id === cardId);
      if (card && position) {
        card.position = position;
        game.updatedAt = Date.now();
        const updatedGame = await game.save();
        return res.json(updatedGame);
      }
    }
    
    // Otherwise, move between zones
    const cardIndex = game.zones[fromZone].findIndex(c => c.id === cardId);
    
    if (cardIndex === -1) {
      return res.status(404).json({ error: 'Card not found in source zone' });
    }
    
    const [card] = game.zones[fromZone].splice(cardIndex, 1);
    
    if (position && toZone === 'battlefield') {
      card.position = position;
    }
    
    if (toZone !== 'battlefield') {
      card.tapped = false;
      card.position = { x: 0, y: 0 };
    }
    
    game.zones[toZone].push(card);
    game.updatedAt = Date.now();
    
    const updatedGame = await game.save();
    res.json(updatedGame);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


export default router;