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
  
  try {
    // Health check
    if (url === '/api/health') {
      return res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        message: 'Backend is working!',
        database: 'Simulated'
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
          id: 'user-' + Date.now(), 
          username: username.toLowerCase() 
        },
        token: 'token-' + Date.now()
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
          id: 'user-' + Date.now(), 
          username: username.toLowerCase() 
        },
        token: 'token-' + Date.now()
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
    if (url.match(/^\/api\/games\/[^\/]+$/) && method === 'GET') {
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
    
    // Import deck route
    if (url.match(/^\/api\/games\/[^\/]+\/import-deck$/) && method === 'POST') {
      const gameId = url.split('/')[3];
      const { deckList } = req.body;
      
      if (!deckList || !deckList.trim()) {
        return res.status(400).json({ error: 'Deck list is required' });
      }
      
      try {
        const cards = [];
        const lines = deckList.split('\n').filter(line => line.trim());
        
        lines.forEach((line, index) => {
          const trimmedLine = line.trim();
          if (!trimmedLine) return;
          
          // Parse "4 Lightning Bolt" or just "Lightning Bolt"
          const match = trimmedLine.match(/^(\d+)?\s*(.+)$/);
          if (match) {
            const count = parseInt(match[1]) || 1;
            const cardName = match[2].trim();
            
            for (let i = 0; i < count; i++) {
              cards.push({
                id: `imported-${Date.now()}-${index}-${i}`,
                name: cardName,
                imageUrl: `https://api.scryfall.com/cards/named?format=image&face=front&fuzzy=${encodeURIComponent(cardName)}`,
                tapped: false,
                position: { x: 0, y: 0 }
              });
            }
          }
        });
        
        if (cards.length === 0) {
          return res.status(400).json({ error: 'No valid cards found in deck list' });
        }
        
        // Return updated game state with imported deck
        return res.status(200).json({
          _id: gameId,
          life: 20,
          zones: {
            library: cards,
            hand: [],
            battlefield: [],
            graveyard: [],
            exile: []
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        
      } catch (error) {
        console.error('Deck import error:', error);
        return res.status(500).json({ error: 'Failed to parse deck list' });
      }
    }
    
    // Update life total
    if (url.match(/^\/api\/games\/[^\/]+\/life$/) && method === 'PATCH') {
      const gameId = url.split('/')[3];
      const { change } = req.body;
      
      return res.status(200).json({
        _id: gameId,
        life: 20 + (change || 0),
        zones: {
          library: [],
          hand: [],
          battlefield: [],
          graveyard: [],
          exile: []
        },
        updatedAt: new Date().toISOString()
      });
    }
    
    // Draw cards
    if (url.match(/^\/api\/games\/[^\/]+\/draw$/) && method === 'PATCH') {
      const gameId = url.split('/')[3];
      const { count = 1 } = req.body;
      
      // Simulate drawing cards
      const drawnCards = [];
      for (let i = 0; i < count; i++) {
        drawnCards.push({
          id: `drawn-${Date.now()}-${i}`,
          name: `Drawn Card ${i + 1}`,
          imageUrl: `https://via.placeholder.com/250x350/444444/ffffff?text=Drawn+${i + 1}`,
          tapped: false,
          position: { x: 0, y: 0 }
        });
      }
      
      return res.status(200).json({
        _id: gameId,
        life: 20,
        zones: {
          library: [],
          hand: drawnCards,
          battlefield: [],
          graveyard: [],
          exile: []
        },
        updatedAt: new Date().toISOString()
      });
    }
    
    // Move card between zones
    if (url.match(/^\/api\/games\/[^\/]+\/move-card$/) && method === 'PATCH') {
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
        updatedAt: new Date().toISOString()
      });
    }
    
    // Shuffle library
    if (url.match(/^\/api\/games\/[^\/]+\/shuffle$/) && method === 'PATCH') {
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
        updatedAt: new Date().toISOString()
      });
    }
    
    // Reset game
    if (url.match(/^\/api\/games\/[^\/]+\/reset$/) && method === 'PATCH') {
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
        updatedAt: new Date().toISOString()
      });
    }
    
    // DECK ROUTES
    if (url === '/api/decks/my-decks' && method === 'GET') {
      return res.status(200).json([]);
    }
    
    if (url === '/api/decks/save' && method === 'POST') {
      const { name, cards, description } = req.body;
      
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Deck name is required' });
      }
      
      return res.status(201).json({
        message: 'Deck saved successfully',
        deck: {
          _id: 'deck-' + Date.now(),
          name: name.trim(),
          description: description || '',
          totalCards: cards ? cards.length : 0,
          format: 'casual',
          createdAt: new Date().toISOString()
        }
      });
    }
    
    // Root endpoint
    if (url === '/' || url === '/api') {
      return res.status(200).json({
        message: 'MTG Deck Tester API',
        status: 'running',
        version: '1.0.0',
        endpoints: {
          health: '/api/health',
          auth: '/api/auth/*',
          games: '/api/games/*',
          decks: '/api/decks/*'
        }
      });
    }
    
    // 404 for all other routes
    res.status(404).json({
      error: 'Route not found',
      path: url,
      method: method,
      availableEndpoints: [
        '/api/health',
        '/api/auth/register',
        '/api/auth/login',
        '/api/games',
        '/api/games/:id/import-deck',
        '/api/decks/my-decks',
        '/api/decks/save'
      ]
    });
    
  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}