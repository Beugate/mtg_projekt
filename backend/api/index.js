import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// MongoDB connection for serverless
let isConnected = false;

const connectToDatabase = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }

  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 1,
    });
    isConnected = true;
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
};

// User Schema (from models/User.js)
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
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: Date.now }
});

// Hash password before saving (from models/User.js)
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Check password method (from models/User.js)
userSchema.methods.checkPassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

// Card Schema for decks (from models/Deck.js)
const deckCardSchema = new mongoose.Schema({
  name: String,
  quantity: { type: Number, default: 1 },
  imageUrl: String
}, { _id: false });

// Deck Schema (from models/Deck.js)
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

// Game Card Schema (from models/Game.js)
const gameCardSchema = new mongoose.Schema({
  id: String,
  name: String,
  imageUrl: String,
  tapped: { type: Boolean, default: false },
  position: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 }
  }
}, { _id: false });

// Game Schema (from models/Game.js)
const gameSchema = new mongoose.Schema({
  life: { type: Number, default: 20 },
  zones: {
    library: [gameCardSchema],
    hand: [gameCardSchema],
    battlefield: [gameCardSchema],
    graveyard: [gameCardSchema],
    exile: [gameCardSchema]
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Create models (avoid re-compilation)
const User = mongoose.models.User || mongoose.model('User', userSchema);
const Deck = mongoose.models.Deck || mongoose.model('Deck', deckSchema);
const Game = mongoose.models.Game || mongoose.model('Game', gameSchema);

// Auth middleware logic (from middleware/auth.js)
const verifyToken = (authHeader) => {
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '');
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
  } catch {
    return null;
  }
};

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Connect to database
  try {
    await connectToDatabase();
  } catch (error) {
    return res.status(500).json({ 
      error: 'Database connection failed',
      details: error.message 
    });
  }

  const { url, method } = req;

  try {
    // Root endpoint
    if (url === '/' || url === '/api') {
      return res.status(200).json({
        message: 'MTG Deck Tester API',
        status: 'running',
        version: '4.0.0 - Full MongoDB Integration',
        database: 'MongoDB Atlas',
        endpoints: ['/api/health', '/api/auth/*', '/api/games/*', '/api/decks/*']
      });
    }

    // Health check
    if (url === '/api/health') {
      const userCount = await User.countDocuments();
      const gameCount = await Game.countDocuments();
      const deckCount = await Deck.countDocuments();
      
      return res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        message: 'Full MongoDB backend working!',
        database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
        version: '4.0.0',
        stats: {
          users: userCount,
          games: gameCount,
          decks: deckCount
        }
      });
    }

    // AUTH ROUTES (from routes/authRoutes.js)
    if (url === '/api/auth/register' && method === 'POST') {
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
      
      // Check if user exists in MongoDB
      const existingUser = await User.findOne({ username: username.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({ error: 'Username already taken' });
      }
      
      // Create and save user to MongoDB
      const user = new User({
        username: username.toLowerCase(),
        password: password // Will be hashed by pre-save hook
      });
      
      await user.save(); // ACTUAL MONGODB SAVE
      
      // Create JWT token
      const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '7d' }
      );
      
      return res.status(201).json({
        token,
        user: { id: user._id, username: user.username }
      });
    }

    if (url === '/api/auth/login' && method === 'POST') {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
      }
      
      // Find user in MongoDB
      const user = await User.findOne({ username: username.toLowerCase() });
      if (!user) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }
      
      // Check password using method from User model
      const isValid = await user.checkPassword(password);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }
      
      // Update last login and save to MongoDB
      user.lastLogin = new Date();
      await user.save();
      
      // Create JWT token
      const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '7d' }
      );
      
      return res.status(200).json({
        token,
        user: { id: user._id, username: user.username }
      });
    }

    // GAME ROUTES (from routes/gameRoutes.js)
    if (url === '/api/games' && method === 'POST') {
      // Create new game and save to MongoDB
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
      
      const savedGame = await newGame.save(); // ACTUAL MONGODB SAVE
      return res.status(201).json(savedGame);
    }

    // Get game state from MongoDB
    if (url.match(/^\/api\/games\/[^\/]+$/) && method === 'GET') {
      const gameId = url.split('/')[3];
      const game = await Game.findById(gameId); // ACTUAL MONGODB QUERY
      
      if (!game) {
        return res.status(404).json({ error: 'Game not found' });
      }
      
      return res.status(200).json(game);
    }

    // Import deck into game
    if (url.match(/^\/api\/games\/[^\/]+\/import-deck$/) && method === 'POST') {
      const gameId = url.split('/')[3];
      const { deckList } = req.body;
      
      const game = await Game.findById(gameId); // MONGODB QUERY
      if (!game) {
        return res.status(404).json({ error: 'Game not found' });
      }
      
      if (!deckList || !deckList.trim()) {
        return res.status(400).json({ error: 'Deck list is required' });
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

      // Update game in MongoDB
      game.zones.library = cards;
      game.zones.hand = [];
      game.zones.battlefield = [];
      game.zones.graveyard = [];
      game.zones.exile = [];
      game.updatedAt = new Date();

      const updatedGame = await game.save(); // MONGODB SAVE
      return res.status(200).json(updatedGame);
    }

    // Update life total
    if (url.match(/^\/api\/games\/[^\/]+\/life$/) && method === 'PATCH') {
      const gameId = url.split('/')[3];
      const { change } = req.body;
      
      const game = await Game.findById(gameId);
      if (!game) {
        return res.status(404).json({ error: 'Game not found' });
      }

      game.life += (change || 0);
      game.updatedAt = new Date();
      const updatedGame = await game.save(); // MONGODB SAVE

      return res.status(200).json(updatedGame);
    }

    // Draw cards
    if (url.match(/^\/api\/games\/[^\/]+\/draw$/) && method === 'PATCH') {
      const gameId = url.split('/')[3];
      const { count = 1 } = req.body;
      
      const game = await Game.findById(gameId);
      if (!game) {
        return res.status(404).json({ error: 'Game not found' });
      }

      const drawnCards = game.zones.library.splice(0, count);
      game.zones.hand.push(...drawnCards);
      game.updatedAt = new Date();

      game.markModified('zones');
      const updatedGame = await game.save(); // MONGODB SAVE
      return res.status(200).json(updatedGame);
    }

    // Move card between zones
    if (url.match(/^\/api\/games\/[^\/]+\/move-card$/) && method === 'PATCH') {
      const gameId = url.split('/')[3];
      const { cardId, fromZone, toZone, position } = req.body;
      
      const game = await Game.findById(gameId);
      if (!game) {
        return res.status(404).json({ error: 'Game not found' });
      }

      // If moving within battlefield, just update position
      if (fromZone === 'battlefield' && toZone === 'battlefield') {
        const card = game.zones.battlefield.find(c => c.id === cardId);
        if (card && position) {
          card.position = position;
          game.markModified('zones.battlefield');
          game.updatedAt = new Date();
          const updatedGame = await game.save();
          return res.status(200).json(updatedGame);
        }
      }

      // Find and remove card from source zone
      const cardIndex = game.zones[fromZone].findIndex(c => c.id === cardId);
      if (cardIndex === -1) {
        return res.status(404).json({ error: `Card not found in ${fromZone}` });
      }

      const [card] = game.zones[fromZone].splice(cardIndex, 1);
      
      // Update card properties
      if (toZone === 'battlefield' && position) {
        card.position = position;
      } else if (toZone !== 'battlefield') {
        card.tapped = false;
        card.position = { x: 0, y: 0 };
      }

      game.zones[toZone].push(card);
      game.updatedAt = new Date();

      game.markModified('zones');
      const updatedGame = await game.save(); // MONGODB SAVE
      return res.status(200).json(updatedGame);
    }

    // Put card on top of library
    if (url.match(/^\/api\/games\/[^\/]+\/to-library-top$/) && method === 'PATCH') {
      const gameId = url.split('/')[3];
      const { cardId, fromZone } = req.body;
      
      const game = await Game.findById(gameId);
      if (!game) {
        return res.status(404).json({ error: 'Game not found' });
      }

      const cardIndex = game.zones[fromZone].findIndex(c => c.id === cardId);
      if (cardIndex === -1) {
        return res.status(404).json({ error: `Card not found in ${fromZone}` });
      }

      const [card] = game.zones[fromZone].splice(cardIndex, 1);
      card.tapped = false;
      card.position = { x: 0, y: 0 };
      
      // Add to top of library (beginning of array)
      game.zones.library.unshift(card);
      game.updatedAt = new Date();

      game.markModified('zones');
      const updatedGame = await game.save(); // MONGODB SAVE
      return res.status(200).json(updatedGame);
    }

    // Put card on bottom of library
    if (url.match(/^\/api\/games\/[^\/]+\/to-library-bottom$/) && method === 'PATCH') {
      const gameId = url.split('/')[3];
      const { cardId, fromZone } = req.body;
      
      const game = await Game.findById(gameId);
      if (!game) {
        return res.status(404).json({ error: 'Game not found' });
      }

      const cardIndex = game.zones[fromZone].findIndex(c => c.id === cardId);
      if (cardIndex === -1) {
        return res.status(404).json({ error: `Card not found in ${fromZone}` });
      }

      const [card] = game.zones[fromZone].splice(cardIndex, 1);
      card.tapped = false;
      card.position = { x: 0, y: 0 };
      
      // Add to bottom of library (end of array)
      game.zones.library.push(card);
      game.updatedAt = new Date();

      game.markModified('zones');
      const updatedGame = await game.save(); // MONGODB SAVE
      return res.status(200).json(updatedGame);
    }

    // Toggle tap
    if (url.match(/^\/api\/games\/[^\/]+\/tap$/) && method === 'PATCH') {
      const gameId = url.split('/')[3];
      const { cardId } = req.body;
      
      const game = await Game.findById(gameId);
      if (!game) {
        return res.status(404).json({ error: 'Game not found' });
      }

      const card = game.zones.battlefield.find(c => c.id === cardId);
      if (card) {
        card.tapped = !card.tapped;
        game.updatedAt = new Date();
        
        game.markModified('zones.battlefield');
        const updatedGame = await game.save(); // MONGODB SAVE
        return res.status(200).json(updatedGame);
      } else {
        return res.status(404).json({ error: 'Card not found on battlefield' });
      }
    }

    // Shuffle library
    if (url.match(/^\/api\/games\/[^\/]+\/shuffle$/) && method === 'PATCH') {
      const gameId = url.split('/')[3];
      
      const game = await Game.findById(gameId);
      if (!game) {
        return res.status(404).json({ error: 'Game not found' });
      }

      const library = game.zones.library;
      
      // Fisher-Yates shuffle algorithm
      for (let i = library.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [library[i], library[j]] = [library[j], library[i]];
      }
      
      game.updatedAt = new Date();
      game.markModified('zones.library');
      const updatedGame = await game.save(); // MONGODB SAVE
      return res.status(200).json(updatedGame);
    }

    // Reset game
    if (url.match(/^\/api\/games\/[^\/]+\/reset$/) && method === 'PATCH') {
      const gameId = url.split('/')[3];
      
      const game = await Game.findById(gameId);
      if (!game) {
        return res.status(404).json({ error: 'Game not found' });
      }

      // Collect all cards from all zones
      const allCards = [
        ...game.zones.library,
        ...game.zones.hand,
        ...game.zones.battlefield,
        ...game.zones.graveyard,
        ...game.zones.exile
      ];

      // Reset card states
      allCards.forEach(card => {
        card.tapped = false;
        card.position = { x: 0, y: 0 };
      });

      // Shuffle all cards
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
      game.updatedAt = new Date();

      game.markModified('zones');
      const updatedGame = await game.save(); // MONGODB SAVE
      return res.status(200).json(updatedGame);
    }

    // DECK ROUTES (from routes/deckRoutes.js)
    if (url === '/api/decks/my-decks' && method === 'GET') {
      const authHeader = req.headers.authorization;
      const decoded = verifyToken(authHeader);
      
      if (!decoded) {
        return res.status(401).json({ error: 'No token provided' });
      }

      // Get user's decks from MongoDB
      const userDecks = await Deck.find({ userId: decoded.userId }).sort({ updatedAt: -1 });
      return res.status(200).json(userDecks);
    }

    if (url === '/api/decks/save' && method === 'POST') {
      const authHeader = req.headers.authorization;
      const decoded = verifyToken(authHeader);
      
      if (!decoded) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const { name, cards, description } = req.body;
      
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Deck name is required' });
      }

      // Check if deck with same name exists for this user
      const existingDeck = await Deck.findOne({ 
        userId: decoded.userId, 
        name: name.trim() 
      });
      
      if (existingDeck) {
        return res.status(400).json({ error: 'A deck with this name already exists' });
      }

      // Create and save deck to MongoDB
      const deck = new Deck({
        name: name.trim(),
        userId: decoded.userId,
        cards: cards || [],
        description: description || ''
      });

      await deck.save(); // ACTUAL MONGODB SAVE

      return res.status(201).json({
        message: 'Deck saved successfully',
        deck: {
          _id: deck._id,
          name: deck.name,
          description: deck.description,
          totalCards: deck.cards.length,
          format: deck.format,
          createdAt: deck.createdAt
        }
      });
    }

    // Get single deck
    if (url.match(/^\/api\/decks\/[^\/]+$/) && method === 'GET') {
      const authHeader = req.headers.authorization;
      const decoded = verifyToken(authHeader);
      
      if (!decoded) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const deckId = url.split('/')[3];
      const deck = await Deck.findOne({ 
        _id: deckId, 
        userId: decoded.userId 
      });
      
      if (!deck) {
        return res.status(404).json({ error: 'Deck not found' });
      }
      
      return res.status(200).json(deck);
    }

    // Delete deck
    if (url.match(/^\/api\/decks\/[^\/]+$/) && method === 'DELETE') {
      const authHeader = req.headers.authorization;
      const decoded = verifyToken(authHeader);
      
      if (!decoded) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const deckId = url.split('/')[3];
      const deck = await Deck.findOneAndDelete({ 
        _id: deckId, 
        userId: decoded.userId 
      });
      
      if (!deck) {
        return res.status(404).json({ error: 'Deck not found' });
      }
      
      return res.status(200).json({ message: 'Deck deleted successfully' });
    }

    // 404 for all other routes
    return res.status(404).json({
      error: 'Route not found',
      path: url,
      method: method,
      availableEndpoints: [
        '/api/health',
        '/api/auth/register',
        '/api/auth/login',
        '/api/games',
        '/api/games/:id',
        '/api/games/:id/import-deck',
        '/api/games/:id/life',
        '/api/games/:id/draw',
        '/api/games/:id/move-card',
        '/api/games/:id/to-library-top',
        '/api/games/:id/to-library-bottom',
        '/api/games/:id/tap',
        '/api/games/:id/shuffle',
        '/api/games/:id/reset',
        '/api/decks/my-decks',
        '/api/decks/save',
        '/api/decks/:id'
      ]
    });

  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}