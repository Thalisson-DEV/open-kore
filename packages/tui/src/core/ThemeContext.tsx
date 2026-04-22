import React, { createContext, useContext, ReactNode } from 'react';
import { type SyntaxStyle } from '@opentui/core';

interface ThemeContextType {
  syntaxStyle: SyntaxStyle;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider: React.FC<{ syntaxStyle: SyntaxStyle; children: ReactNode }> = ({ 
  syntaxStyle, 
  children 
}) => {
  return (
    <ThemeContext.Provider value={{ syntaxStyle }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
