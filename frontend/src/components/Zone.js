import React from 'react';
import { useDrop } from 'react-dnd';
import Card from './Card';
import api from '../services/api';

const Zone = ({ zoneName, cards, gameId, onUpdate, className }) => {
  const [{ isOver }, drop] = useDrop({
    accept: 'card',
    drop: (item) => {
      // Prevent dropping in same zone
      if (item.fromZone === zoneName) {
        console.log(`Already in ${zoneName}, ignoring`);
        return;
      }
      
      console.log(`✅ DROPPING: ${item.cardId} from ${item.fromZone} to ${zoneName}`);
      
      // Call API to move card
      api.moveCard(gameId, item.cardId, item.fromZone, zoneName)
        .then((result) => {
          console.log('✅ Move successful:', result);
          onUpdate();
        })
        .catch(error => {
          console.error('❌ Move failed:', error);
          alert(`Failed to move card: ${error.message}`);
        });
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver()
    })
  });

  return (
    <div
      ref={drop}
      className={`zone ${className} ${isOver ? 'zone-hover' : ''}`}
      style={{
        minHeight: '120px',
        border: isOver ? '2px solid #00ff00' : '1px solid #333'
      }}
    >
      <div className="zone-header">
        <span className="zone-name">{zoneName}</span>
        <span className="zone-count">{cards.length}</span>
      </div>
      <div className="zone-cards">
        {cards.map((card) => (
          <Card
            key={card.id}
            card={card}
            zone={zoneName}
            gameId={gameId}
            onUpdate={onUpdate}
          />
        ))}
      </div>
    </div>
  );
};

export default Zone;