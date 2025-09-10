import React from 'react';
import { useDrop } from 'react-dnd';
import Card from './Card';
import api from '../services/api';

const Zone = ({ zoneName, cards, gameId, onUpdate, className }) => {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: 'card',
    canDrop: (item) => {
      // Can drop if it's from a different zone
      return item.fromZone !== zoneName;
    },
    drop: (item) => {
      console.log(`Dropping on ${zoneName} from ${item.fromZone}`);
      
      // Don't do anything if dropping in same zone
      if (item.fromZone === zoneName) {
        console.log('Same zone, ignoring');
        return;
      }
      
      // Move the card
      console.log(`Moving card ${item.cardId} from ${item.fromZone} to ${zoneName}`);
      
      api.moveCard(gameId, item.cardId, item.fromZone, zoneName, null)
        .then(() => {
          console.log('Move successful, updating...');
          onUpdate();
        })
        .catch(error => {
          console.error('Error moving card:', error);
          alert(`Error moving card: ${error.message}`);
        });
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop()
    })
  }), [gameId, zoneName, onUpdate]);

  return (
    <div
      ref={drop}
      className={`zone ${className} ${isOver && canDrop ? 'zone-hover' : ''} ${canDrop ? 'can-drop' : ''}`}
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
        {cards.length === 0 && (
          <div className="zone-empty">Drop cards here</div>
        )}
      </div>
    </div>
  );
};

export default Zone;