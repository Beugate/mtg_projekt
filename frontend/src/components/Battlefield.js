import React, { useState, useRef } from 'react';
import { useDrop } from 'react-dnd';
import { useDrag } from 'react-dnd';
import api from '../services/api';

const BattlefieldCard = ({ card, gameId, onUpdate }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  // Make card draggable to other zones
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'card',
    item: { 
      cardId: card.id, 
      fromZone: 'battlefield'
    },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging()
    })
  }), [card.id]);

  // Right-click for menu
  const handleContextMenu = (e) => {
    e.preventDefault();
    setMenuPosition({ x: e.clientX, y: e.clientY });
    setShowMenu(true);
  };

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    api.toggleTap(gameId, card.id)
      .then(() => onUpdate())
      .catch(error => console.error('Error toggling tap:', error));
  };

  const handlePutOnTop = async () => {
    setShowMenu(false);
    try {
      await api.putCardOnTop(gameId, card.id, 'battlefield');
      onUpdate();
    } catch (error) {
      console.error('Error putting card on top:', error);
    }
  };

  const handlePutOnBottom = async () => {
    setShowMenu(false);
    try {
      await api.putCardOnBottom(gameId, card.id, 'battlefield');
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
        className={`battlefield-card ${card.tapped ? 'tapped' : ''}`}
        style={{
          left: `${card.position?.x || 10}%`,
          top: `${card.position?.y || 10}%`,
          opacity: isDragging ? 0.5 : 1
        }}
        onContextMenu={handleContextMenu}
        onDoubleClick={handleDoubleClick}
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

const Battlefield = ({ cards, gameId, onUpdate }) => {
  const containerRef = useRef(null);
  const [localCards, setLocalCards] = useState(cards);

  // Update local cards when props change
  React.useEffect(() => {
    setLocalCards(cards);
  }, [cards]);

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'card',
    drop: async (item, monitor) => {
      const clientOffset = monitor.getClientOffset();
      const containerRect = containerRef.current?.getBoundingClientRect();
      
      let position = { x: 10, y: 10 };
      
      if (clientOffset && containerRect) {
        const x = ((clientOffset.x - containerRect.left - 63) / containerRect.width) * 100;
        const y = ((clientOffset.y - containerRect.top - 88) / containerRect.height) * 100;
        
        position = {
          x: Math.max(0, Math.min(85, x)),
          y: Math.max(0, Math.min(80, y))
        };
      }

      // If card is already on battlefield, just update position
      if (item.fromZone === 'battlefield') {
        // Update position locally first for smooth movement
        setLocalCards(prev => prev.map(c => 
          c.id === item.cardId ? { ...c, position } : c
        ));
        
        // Then update backend
        try {
          await api.moveCard(gameId, item.cardId, 'battlefield', 'battlefield', position);
          onUpdate();
        } catch (error) {
          console.error('Error updating position:', error);
        }
      } else {
        // Moving from another zone to battlefield
        try {
          await api.moveCard(gameId, item.cardId, item.fromZone, 'battlefield', position);
          onUpdate();
        } catch (error) {
          console.error('Error moving card to battlefield:', error);
        }
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver()
    })
  }), [gameId, onUpdate]);

  const setRefs = (el) => {
    containerRef.current = el;
    drop(el);
  };

  return (
    <div
      ref={setRefs}
      className={`battlefield ${isOver ? 'battlefield-hover' : ''}`}
    >
      <div className="battlefield-header">
        <span>Battlefield</span>
        <span className="battlefield-hint">Drag to move • Right-click for menu • Double-click to tap</span>
      </div>
      {localCards.map((card) => (
        <BattlefieldCard
          key={card.id}
          card={card}
          gameId={gameId}
          onUpdate={onUpdate}
        />
      ))}
    </div>
  );
};

export default Battlefield;