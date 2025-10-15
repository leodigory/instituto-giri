import React, { createContext, useContext, useState } from 'react';

const GestaoContext = createContext();

export const useGestao = () => {
  const context = useContext(GestaoContext);
  if (!context) {
    throw new Error('useGestao deve ser usado dentro de GestaoProvider');
  }
  return context;
};

export const GestaoProvider = ({ children }) => {
  const [modoGestao, setModoGestao] = useState(false);

  const entrarGestao = () => {
    setModoGestao(true);
  };

  const sairGestao = () => {
    setModoGestao(false);
  };

  const value = {
    modoGestao,
    entrarGestao,
    sairGestao,
  };

  return (
    <GestaoContext.Provider value={value}>
      {children}
    </GestaoContext.Provider>
  );
};
