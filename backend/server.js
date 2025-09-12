import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/authRoutes.js';
import deckRoutes from './routes/deckRoutes.js';
import gameRoutes from './routes/gameRoutes.js';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['MONGODB_URI'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(` Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

const app = express();
const PORT = process.env.PORT || 5000;

console.log(' Starting MTG Deck Tester Backend...');
console.log(` Node.js version: ${process.version}`);
console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);

// ===== MIDDLEWARE =====
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] // Replace with your frontend domain
    : ['http://localhost:3000'], // React dev server
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging in development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`, req.body ? 'dev' : '');
    next();
  });
}

// ===== ROUTES =====
// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

// Basic route
app.get('/', (req, res) => {
  res.json({
    message: 'MTG Deck Tester Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      decks: '/api/decks',
      games: '/api/games'
    }
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/decks', deckRoutes);
app.use('/api/games', gameRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    availableRoutes: ['/api/health', '/api/auth', '/api/decks', '/api/games']
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error(' Server Error:', error.message);
  
  // MongoDB duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return res.status(400).json({
      error: `${field} already exists`,
      field: field
    });
  }
  
  // Validation errors
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(err => err.message);
    return res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
  }
  
  
  
  // Default error
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// ===== DATABASE CONNECTION =====
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    console.log('🔌 Connecting to MongoDB...');
    
    // Connect to MongoDB (no deprecated options needed)
    const conn = await mongoose.connect(mongoURI);
    
    console.log(` MongoDB Connected!`);
    console.log(` Host: ${conn.connection.host}`);
    console.log(` Database: ${conn.connection.name}`);
    
    // Log collection info in development
    if (process.env.NODE_ENV !== 'production') {
      const collections = await conn.connection.db.listCollections().toArray();
      console.log(`Collections: ${collections.map(c => c.name).join(', ') || 'none yet'}`);
    }
    
  } catch (error) {
    console.error(' MongoDB connection failed:', error.message);
    
    // Common error help
    if (error.message.includes('authentication failed')) {
      console.log(' Check your username/password in MONGODB_URI');
    } else if (error.message.includes('ENOTFOUND')) {
      console.log('Check your internet connection and MongoDB URI');
    } else if (error.message.includes('timeout')) {
      console.log(' Check your network access settings in MongoDB Atlas');
    }
    
    process.exit(1);
  }
};

// ===== START SERVER =====
const startServer = async () => {
  // Connect to database first
  await connectDB();
  
  // Start HTTP server
  const server = app.listen(PORT, () => {
    console.log(' Server started successfully!');
    console.log(` Local: http://localhost:${PORT}`);
    console.log(` Health check: http://localhost:${PORT}/api/health`);
    console.log(` API docs: http://localhost:${PORT}/`);
  });
  
  return server;
};

// Handle MongoDB connection events
mongoose.connection.on('disconnected', () => {
  console.log('  MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log(' MongoDB reconnected');
});

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('\n Shutting down gracefully...');
  
  try {
    await mongoose.connection.close();
    console.log(' MongoDB connection closed');
    
    process.exit(0);
  } catch (error) {
    console.error(' Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start the application
startServer().catch(error => {
  console.error(' Failed to start server:', error);
  process.exit(1);
});