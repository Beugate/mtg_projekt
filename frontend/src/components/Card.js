import React from 'react';
import { useDrag } from 'react-dnd';
import api from '../services/api';

const Card = ({ card, zone, gameId, onUpdate }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'card',
    item: { 
      id: card.id, 
      fromZone: zone
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const handleDoubleClick = async () => {
    if (zone === 'battlefield') {
      try {
        await api.toggleTap(gameId, card.id);
        onUpdate();
      } catch (error) {
        console.error('Error toggling tap:', error);
      }
    }
  };

  return (
    <div
      ref={drag}
      className={`card ${card.tapped ? 'tapped' : ''} ${isDragging ? 'dragging' : ''}`}
      onDoubleClick={handleDoubleClick}
      style={{
        opacity: isDragging ? 0.5 : 1,
      }}
      title={`${card.name} - Double-click to tap/untap`}
    >
      <img src={card.imageUrl} alt={card.name} />
      <div className="card-name">{card.name}</div>
    </div>
  );
};

export default Card;