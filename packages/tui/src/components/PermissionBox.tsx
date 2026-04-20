import React from 'react';
import { Box, Text, useInput } from 'ink';

export interface PermissionRequest {
  id: string;
  tool: string;
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

  useInput((input, key) => {
    if (!isPending || !onResolve) return;
    if (input.toLowerCase() === 'y') onResolve('yes');
    if (input.toLowerCase() === 'n') onResolve('no');
    if (input.toLowerCase() === 'a') onResolve('always');
  });

  if (!isPending) {
    const isApproved = status === 'yes' || status === 'always';
    return (
      <Box paddingX={1} marginY={0}>
        <Text color="#444444">
          {request.tool} {isApproved ? "permitido" : "recusado"}
          <Text color="#333333"> — {request.input.path || request.input.file_path || request.input.dir_path || JSON.stringify(request.input)}</Text>
        </Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" marginY={1} width="100%">
      <Box borderStyle="single" borderColor="#222222" paddingX={2} paddingY={1} flexDirection="column" width="100%">
        <Box marginBottom={0}>
          <Text color="#666666">Permissão requerida: </Text>
          <Text color="#E0E0E0" bold>{request.tool}</Text>
        </Box>

        <Box marginBottom={1}>
          <Text color="#444444">Recurso: </Text>
          <Text color="#888888">{request.input.path || request.input.file_path || request.input.dir_path || JSON.stringify(request.input)}</Text>
        </Box>

        {request.diff && (
          <Box flexDirection="column" marginBottom={1} paddingX={1} borderStyle="single" borderColor="#1a1a1a">
            <Text color="#444444" italic>Alterações propostas:</Text>
            <Text color="#A0A0A0">{request.diff}</Text>
          </Box>
        )}

        <Box flexDirection="row">
          <Box marginRight={2}>
            <Text color="#7a9e7a">y </Text><Text color="#666666">permitir</Text>
          </Box>
          <Box marginRight={2}>
            <Text color="#F85149">n </Text><Text color="#666666">recusar</Text>
          </Box>
          <Box>
            <Text color="#7a9e7a">a </Text><Text color="#666666">sempre</Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
