import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

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

  useInput((input, key) => {
    if (!isPending || !onResolve) return;

    if (key.leftArrow || (key.shift && key.tab)) {
      setFocusedIndex(prev => (prev > 0 ? prev - 1 : options.length - 1));
    } else if (key.rightArrow || key.tab) {
      setFocusedIndex(prev => (prev < options.length - 1 ? prev + 1 : 0));
    } else if (key.return) {
      onResolve(options[focusedIndex]);
    } else if (key.escape) {
      onResolve('no');
    } else if (input.toLowerCase() === 'y') {
      onResolve('yes');
    } else if (input.toLowerCase() === 'n') {
      onResolve('no');
    } else if (input.toLowerCase() === 'a') {
      onResolve('always');
    }
  });

  const resource = request.path || request.input?.path || request.input?.filePath || request.input?.command || 'recurso desconhecido';

  if (!isPending) {
    return null; // Desaparece após resolvido para evitar redundância
  }

  const renderDiff = (diff?: string) => {
    if (!diff || diff.trim().length <= 1) return null;
    return (
      <Box flexDirection="column" marginY={1} paddingX={1}>
        {diff.split('\n').map((line, i) => {
          let color = "#666666";
          if (line.startsWith('+')) color = "#7a9e7a";
          if (line.startsWith('-')) color = "#F85149";
          return <Text key={i} color={color}>{line}</Text>;
        })}
      </Box>
    );
  };

  const getOptionLabel = (opt: 'yes' | 'no' | 'always', index: number) => {
    const isFocused = focusedIndex === index;
    const labels = { yes: 'permitir', no: 'recusar', always: 'sempre' };
    const key = opt === 'yes' ? 'y' : opt === 'no' ? 'n' : 'a';

    return (
      <Box marginRight={3} key={opt}>
        <Text backgroundColor={isFocused ? "#7a9e7a" : "transparent"} color={isFocused ? "#000000" : "#7a9e7a"}>
          {` ${key} `}
        </Text>
        <Text color={isFocused ? "#E0E0E0" : "#666666"}> {labels[opt]}</Text>
      </Box>
    );
  };

  return (
    <Box flexDirection="column" marginY={1} paddingLeft={3} width="100%">
      <Box flexDirection="column" width="100%" backgroundColor="#111111" paddingX={2} paddingY={1}>
        <Box>
          <Text color="#E0E0E0" bold>PERMISSÃO: </Text>
          <Text color="#7a9e7a" bold>{request.tool}</Text>
          <Text color="#222222"> ──────────────────────────────────</Text>
        </Box>

        <Box marginTop={0}>
          <Text color="#666666">Recurso: </Text>
          <Text color="#A0A0A0">{resource}</Text>
        </Box>

        {renderDiff(request.diff) || (
          <Box marginY={1} paddingLeft={1}>
             <Text color="#444444" italic>(Sem preview disponível)</Text>
          </Box>
        )}

        <Box flexDirection="row" marginTop={1}>
          {options.map((opt, i) => getOptionLabel(opt, i))}
        </Box>
      </Box>
    </Box>
  );
};
