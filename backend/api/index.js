// Simple test handler - no imports for now
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { url, method } = req;
  
  try {
    // Health check
    if (url === '/api/health' || url === '/health') {
      return res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        message: 'Backend is working!',
        environment: process.env.NODE_ENV || 'development'
      });
    }
    
    // Root endpoint
    if (url === '/' || url === '/api') {
      return res.status(200).json({
        message: 'MTG Deck Tester API',
        status: 'running',
        version: '1.0.0'
      });
    }
    
    // Test environment variables
    if (url === '/api/test') {
      return res.status(200).json({
        mongoConfigured: !!process.env.MONGODB_URI,
        jwtConfigured: !!process.env.JWT_SECRET,
        nodeEnv: process.env.NODE_ENV
      });
    }
    
    // Default 404
    res.status(404).json({
      error: 'Route not found',
      path: url,
      method: method
    });
    
  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}