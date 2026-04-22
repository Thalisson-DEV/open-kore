import React, { useState } from 'react';
import { useKeyboard } from '@opentui/react';
import { theme } from '../theme';
import { useTheme } from '../core/ThemeContext';

export interface PermissionRequest {
  id: string;
  tool: string;
  path?: string;
  input: any;
  diff?: string;
}

interface PermissionBoxProps {
  request: PermissionRequest;
  status: 'pending' | 'yes' | 'no' | 'always';
  onResolve?: (action: 'yes' | 'no' | 'always') => void;
}

export const PermissionBox: React.FC<PermissionBoxProps> = ({ request, status, onResolve }) => {
  const isPending = status === 'pending';
  const [focusedIndex, setFocusedIndex] = useState(0); 
  const options: ('yes' | 'no' | 'always')[] = ['yes', 'no', 'always'];

  useKeyboard((key) => {
    if (!isPending || !onResolve) return;

    if (key.name === 'left' || (key.shift && key.name === 'tab')) {
      setFocusedIndex(prev => (prev > 0 ? prev - 1 : options.length - 1));
    } else if (key.name === 'right' || key.name === 'tab') {
      setFocusedIndex(prev => (prev < options.length - 1 ? prev + 1 : 0));
    } else if (key.name === 'return') {
      onResolve(options[focusedIndex]);
    } else if (key.name === 'escape') {
      onResolve('no');
    } else if (key.name === 'y') {
      onResolve('yes');
    } else if (key.name === 'n') {
      onResolve('no');
    } else if (key.name === 'a') {
      onResolve('always');
    }
  });

  const resource = 
    request.path || 
    request.input?.path || 
    request.input?.file_path || 
    request.input?.filePath || 
    request.input?.directory || 
    request.input?.command || 
    request.input?.pattern ||
    request.input?.glob ||
    'recurso desconhecido';

  const renderDiffLines = (diff?: string) => {
    if (!diff || diff.trim().length <= 1) return null;
    
    const lines = diff.split('\n');
    return (
      <box style={{ flexDirection: 'column', marginY: 1, paddingLeft: 1, borderLeft: 2, borderColor: theme.accent }}>
        {lines.map((line, i) => {
          let fg = theme.fgDim;
          if (line.startsWith('+')) { fg = theme.success; }
          else if (line.startsWith('-')) { fg = theme.error; }
          else if (line.startsWith('@')) { fg = theme.info; }

          return (
            <text key={i} fg={fg}>  {line}</text>
          );
        })}
      </box>
    );
  };

  const getOptionLabel = (opt: 'yes' | 'no' | 'always', index: number) => {
    const isFocused = focusedIndex === index && isPending;
    const isSelected = status === opt;
    const labels = { yes: 'PERMITIR', no: 'RECUSAR', always: 'SEMPRE' };
    const key = opt === 'yes' ? 'Y' : opt === 'no' ? 'N' : 'A';

    const textColor = isFocused ? theme.accent : (isSelected ? theme.accent : theme.fgDim);
    const finalTextColor = (!isPending && !isSelected) ? "#222222" : textColor;

    return (
      <box key={opt} style={{ marginRight: 3 }}>
        <text fg={finalTextColor} bold={isFocused || isSelected}>
          {isFocused ? '› ' : '  '}
          {`[${key}] ${labels[opt]}`}
        </text>
      </box>
    );
  };

  return (
    <box style={{ flexDirection: "column", marginY: 1, paddingLeft: 2, width: "100%" }}>
      <box style={{ flexDirection: 'row', marginBottom: 0 }}>
        <text fg={isPending ? theme.accent : "#333333"} bold>🛡️ PERMISSÃO REQUERIDA: </text>
        <text fg={isPending ? theme.fg : "#333333"} bold>{request.tool.toUpperCase()}</text>
      </box>

      <box style={{ marginBottom: 0, flexDirection: 'row' }}>
        <text fg={theme.fgMuted}>Alvo: </text>
        <text fg={isPending ? theme.fgDim : "#333333"}>{resource}</text>
      </box>

      {isPending && (
        <box style={{ flexDirection: 'column' }}>
          {renderDiffLines(request.diff) || (
            <box style={{ marginY: 1 }}>
               <text fg={theme.fgMuted} italic> (Sem pré-visualização de alterações) </text>
            </box>
          )}
        </box>
      )}

      <box style={{ flexDirection: "row", marginTop: 1, alignItems: 'center' }}>
        {options.map((opt, i) => getOptionLabel(opt, i))}
        {!isPending && (
           <box style={{ marginLeft: 1 }}>
             <text fg="#222222" italic> [Ação: {status.toUpperCase()}]</text>
           </box>
        )}
      </box>
    </box>
  );
};
