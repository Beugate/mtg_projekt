import mongoose from 'mongoose';

const cardSchema = new mongoose.Schema({
  name: String,
  quantity: Number,
  imageUrl: String
});

const deckSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  format: {
    type: String,
    enum: ['standard', 'modern', 'legacy', 'vintage', 'commander', 'casual'],
    default: 'casual'
  },
  cards: [cardSchema],
  mainboard: [cardSchema],
  sideboard: [cardSchema],
  description: String,
  colors: [String], // ['W', 'U', 'B', 'R', 'G']
  isPublic: {
    type: Boolean,
    default: false
  },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  tags: [String],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Deck', deckSchema);