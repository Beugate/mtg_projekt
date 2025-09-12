import mongoose from 'mongoose';

// Card schema for deck building
const cardSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    max: 100,
    default: 1
  },
  imageUrl: {
    type: String,
    default: function() {
      return `https://api.scryfall.com/cards/named?format=image&face=front&fuzzy=${encodeURIComponent(this.name)}`;
    }
  },
  manaCost: String,
  type: String,
  rarity: String,
  set: String
}, { _id: false });

// Main deck schema
const deckSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Deck name is required'],
    trim: true,
    maxlength: [50, 'Deck name cannot exceed 50 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  

  // Card lists
  cards: [cardSchema],
  mainboard: [cardSchema],
  sideboard: [cardSchema],
  
  // Deck metadata
  colors: [{
    type: String,
    enum: ['W', 'U', 'B', 'R', 'G', 'C'], // White, Blue, Black, Red, Green, Colorless
    uppercase: true
  }],
  
  // Deck stats
  totalCards: {
    type: Number,
    default: 0
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  
 
  // Tags for organization
  tags: [{
    type: String,
    trim: true,
    maxlength: 20
  }],
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastPlayed: {
    type: Date
  }
});

// Indexes for performance
deckSchema.index({ userId: 1, updatedAt: -1 });
deckSchema.index({ userId: 1, name: 1 });
deckSchema.index({ isPublic: 1, updatedAt: -1 });

// Update the updatedAt field before saving
deckSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Calculate total cards
  this.totalCards = this.cards.reduce((total, card) => total + card.quantity, 0);
  
  next();
});


// Static method to find user's decks
deckSchema.statics.findByUser = function(userId, options = {}) {
  const query = this.find({ userId });
  
  if (options.format) {
    query.where({ format: options.format });
  }
  
  if (options.limit) {
    query.limit(options.limit);
  }
  
  return query.sort({ updatedAt: -1 });
};

export default mongoose.model('Deck', deckSchema);