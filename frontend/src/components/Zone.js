import React from 'react';
import { useDrop } from 'react-dnd';
import Card from './Card';
import api from '../services/api';

const Zone = ({ zoneName, cards, gameId, onUpdate, className }) => {
  const [{ isOver }, drop] = useDrop({
    accept: 'card',
    drop: async (item) => {
      if (item.fromZone !== zoneName) {
        try {
          await api.moveCard(
            gameId,
            item.id,
            item.fromZone,
            zoneName
          );
          onUpdate();
        } catch (error) {
          console.error('Error moving card:', error);
        }
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const getZoneCount = () => {
    if (cards.length === 0) return '';
    return `(${cards.length})`;
  };

  return (
    <div
      ref={drop}
      className={`zone ${className} ${isOver ? 'zone-hover' : ''}`}
    >
      <div className="zone-header">
        {zoneName.toUpperCase()} {getZoneCount()}
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