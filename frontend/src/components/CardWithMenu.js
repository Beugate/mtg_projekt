import React, { useState } from 'react';
import { useDrag } from 'react-dnd';
import api from '../services/api';

const CardWithMenu = ({ card, zone, gameId, onUpdate }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'card',
    item: () => {
      setShowMenu(false); // Hide menu when dragging
      return { 
        cardId: card.id, 
        fromZone: zone
      };
    },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging()
    })
  }), [card.id, zone]);

  const handleRightClick = (e) => {
    e.preventDefault();
    setMenuPosition({ x: e.clientX, y: e.clientY });
    setShowMenu(true);
  };

  const handlePutOnTop = async () => {
    setShowMenu(false);
    try {
      await api.putCardOnTop(gameId, card.id, zone);
      onUpdate();
    } catch (error) {
      console.error('Error putting card on top:', error);
    }
  };

  const handlePutOnBottom = async () => {
    setShowMenu(false);
    try {
      await api.putCardOnBottom(gameId, card.id, zone);
      onUpdate();
    } catch (error) {
      console.error('Error putting card on bottom:', error);
    }
  };

  // Close menu when clicking elsewhere
  React.useEffect(() => {
    const handleClick = () => setShowMenu(false);
    if (showMenu) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [showMenu]);

  return (
    <>
      <div
        ref={drag}
        className={`card ${card.tapped ? 'tapped' : ''}`}
        style={{
          opacity: isDragging ? 0.5 : 1,
          cursor: 'grab'
        }}
        onContextMenu={handleRightClick}
        title={`${card.name} - Right-click for options`}
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
      
      {showMenu && (
        <div 
          className="card-context-menu"
          style={{
            position: 'fixed',
            left: menuPosition.x,
            top: menuPosition.y,
            zIndex: 10000
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={handlePutOnTop}>Put on Top of Library</button>
          <button onClick={handlePutOnBottom}>Put on Bottom of Library</button>
        </div>
      )}
    </>
  );
};

export default CardWithMenu;