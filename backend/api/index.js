import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// In-memory storage for this session (since imports are causing issues)
let users = [];
let games = [];
let decks = [];

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { url, method } = req;
  
  // Helper function to verify JWT
  const verifyToken = (authHeader) => {
    if (!authHeader) return null;
    const token = authHeader.replace('Bearer ', '');
    try {
      return jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    } catch {
      return null;
    }
  };

  try {
    // Root endpoint
    if (url === '/' || url === '/api') {
      return res.status(200).json({
        message: 'MTG Deck Tester API',
        status: 'running',
        version: '2.0.0',
        endpoints: ['/api/health', '/api/auth/*', '/api/games/*', '/api/decks/*']
      });
    }

    // Health check
    if (url === '/api/health') {
      return res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        message: 'Backend is working!',
        version: '2.0.0',
        users: users.length,
        games: games.length,
        decks: decks.length
      });
    }

    // AUTH ROUTES
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
      
      // Check if user exists
      const existingUser = users.find(u => u.username === username.toLowerCase());
      if (existingUser) {
        return res.status(400).json({ error: 'Username already taken' });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create user
      const user = {
        id: 'user-' + Date.now() + '-' + Math.random(),
        username: username.toLowerCase(),
        password: hashedPassword,
        createdAt: new Date().toISOString()
      };
      
      users.push(user);
      
      // Create token
      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '7d' }
      );
      
      return res.status(201).json({
        token,
        user: { id: user.id, username: user.username }
      });
    }

    if (url === '/api/auth/login' && method === 'POST') {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
      }
      
      // Find user
      const user = users.find(u => u.username === username.toLowerCase());
      if (!user) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }
      
      // Check password
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }
      
      // Create token
      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '7d' }
      );
      
      return res.status(200).json({
        token,
        user: { id: user.id, username: user.username }
      });
    }

    // GAME ROUTES
    if (url === '/api/games' && method === 'POST') {
      // Create new game
      const gameId = 'game-' + Date.now() + '-' + Math.random();
      
      const game = {
        _id: gameId,
        life: 20,
        zones: {
          library: [],
          hand: [],
          battlefield: [],
          graveyard: [],
          exile: []
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      games.push(game);
      return res.status(201).json(game);
    }

    // Get game state
    if (url.match(/^\/api\/games\/[^\/]+$/) && method === 'GET') {
      const gameId = url.split('/')[3];
      const game = games.find(g => g._id === gameId);
      
      if (!game) {
        return res.status(404).json({ error: 'Game not found' });
      }
      
      return res.status(200).json(game);
    }

    // Import deck
    if (url.match(/^\/api\/games\/[^\/]+\/import-deck$/) && method === 'POST') {
      const gameId = url.split('/')[3];
      const { deckList } = req.body;
      
      const gameIndex = games.findIndex(g => g._id === gameId);
      if (gameIndex === -1) {
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

      // Update game
      games[gameIndex].zones.library = cards;
      games[gameIndex].zones.hand = [];
      games[gameIndex].zones.battlefield = [];
      games[gameIndex].zones.graveyard = [];
      games[gameIndex].zones.exile = [];
      games[gameIndex].updatedAt = new Date().toISOString();

      return res.status(200).json(games[gameIndex]);
    }

    // Update life
    if (url.match(/^\/api\/games\/[^\/]+\/life$/) && method === 'PATCH') {
      const gameId = url.split('/')[3];
      const { change } = req.body;
      
      const gameIndex = games.findIndex(g => g._id === gameId);
      if (gameIndex === -1) {
        return res.status(404).json({ error: 'Game not found' });
      }

      games[gameIndex].life += (change || 0);
      games[gameIndex].updatedAt = new Date().toISOString();

      return res.status(200).json(games[gameIndex]);
    }

    // Draw cards
    if (url.match(/^\/api\/games\/[^\/]+\/draw$/) && method === 'PATCH') {
      const gameId = url.split('/')[3];
      const { count = 1 } = req.body;
      
      const gameIndex = games.findIndex(g => g._id === gameId);
      if (gameIndex === -1) {
        return res.status(404).json({ error: 'Game not found' });
      }

      const game = games[gameIndex];
      const drawnCards = game.zones.library.splice(0, count);
      game.zones.hand.push(...drawnCards);
      game.updatedAt = new Date().toISOString();

      return res.status(200).json(game);
    }

    // Move card between zones
    if (url.match(/^\/api\/games\/[^\/]+\/move-card$/) && method === 'PATCH') {
      const gameId = url.split('/')[3];
      const { cardId, fromZone, toZone, position } = req.body;
      
      const gameIndex = games.findIndex(g => g._id === gameId);
      if (gameIndex === -1) {
        return res.status(404).json({ error: 'Game not found' });
      }

      const game = games[gameIndex];
      
      // Find and remove card from source zone
      const cardIndex = game.zones[fromZone].findIndex(c => c.id === cardId);
      if (cardIndex === -1) {
        return res.status(404).json({ error: `Card not found in ${fromZone}` });
      }

      const [card] = game.zones[fromZone].splice(cardIndex, 1);
      
      // Update card properties if moving to battlefield
      if (toZone === 'battlefield' && position) {
        card.position = position;
      } else if (toZone !== 'battlefield') {
        card.tapped = false;
        card.position = { x: 0, y: 0 };
      }

      game.zones[toZone].push(card);
      game.updatedAt = new Date().toISOString();

      return res.status(200).json(game);
    }

    // Toggle tap
    if (url.match(/^\/api\/games\/[^\/]+\/tap$/) && method === 'PATCH') {
      const gameId = url.split('/')[3];
      const { cardId } = req.body;
      
      const gameIndex = games.findIndex(g => g._id === gameId);
      if (gameIndex === -1) {
        return res.status(404).json({ error: 'Game not found' });
      }

      const game = games[gameIndex];
      const card = game.zones.battlefield.find(c => c.id === cardId);
      
      if (card) {
        card.tapped = !card.tapped;
        game.updatedAt = new Date().toISOString();
        return res.status(200).json(game);
      } else {
        return res.status(404).json({ error: 'Card not found on battlefield' });
      }
    }

    // Shuffle library
    if (url.match(/^\/api\/games\/[^\/]+\/shuffle$/) && method === 'PATCH') {
      const gameId = url.split('/')[3];
      
      const gameIndex = games.findIndex(g => g._id === gameId);
      if (gameIndex === -1) {
        return res.status(404).json({ error: 'Game not found' });
      }

      const game = games[gameIndex];
      const library = game.zones.library;
      
      // Fisher-Yates shuffle
      for (let i = library.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [library[i], library[j]] = [library[j], library[i]];
      }
      
      game.updatedAt = new Date().toISOString();
      return res.status(200).json(game);
    }

    // Reset game
    if (url.match(/^\/api\/games\/[^\/]+\/reset$/) && method === 'PATCH') {
      const gameId = url.split('/')[3];
      
      const gameIndex = games.findIndex(g => g._id === gameId);
      if (gameIndex === -1) {
        return res.status(404).json({ error: 'Game not found' });
      }

      const game = games[gameIndex];
      
      // Collect all cards
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

      // Shuffle and put back in library
      for (let i = allCards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allCards[i], allCards[j]] = [allCards[j], allCards[i]];
      }

      game.life = 20;
      game.zones = {
        library: allCards,
        hand: [],
        battlefield: [],
        graveyard: [],
        exile: []
      };
      game.updatedAt = new Date().toISOString();

      return res.status(200).json(game);
    }

    // DECK ROUTES
    if (url === '/api/decks/my-decks' && method === 'GET') {
      const authHeader = req.headers.authorization;
      const decoded = verifyToken(authHeader);
      
      if (!decoded) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const userDecks = decks.filter(d => d.userId === decoded.userId);
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

      const deck = {
        _id: 'deck-' + Date.now() + '-' + Math.random(),
        name: name.trim(),
        userId: decoded.userId,
        cards: cards || [],
        description: description || '',
        format: 'casual',
        wins: 0,
        losses: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      decks.push(deck);

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
        '/api/games/:id/import-deck',
        '/api/games/:id/draw',
        '/api/games/:id/life',
        '/api/games/:id/move-card',
        '/api/games/:id/tap',
        '/api/games/:id/shuffle',
        '/api/games/:id/reset',
        '/api/decks/my-decks',
        '/api/decks/save'
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