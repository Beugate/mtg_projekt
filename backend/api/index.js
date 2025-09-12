import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();

// CORS and middleware
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));

// MongoDB connection
let isConnected = false;
const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) return;
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    isConnected = true;
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB error:', error);
  }
};

// Define models inline to avoid import issues
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.checkPassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

const cardSchema = new mongoose.Schema({
  id: String,
  name: String,
  imageUrl: String,
  tapped: { type: Boolean, default: false },
  position: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 }
  }
}, { _id: false });

const gameSchema = new mongoose.Schema({
  life: { type: Number, default: 20 },
  zones: {
    library: [cardSchema],
    hand: [cardSchema],
    battlefield: [cardSchema],
    graveyard: [cardSchema],
    exile: [cardSchema]
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const deckCardSchema = new mongoose.Schema({
  name: String,
  quantity: Number,
  imageUrl: String
}, { _id: false });

const deckSchema = new mongoose.Schema({
  name: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  cards: [deckCardSchema],
  description: String,
  format: { type: String, default: 'casual' },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Create models
const User = mongoose.models.User || mongoose.model('User', userSchema);
const Game = mongoose.models.Game || mongoose.model('Game', gameSchema);
const Deck = mongoose.models.Deck || mongoose.model('Deck', deckSchema);

// Auth middleware
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Connect to DB middleware
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString()
  });
});

// AUTH ROUTES
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    
    if (username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    const existingUser = await User.findOne({ username: username.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already taken' });
    }
    
    const user = new User({ username: username.toLowerCase(), password });
    await user.save();
    
    const token = jwt.sign(
      { userId: user._id }, 
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );
    
    res.json({ 
      token, 
      user: { id: user._id, username: user.username }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    
    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    const isValid = await user.checkPassword(password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );
    
    res.json({ 
      token, 
      user: { id: user._id, username: user.username }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GAME ROUTES
app.post('/api/games', async (req, res) => {
  try {
    const newGame = new Game({
      life: 20,
      zones: {
        library: [],
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

app.get('/api/games/:id', async (req, res) => {
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

app.post('/api/games/:id/import-deck', async (req, res) => {
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
            imageUrl: `https://api.scryfall.com/cards/named?format=image&face=front&fuzzy=${encodeURIComponent(cardName)}`,
            tapped: false,
            position: { x: 0, y: 0 }
          });
        }
      }
    });
    
    game.zones.library = cards;
    game.zones.hand = [];
    game.zones.battlefield = [];
    game.zones.graveyard = [];
    game.zones.exile = [];
    game.updatedAt = Date.now();
    
    const updatedGame = await game.save();
    res.json(updatedGame);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DECK ROUTES
app.get('/api/decks/my-decks', authMiddleware, async (req, res) => {
  try {
    const decks = await Deck.find({ userId: req.userId }).sort('-updatedAt');
    res.json(decks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/decks/save', authMiddleware, async (req, res) => {
  try {
    const { name, cards, description } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Deck name is required' });
    }
    
    const deck = new Deck({
      name: name.trim(),
      userId: req.userId,
      cards: cards || [],
      description: description || ''
    });
    
    await deck.save();
    res.status(201).json({
      message: 'Deck saved successfully',
      deck: { _id: deck._id, name: deck.name }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;