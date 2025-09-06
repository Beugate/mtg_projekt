import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = {
  // Create new game
  createGame: async (deck = null) => {
    const response = await axios.post(`${API_URL}/games`, { deck });
    return response.data;
  },

  // Get game state
  getGame: async (gameId) => {
    const response = await axios.get(`${API_URL}/games/${gameId}`);
    return response.data;
  },

  // Update life
  updateLife: async (gameId, change) => {
    const response = await axios.patch(`${API_URL}/games/${gameId}/life`, {
      change
    });
    return response.data;
  },

  // Draw cards
  drawCards: async (gameId, count = 1) => {
    const response = await axios.patch(`${API_URL}/games/${gameId}/draw`, {
      count
    });
    return response.data;
  },

  // View deck
  viewDeck: async (gameId) => {
    const response = await axios.get(`${API_URL}/games/${gameId}/deck`);
    return response.data;
  },

  // Toggle tap
  toggleTap: async (gameId, cardId) => {
    const response = await axios.patch(`${API_URL}/games/${gameId}/tap`, {
      cardId
    });
    return response.data;
  },

  // Move card
  moveCard: async (gameId, cardId, fromZone, toZone, position = null) => {
    const response = await axios.patch(`${API_URL}/games/${gameId}/move-card`, {
      cardId,
      fromZone,
      toZone,
      position
    });
    return response.data;
  },

  // Shuffle library
  shuffleLibrary: async (gameId) => {
    const response = await axios.patch(`${API_URL}/games/${gameId}/shuffle`);
    return response.data;
  },

  // Reset game
  resetGame: async (gameId) => {
    const response = await axios.patch(`${API_URL}/games/${gameId}/reset`);
    return response.data;
  }
};

export default api;