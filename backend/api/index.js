export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { url, method } = req;
  
  try {
    // Health check
    if (url === '/api/health') {
      return res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        message: 'Backend is working!'
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
      
      return res.status(201).json({
        message: 'User registered successfully',
        user: { 
          id: 'temp-' + Date.now(), 
          username: username.toLowerCase() 
        },
        token: 'temp-token-' + Date.now()
      });
    }
    
    if (url === '/api/auth/login' && method === 'POST') {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
      }
      
      return res.status(200).json({
        message: 'Login successful',
        user: { 
          id: 'temp-' + Date.now(), 
          username: username.toLowerCase() 
        },
        token: 'temp-token-' + Date.now()
      });
    }
    
    // GAME ROUTES
    if (url === '/api/games' && method === 'POST') {
      // Create new game
      const gameId = 'game-' + Date.now();
      const sampleCards = [];
      
      // Generate sample deck
      for (let i = 0; i < 60; i++) {
        sampleCards.push({
          id: `card-${Date.now()}-${i}`,
          name: `Sample Card ${i + 1}`,
          imageUrl: `https://via.placeholder.com/250x350/333333/ffffff?text=Card+${i + 1}`,
          tapped: false,
          position: { x: 0, y: 0 }
        });
      }
      
      return res.status(201).json({
        _id: gameId,
        life: 20,
        zones: {
          library: sampleCards,
          hand: [],
          battlefield: [],
          graveyard: [],
          exile: []
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    
    // Get game state
    if (url.startsWith('/api/games/') && method === 'GET') {
      const gameId = url.split('/')[3];
      
      return res.status(200).json({
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
      });
    }
    
    // DECK ROUTES (basic)
    if (url === '/api/decks/my-decks' && method === 'GET') {
      return res.status(200).json([]);
    }
    
    // Root endpoint
    if (url === '/') {
      return res.status(200).json({
        message: 'MTG Deck Tester API',
        status: 'running',
        endpoints: ['/api/health', '/api/auth/*', '/api/games', '/api/decks/*']
      });
    }
    
    // 404 for all other routes
    res.status(404).json({
      error: 'Route not found',
      path: url,
      method: method,
      availableRoutes: ['/api/health', '/api/auth/*', '/api/games', '/api/decks/*']
    });
    
  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}