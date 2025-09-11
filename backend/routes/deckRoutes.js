import express from 'express';
import Deck from '../models/Deck.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Get user's decks
router.get('/my-decks', authMiddleware, async (req, res) => {
  try {
    const decks = await Deck.find({ userId: req.userId })
      .sort('-updatedAt')
      .select('name format colors wins losses createdAt');
    res.json(decks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create deck
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, cards, format, description, colors, tags } = req.body;
    
    const deck = new Deck({
      name,
      userId: req.userId,
      cards,
      format,
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
    
    res.json({ message: 'Deck deleted' });
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
    
    // Save game history
    const gameHistory = new GameHistory({
      userId: req.userId,
      deckId: req.params.id,
      result,
      notes,
      turnsPlayed,
      finalLifeTotal
    });
    
    await gameHistory.save();
    res.json({ deck, gameHistory });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;