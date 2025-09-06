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

// Toggle tap/untap
router.patch('/:id/tap', async (req, res) => {
  try {
    const { cardId } = req.body;
    const game = await Game.findById(req.params.id);
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    const card = game.zones.battlefield.find(c => c.id === cardId);
    
    if (card) {
      card.tapped = !card.tapped;
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
    const game = await Game.findById(req.params.id);
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    const cardIndex = game.zones[fromZone].findIndex(c => c.id === cardId);
    
    if (cardIndex === -1) {
      return res.status(404).json({ error: 'Card not found in source zone' });
    }
    
    const [card] = game.zones[fromZone].splice(cardIndex, 1);
    
    if (position && toZone === 'battlefield') {
      card.position = position;
    }
    
    // Reset tapped state when moving to non-battlefield zones
    if (toZone !== 'battlefield') {
      card.tapped = false;
    }
    
    game.zones[toZone].push(card);
    game.updatedAt = Date.now();
    
    const updatedGame = await game.save();
    res.json(updatedGame);
  } catch (error) {
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

export default router;