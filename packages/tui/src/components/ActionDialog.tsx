import React, { useState } from 'react';
import { useKeyboard } from '@opentui/react';
import { theme } from '../theme';

interface ActionDialogProps {
  onClose: () => void;
  onCopy: () => void;
  onFork: () => void;
}

export const ActionDialog: React.FC<ActionDialogProps> = ({ onClose, onCopy, onFork }) => {
  const [index, setIndex] = useState(0);
  
  const options = [
    { label: 'Copiar Última Mensagem', action: onCopy },
    { label: 'Fork Session (Em breve)', action: onFork },
    { label: 'Fechar Menu', action: onClose }
  ];

  useKeyboard((key) => {
    if (key.name === 'up') {
      setIndex(i => (i > 0 ? i - 1 : options.length - 1));
    } else if (key.name === 'down') {
      setIndex(i => (i < options.length - 1 ? i + 1 : 0));
    } else if (key.name === 'return') {
      options[index].action();
    } else if (key.name === 'escape') {
      onClose();
    }
  });

  return (
    <box 
      style={{
        flexDirection: "column", 
        backgroundColor: theme.bgPanel, 
        paddingX: 2, 
        paddingY: 1,
        borderStyle: "rounded",
        borderColor: theme.accent,
        width: 70,
        zIndex: 100
      }}
    >
      <box style={{ marginBottom: 1, flexDirection: 'row' }}>
        <text fg={theme.accent} bold>⚡ AÇÕES RÁPIDAS</text>
      </box>
      
      <box style={{ flexDirection: 'column' }}>
        {options.map((opt, i) => {
          const isSelected = i === index;
          return (
            <box 
              key={i} 
              style={{ 
                backgroundColor: isSelected ? theme.accent : 'transparent',
                paddingX: 1,
                marginBottom: 0
              }}
            >
              <text fg={isSelected ? "#000000" : theme.fg} bold={isSelected}>
                {isSelected ? ' › ' : '   '}
                {opt.label}
              </text>
            </box>
          );
        })}
      </box>

      <box style={{ marginTop: 1, borderTop: 1, borderColor: "#222222" }}>
        <text fg={theme.fgDim}> [↑/↓] Navegar  [Enter] Confirmar  [Esc] Sair </text>
      </box>
    </box>
  );
};
