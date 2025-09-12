import React from 'react';
import api from '../services/api';

const LifeCounter = ({ life, gameId, onUpdate }) => {
  const adjustLife = async (amount) => {
    try {
      await api.updateLife(gameId, amount);
      onUpdate();
    } catch (error) {
      console.error('Error updating life:', error);
    }
  };

  return (
    <div className="life-counter">
      <span className="life-label">Life Total</span>
      <div className="life-controls">
        
        <button className="life-btn minus" onClick={() => adjustLife(-1)}>
          -1
        </button>
        <span className="life-total">{life}</span>
        <button className="life-btn plus" onClick={() => adjustLife(1)}>
          +1
        </button>
        
      </div>
    </div>
  );
};

export default LifeCounter;