import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

// Try to import your existing routes
let authRoutes, deckRoutes, gameRoutes;

try {
  // Import your actual route files
  authRoutes = (await import('../routes/authRoutes.js')).default;
  deckRoutes = (await import('../routes/deckRoutes.js')).default;
  gameRoutes = (await import('../routes/gameRoutes.js')).default;
} catch (error) {
  console.error('Route import error:', error);
}

const app = express();

// Your existing middleware
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());

// MongoDB connection for serverless
let isConnected = false;
async function connectDB() {
  if (isConnected && mongoose.connection.readyState === 1) return;
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    isConnected = true;
  } catch (error) {
    console.error('MongoDB error:', error);
    throw error;
  }
}

// Connect to DB on each request
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// Use your existing routes if they loaded
if (authRoutes) app.use('/api/auth', authRoutes);
if (deckRoutes) app.use('/api/decks', deckRoutes);
if (gameRoutes) app.use('/api/games', gameRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', database: 'Connected' });
});

export default app;