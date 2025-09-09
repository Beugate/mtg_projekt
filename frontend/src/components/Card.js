import React from 'react';
import { useDrag } from 'react-dnd';

const Card = ({ card, zone }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'card',
    item: { 
      cardId: card.id, 
      fromZone: zone
    },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging()
    })
  });

  console.log(`Card ${card.id} is in zone: ${zone}`);

  return (
    <div
      ref={drag}
      className={`card ${card.tapped ? 'tapped' : ''}`}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: 'grab',
        width: '63px',
        height: '88px',
        backgroundColor: isDragging ? 'red' : 'transparent'
      }}
      title={`${card.name} (${zone})`}
    >
      <img 
        src={card.imageUrl} 
        alt={card.name}
        style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
        draggable={false}
        onError={(e) => {
          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUwIiBoZWlnaHQ9IjM1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjUwIiBoZWlnaHQ9IjM1MCIgZmlsbD0iIzJhMmEyYSIvPgogIDxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjIzMCIgaGVpZ2h0PSIzMzAiIGZpbGw0ibm9uZSIgc3Ryb2tlPSIjNjY2IiBzdHJva2Utd2lkdGg9IjIiLz4CiAgPGNpcmNsZSBjeD0iMTI1IiBjeT0iMTc1IiByPSI0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjNjY2IiBzdHJva2Utd2lkdGg9IjIiLz4KPC9zdmc+';
        }}
      />
    </div>
  );
};

export default Card;