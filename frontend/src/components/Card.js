import React from 'react';
import { useDrag } from 'react-dnd';

const Card = ({ card, zone, gameId, onUpdate }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'card',
    item: () => {
      console.log(`Dragging card ${card.id} from ${zone}`);
      return { 
        cardId: card.id, 
        fromZone: zone
      };
    },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging()
    })
  }), [card.id, zone]);

  return (
    <div
      ref={drag}
      className={`card ${card.tapped ? 'tapped' : ''}`}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: 'grab'
      }}
      title={card.name}
    >
      <img 
        src={card.imageUrl} 
        alt={card.name}
        draggable={false}
        onError={(e) => {
          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUwIiBoZWlnaHQ9IjM1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjUwIiBoZWlnaHQ9IjM1MCIgZmlsbD0iIzJhMmEyYSIvPgogIDxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjIzMCIgaGVpZ2h0PSIzMzAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzY2NiIgc3Ryb2tlLXdpZHRoPSIyIi8+CiAgPGNpcmNsZSBjeD0iMTI1IiBjeT0iMTc1IiByPSI0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjNjY2IiBzdHJva2Utd2lkdGg9IjIiLz4KPC9zdmc+';
        }}
      />
    </div>
  );
};

export default Card;