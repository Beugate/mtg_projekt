import mongoose from 'mongoose';

// Card schema for game state
const gameCardSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  tapped: {
    type: Boolean,
    default: false
  },
  position: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 }
  },
  counters: {
    type: Map,
    of: Number,
    default: new Map()
  }
}, { _id: false });

// Game state schema
const gameSchema = new mongoose.Schema({
  // Player info
  playerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Allow anonymous games
  },
  playerName: {
    type: String,
    default: 'Player'
  },
  
  // Game state
  life: {
    type: Number,
    default: 20,
    min: -100,
    max: 200
  },
  
  // Card zones
  zones: {
    library: [gameCardSchema],
    hand: [gameCardSchema],
    battlefield: [gameCardSchema],
    graveyard: [gameCardSchema],
    exile: [gameCardSchema]
  },
  
  // Game settings
  startingLife: {
    type: Number,
    default: 20
  },
  format: {
    type: String,
    default: 'casual'
  },
  
  // Game metadata
  deckName: String,
  gameNumber: {
    type: Number,
    default: 1
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  endedAt: Date,
  
  // Game result
  result: {
    type: String,
    enum: ['win', 'loss', 'draw', 'ongoing'],
    default: 'ongoing'
  },
  
  // Turn tracking
  turn: {
    type: Number,
    default: 1,
    min: 1
  }
});

// Indexes
gameSchema.index({ playerId: 1, updatedAt: -1 });
gameSchema.index({ createdAt: -1 });

// Update timestamp before saving
gameSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for game duration
gameSchema.virtual('duration').get(function() {
  const end = this.endedAt || new Date();
  return Math.round((end - this.startedAt) / 1000 / 60); // minutes
});

// Method to shuffle library
gameSchema.methods.shuffleLibrary = function() {
  const library = this.zones.library;
  
  // Fisher-Yates shuffle
  for (let i = library.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [library[i], library[j]] = [library[j], library[i]];
  }
  
  this.markModified('zones.library');
  return this;
};

// Method to draw cards
gameSchema.methods.drawCards = function(count = 1) {
  if (this.zones.library.length < count) {
    count = this.zones.library.length;
  }
  
  const drawnCards = this.zones.library.splice(0, count);
  this.zones.hand.push(...drawnCards);
  
  this.markModified('zones');
  return drawnCards;
};

// Method to reset game
gameSchema.methods.resetGame = function() {
  // Collect all cards
  const allCards = [
    ...this.zones.library,
    ...this.zones.hand,
    ...this.zones.battlefield,
    ...this.zones.graveyard,
    ...this.zones.exile
  ];
  
  // Reset card states
  allCards.forEach(card => {
    card.tapped = false;
    card.position = { x: 0, y: 0 };
    card.counters = new Map();
  });
  
  // Shuffle and put back in library
  this.zones.library = allCards;
  this.zones.hand = [];
  this.zones.battlefield = [];
  this.zones.graveyard = [];
  this.zones.exile = [];
  
  // Reset game state
  this.life = this.startingLife;
  this.turn = 1;
  this.result = 'ongoing';
  this.startedAt = new Date();
  this.endedAt = undefined;
  
  // Shuffle library
  this.shuffleLibrary();
  
  this.markModified('zones');
  return this;
};

export default mongoose.model('Game', gameSchema);