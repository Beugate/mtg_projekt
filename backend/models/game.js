import mongoose from 'mongoose';

const cardSchema = new mongoose.Schema({
  id: String,
  name: String,
  imageUrl: String,
  tapped: { type: Boolean, default: false },
  position: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 }
  }
});

const gameSchema = new mongoose.Schema({
  life: { type: Number, default: 20 },
  zones: {
    library: [cardSchema],
    hand: [cardSchema],
    battlefield: [cardSchema],
    graveyard: [cardSchema],
    exile: [cardSchema]
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Game', gameSchema);