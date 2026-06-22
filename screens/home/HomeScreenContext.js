import React, { createContext, useContext } from 'react';

const HomeScreenContext = createContext(null);

export function HomeScreenProvider({ value, children }) {
  return (
    <HomeScreenContext.Provider value={value}>
      {children}
    </HomeScreenContext.Provider>
  );
}

export function useHomeScreen() {
  const context = useContext(HomeScreenContext);
  if (!context) {
    throw new Error('useHomeScreen precisa ser usado dentro de HomeScreenProvider');
  }
  return context;
}
