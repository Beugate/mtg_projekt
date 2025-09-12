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
      
      // Basic validation
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
      }
      
      if (username.length < 3) {
        return res.status(400).json({ error: 'Username must be at least 3 characters' });
      }
      
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }
      
      // For now, just return success (we'll add MongoDB later)
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
      
      // For now, just return success
      return res.status(200).json({
        message: 'Login successful',
        user: { 
          id: 'temp-' + Date.now(), 
          username: username.toLowerCase() 
        },
        token: 'temp-token-' + Date.now()
      });
    }
    
    // Root endpoint
    if (url === '/') {
      return res.status(200).json({
        message: 'MTG Deck Tester API',
        status: 'running',
        endpoints: ['/api/health', '/api/auth/register', '/api/auth/login']
      });
    }
    
    // 404 for all other routes
    res.status(404).json({
      error: 'Route not found',
      path: url,
      method: method,
      availableRoutes: ['/api/health', '/api/auth/register', '/api/auth/login']
    });
    
  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}