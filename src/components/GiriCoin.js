import React from 'react';

const GiriCoin = ({ size = 24, className = '' }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Sombra */}
      <ellipse cx="50" cy="90" rx="35" ry="8" fill="rgba(0,0,0,0.2)" />
      
      {/* Moeda - Camada de fundo escura */}
      <circle cx="50" cy="50" r="45" fill="#D97706" />
      
      {/* Moeda - Camada principal dourada */}
      <circle cx="50" cy="50" r="42" fill="url(#goldGradient)" />
      
      {/* Borda interna */}
      <circle cx="50" cy="50" r="38" fill="none" stroke="#F59E0B" strokeWidth="2" />
      <circle cx="50" cy="50" r="35" fill="none" stroke="#FBBF24" strokeWidth="1" />
      
      {/* Círculo interno para a letra */}
      <circle cx="50" cy="50" r="30" fill="#D97706" opacity="0.3" />
      
      {/* Texto GGs */}
      <text
        x="50"
        y="50"
        fontFamily="Arial, sans-serif"
        fontSize="24"
        fontWeight="bold"
        fill="#FEF3C7"
        textAnchor="middle"
        dominantBaseline="central"
        style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
      >
        GGs
      </text>
      
      {/* Brilho superior */}
      <ellipse 
        cx="35" 
        cy="30" 
        rx="15" 
        ry="10" 
        fill="white" 
        opacity="0.4"
        transform="rotate(-30 35 30)"
      />
      
      {/* Gradiente dourado */}
      <defs>
        <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="50%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export default GiriCoin;
