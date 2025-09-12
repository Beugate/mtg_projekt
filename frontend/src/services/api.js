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
    console.log('API Call: moveCard', { gameId, cardId, fromZone, toZone, position });
    
    const response = await axios.patch(`${API_URL}/games/${gameId}/move-card`, {
      cardId,
      fromZone,
      toZone,
      position
    });
    return response.data;
  },

  // Put card on top of library - ADD THIS
  putCardOnTop: async (gameId, cardId, fromZone) => {
    console.log('API Call: putCardOnTop', { gameId, cardId, fromZone });
    
    const response = await axios.patch(`${API_URL}/games/${gameId}/to-library-top`, {
      cardId,
      fromZone
    });
    return response.data;
  },

  // Put card on bottom of library - ADD THIS
  putCardOnBottom: async (gameId, cardId, fromZone) => {
    console.log('API Call: putCardOnBottom', { gameId, cardId, fromZone });
    
    const response = await axios.patch(`${API_URL}/games/${gameId}/to-library-bottom`, {
      cardId,
      fromZone
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
  },

  // Import deck
  importDeck: async (gameId, deckList) => {
    const response = await axios.post(`${API_URL}/games/${gameId}/import-deck`, {
      deckList
    });
    return response.data;
  },


  setAuthToken: (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
},

// Auth endpoints
// Update the register function - NO EMAIL
register: async (username, password) => {
  const response = await axios.post(`${API_URL}/auth/register`, {
    username,
    password
  });
  return response.data;
},

login: async (username, password) => {
  const response = await axios.post(`${API_URL}/auth/login`, {
    username,
    password
  });
  return response.data;
},

// Deck endpoints
getMyDecks: async () => {
  const response = await axios.get(`${API_URL}/decks/my-decks`);
  return response.data;
},

saveDeck: async (name, cards, description) => {
  const response = await axios.post(`${API_URL}/decks/save`, {
    name,
    cards,
    description
  });
  return response.data;
},

loadDeck: async (deckId) => {
  const response = await axios.get(`${API_URL}/decks/${deckId}`);
  return response.data;
},

updateDeck: async (deckId, name, cards, description) => {
  const response = await axios.put(`${API_URL}/decks/${deckId}`, {
    name,
    cards,
    description
  });
  return response.data;
},

deleteDeck: async (deckId) => {
  const response = await axios.delete(`${API_URL}/decks/${deckId}`);
  return response.data;
}
};

export default api;