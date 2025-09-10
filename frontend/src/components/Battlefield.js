import React, { useState, useRef } from 'react';
import { useDrop } from 'react-dnd';
import { useDrag } from 'react-dnd';
import api from '../services/api';

const BattlefieldCard = ({ card, gameId, onUpdate, containerRef }) => {
  const [position, setPosition] = useState({
    x: card.position?.x || 10,
    y: card.position?.y || 10
  });
  const [isDraggingWithinBattlefield, setIsDraggingWithinBattlefield] = useState(false);

  // Setup for dragging to other zones
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

  // Handle both repositioning and zone dragging
  const handleMouseDown = (e) => {
    if (e.button !== 0) return; // Only left click
    
    // Check if Alt key is held - if so, let react-dnd handle it for zone movement
    if (e.altKey) {
      return; // Let the drag handler take over for zone movement
    }
    
    // Otherwise, handle repositioning within battlefield
    e.preventDefault();
    setIsDraggingWithinBattlefield(true);
    
    const container = containerRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const cardEl = e.currentTarget;
    const cardRect = cardEl.getBoundingClientRect();
    
    // Get offset of mouse within card
    const offsetX = e.clientX - cardRect.left;
    const offsetY = e.clientY - cardRect.top;
    
    const handleMouseMove = (e) => {
      const newX = ((e.clientX - rect.left - offsetX) / rect.width) * 100;
      const newY = ((e.clientY - rect.top - offsetY) / rect.height) * 100;
      
      setPosition({
        x: Math.max(0, Math.min(85, newX)), // Adjusted for bigger cards
        y: Math.max(0, Math.min(80, newY))
      });
    };
    
    const handleMouseUp = async () => {
      setIsDraggingWithinBattlefield(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      // Save position to backend
      try {
        await api.moveCard(gameId, card.id, 'battlefield', 'battlefield', position);
      } catch (error) {
        console.error('Error updating position:', error);
      }
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    api.toggleTap(gameId, card.id)
      .then(() => onUpdate())
      .catch(error => console.error('Error toggling tap:', error));
  };

  return (
    <div
      ref={drag}
      className={`battlefield-card ${card.tapped ? 'tapped' : ''} ${isDraggingWithinBattlefield ? 'repositioning' : ''}`}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        opacity: isDragging ? 0.5 : 1,
        cursor: isDraggingWithinBattlefield ? 'grabbing' : 'grab'
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      title={`${card.name} - Alt+Drag to move to zones • Drag to reposition • Double-click to tap`}
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

const Battlefield = ({ cards, gameId, onUpdate }) => {
  const containerRef = useRef(null);

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'card',
    drop: (item, monitor) => {
      if (item.fromZone === 'battlefield') {
        return;
      }
      
      const clientOffset = monitor.getClientOffset();
      const containerRect = containerRef.current?.getBoundingClientRect();
      
      let position = { x: 10, y: 10 };
      
      if (clientOffset && containerRect) {
        // Adjust for bigger card size (126x176)
        const x = ((clientOffset.x - containerRect.left - 63) / containerRect.width) * 100;
        const y = ((clientOffset.y - containerRect.top - 88) / containerRect.height) * 100;
        
        position = {
          x: Math.max(0, Math.min(85, x)),
          y: Math.max(0, Math.min(80, y))
        };
      }
      
      api.moveCard(gameId, item.cardId, item.fromZone, 'battlefield', position)
        .then(() => {
          onUpdate();
        })
        .catch(error => {
          console.error('Error moving card to battlefield:', error);
        });
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
        <span className="battlefield-hint">Alt+Drag to zones • Drag to move • Double-click to tap</span>
      </div>
      {cards.map((card) => (
        <BattlefieldCard
          key={card.id}
          card={card}
          gameId={gameId}
          onUpdate={onUpdate}
          containerRef={containerRef}
        />
      ))}
    </div>
  );
};

export default Battlefield;