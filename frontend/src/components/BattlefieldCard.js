import React, { useState, useEffect, useRef } from 'react';
import { useDrag } from 'react-dnd';
import api from '../services/api';

const BattlefieldCard = ({ card, gameId, onUpdate, onMove, containerRef }) => {
  const [position, setPosition] = useState({ x: card.position.x, y: card.position.y });
  const [isDraggingCard, setIsDraggingCard] = useState(false);
  const cardRef = useRef(null);

  const [{ isDragging }, drag] = useDrag({
    type: 'card',
    item: { 
      id: card.id, 
      fromZone: 'battlefield',
      card: card
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  useEffect(() => {
    setPosition({ x: card.position.x, y: card.position.y });
  }, [card.position]);

  const handleMouseDown = (e) => {
    // Check if it's a left click (button 0)
    if (e.button !== 0) return;
    
    // Prevent drag-and-drop from interfering
    e.stopPropagation();
    e.preventDefault();
    
    setIsDraggingCard(true);
    
    const container = containerRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const cardElement = cardRef.current;
    if (!cardElement) return;
    
    const cardRect = cardElement.getBoundingClientRect();
    
    // Calculate offset from mouse to card corner
    const offsetX = e.clientX - cardRect.left;
    const offsetY = e.clientY - cardRect.top;
    
    const handleMouseMove = (e) => {
      const newX = ((e.clientX - rect.left - offsetX) / rect.width) * 100;
      const newY = ((e.clientY - rect.top - offsetY) / rect.height) * 100;
      
      // Keep card within boundaries
      const boundedX = Math.max(0, Math.min(newX, 92));
      const boundedY = Math.max(0, Math.min(newY, 85));
      
      setPosition({ x: boundedX, y: boundedY });
    };
    
    const handleMouseUp = async () => {
      setIsDraggingCard(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      // Save new position to backend
      await onMove(card.id, position);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleDoubleClick = async (e) => {
    e.stopPropagation();
    try {
      await api.toggleTap(gameId, card.id);
      onUpdate();
    } catch (error) {
      console.error('Error toggling tap:', error);
    }
  };

  // Combine drag ref and card ref
  const setRefs = (el) => {
    drag(el);
    cardRef.current = el;
  };

  return (
    <div
      ref={setRefs}
      className={`battlefield-card ${card.tapped ? 'tapped' : ''} ${isDraggingCard ? 'dragging-position' : ''}`}
      style={{
        position: 'absolute',
        left: `${position.x}%`,
        top: `${position.y}%`,
        opacity: isDragging ? 0.5 : 1,
        cursor: isDraggingCard ? 'grabbing' : 'grab',
        zIndex: isDraggingCard ? 1000 : 'auto',
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      title={card.name}
    >
      <img 
        src={card.imageUrl} 
        alt=""
        onError={(e) => {
          e.target.src = `https://via.placeholder.com/250x350/333333/ffffff?text=Card`;
        }}
        draggable={false}
      />
    </div>
  );
};

export default BattlefieldCard;