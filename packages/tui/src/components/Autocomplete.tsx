import React from 'react';
import { theme } from '../theme';

interface AutocompleteProps {
  suggestions: string[];
  selectedIndex: number;
  onSelect: (value: string) => void;
  visible: boolean;
}

export const Autocomplete: React.FC<AutocompleteProps> = ({ 
  suggestions, 
  selectedIndex, 
  onSelect,
  visible
}) => {
  if (!visible || suggestions.length === 0) return null;

  return (
    <box 
      style={{
        flexDirection: "column",
        backgroundColor: "#1A1A1A",
        paddingX: 1,
        borderStyle: "rounded",
        borderColor: theme.fgMuted,
        position: 'absolute',
        bottom: 3,
        left: 2,
        width: 40,
        zIndex: 100,
      }}
    >
      <text bold fg={theme.accent}> 📎 Sugestões de Arquivos </text>
      <box style={{ flexDirection: 'column', marginTop: 0 }}>
        {suggestions.map((file, i) => {
          const isSelected = i === selectedIndex;
          return (
            <box 
              key={file} 
              style={{ 
                backgroundColor: isSelected ? theme.accent : "transparent",
                paddingX: 1
              }}
            >
              <text fg={isSelected ? "#000000" : theme.fg}>
                {isSelected ? '› ' : '  '}
                {file.length > 35 ? '...' + file.slice(-32) : file}
              </text>
            </box>
          );
        })}
      </box>
    </box>
  );
};
