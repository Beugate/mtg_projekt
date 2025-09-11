import React from 'react';
import { useDrop } from 'react-dnd';
import CardWithMenu from './CardWithMenu';
import api from '../services/api';

const Zone = ({ zoneName, cards, gameId, onUpdate, className }) => {
  const [{ isOver }, drop] = useDrop({
    accept: 'card',
    drop: (item) => {
      if (item.fromZone === zoneName) {
        console.log(`Already in ${zoneName}, ignoring`);
        return;
      }
      
      console.log(`Moving card from ${item.fromZone} to ${zoneName}`);
      
      api.moveCard(gameId, item.cardId, item.fromZone, zoneName)
        .then((result) => {
          console.log('Move successful');
          onUpdate();
        })
        .catch(error => {
          console.error('Move failed:', error);
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
    >
      <div className="zone-header">
        <span className="zone-name">{zoneName}</span>
        <span className="zone-count">{cards.length}</span>
      </div>
      <div className="zone-cards">
        {cards.map((card) => (
          <CardWithMenu
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