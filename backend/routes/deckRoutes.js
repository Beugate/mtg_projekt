import express from 'express';
import Deck from '../models/Deck.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Log all requests to this router for debugging
router.use((req, res, next) => {
  console.log(`🔍 Deck route: ${req.method} ${req.originalUrl}`);
  next();
});

// Get user's decks
router.get('/my-decks', authMiddleware, async (req, res) => {
  try {
    const decks = await Deck.find({ userId: req.userId })
      .sort({ updatedAt: -1 })
      .select('name format colors wins losses createdAt updatedAt description tags totalCards');
    
    console.log(`📚 Found ${decks.length} decks for user ${req.userId}`);
    res.json(decks);
  } catch (error) {
    console.error('❌ Error fetching decks:', error);
    res.status(500).json({ error: error.message });
  }
});

// SAVE DECK - This is the missing route your frontend needs
router.post('/save', authMiddleware, async (req, res) => {
  try {
    const { name, cards, description, format = 'casual', colors = [], tags = [] } = req.body;
    
    console.log('📝 Saving deck:', { name, cardCount: cards?.length, userId: req.userId });
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Deck name is required' });
    }
    
    if (!cards || !Array.isArray(cards) || cards.length === 0) {
      return res.status(400).json({ error: 'Deck must contain at least one card' });
    }
    
    // Check if deck with same name already exists for this user
    const existingDeck = await Deck.findOne({ 
      userId: req.userId, 
      name: name.trim() 
    });
    
    if (existingDeck) {
      return res.status(400).json({ error: 'A deck with this name already exists' });
    }
    
    const deck = new Deck({
      name: name.trim(),
      userId: req.userId,
      cards,
      description: description?.trim() || '',
      format,
      colors,
      tags
    });
    
    await deck.save();
    console.log('✅ Deck saved successfully:', deck._id);
    
    res.status(201).json({
      message: 'Deck saved successfully',
      deck: {
        _id: deck._id,
        name: deck.name,
        description: deck.description,
        totalCards: deck.totalCards,
        format: deck.format,
        createdAt: deck.createdAt
      }
    });
  } catch (error) {
    console.error('❌ Error saving deck:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create deck (alternative endpoint)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, cards, format, description, colors, tags } = req.body;
    
    const deck = new Deck({
      name,
      userId: req.userId,
      cards: cards || [],
      format: format || 'casual',
      description,
      colors,
      tags
    });
    
    await deck.save();
    res.json(deck);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single deck
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const deck = await Deck.findOne({ 
      _id: req.params.id, 
      userId: req.userId 
    });
    
    if (!deck) {
      return res.status(404).json({ error: 'Deck not found' });
    }
    
    res.json(deck);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update deck
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const deck = await Deck.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );
    
    if (!deck) {
      return res.status(404).json({ error: 'Deck not found' });
    }
    
    res.json(deck);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete deck
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const deck = await Deck.findOneAndDelete({ 
      _id: req.params.id, 
      userId: req.userId 
    });
    
    if (!deck) {
      return res.status(404).json({ error: 'Deck not found' });
    }
    
    res.json({ message: 'Deck deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Record game result
router.post('/:id/record-game', authMiddleware, async (req, res) => {
  try {
    const { result, notes, turnsPlayed, finalLifeTotal } = req.body;
    
    // Update deck stats
    const updateField = result === 'win' ? 'wins' : 'losses';
    const deck = await Deck.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $inc: { [updateField]: 1 } },
      { new: true }
    );
    
    if (!deck) {
      return res.status(404).json({ error: 'Deck not found' });
    }
    
    res.json({ deck });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;