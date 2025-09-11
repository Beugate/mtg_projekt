const DeckManager = ({ userId }) => {
  const [decks, setDecks] = useState([]);
  const [selectedDeck, setSelectedDeck] = useState(null);

  useEffect(() => {
    fetchDecks();
  }, []);

  const fetchDecks = async () => {
    try {
      const response = await api.get('/decks/my-decks');
      setDecks(response.data);
    } catch (error) {
      console.error('Error fetching decks:', error);
    }
  };

  const saveDeck = async (deckData) => {
    try {
      await api.post('/decks', deckData);
      fetchDecks();
    } catch (error) {
      console.error('Error saving deck:', error);
    }
  };

  const loadDeck = async (deckId) => {
    try {
      const response = await api.get(`/decks/${deckId}`);
      setSelectedDeck(response.data);
      // Load into game
    } catch (error) {
      console.error('Error loading deck:', error);
    }
  };

  return (
    <div className="deck-manager">
      <h3>My Decks</h3>
      <div className="deck-list">
        {decks.map(deck => (
          <div key={deck._id} className="deck-item">
            <h4>{deck.name}</h4>
            <p>{deck.format} - {deck.wins}W/{deck.losses}L</p>
            <button onClick={() => loadDeck(deck._id)}>Load</button>
          </div>
        ))}
      </div>
    </div>
  );
};