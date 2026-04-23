import React, { useState } from 'react';
import { useKeyboard, useTerminalDimensions } from '@opentui/react';
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

  const { width, height } = useTerminalDimensions();

  return (
    <box 
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100
      }}
    >
      {/* Camada de "transparência" simulada com caracteres de sombra */}
      <box style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
        <text fg="#1A1A1A">
          {"▒".repeat(width * height)}
        </text>
      </box>

      <box 
        style={{
          flexDirection: "column", 
          backgroundColor: theme.bgPanel, 
          paddingX: 2, 
          paddingY: 1,
          borderStyle: "rounded",
          borderColor: theme.accent,
          width: 70,
          zIndex: 101 // Acima da sombra
        }}
      >
        <box style={{ marginBottom: 1, flexDirection: 'row' }}>
          <text fg={theme.accent}><b>⚡ AÇÕES RÁPIDAS</b></text>
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
                <text fg={isSelected ? "#000000" : theme.fg}>
                  {isSelected ? (
                    <b> › {opt.label}</b>
                  ) : (
                    <>   {opt.label}</>
                  )}
                </text>
              </box>
            );
          })}
        </box>

        {/* Linha separadora manual já que borderTop não é suportado */}
        <box style={{ marginTop: 1, paddingTop: 1, flexDirection: 'column' }}>
          <text fg={theme.fgMuted}>{"─".repeat(64)}</text>
          <text fg={theme.fgDim}> [↑/↓] Navegar  [Enter] Confirmar  [Esc] Sair </text>
        </box>
      </box>
    </box>
  );
};
