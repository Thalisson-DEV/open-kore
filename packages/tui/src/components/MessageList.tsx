import React from 'react';
import { Box, Text } from 'ink';
import { Message } from './Message';
import { SSEMessage } from '../hooks/use-sse';
import { PermissionBox } from './PermissionBox';

interface MessageListProps {
  messages: SSEMessage[];
  userName?: string;
  onResolvePermission?: (id: string, action: 'yes' | 'no' | 'always') => void;
  scrollOffset?: number;
}

export const MessageList: React.FC<MessageListProps> = ({ 
  messages, 
  userName, 
  onResolvePermission,
  scrollOffset = 0 
}) => {
  // Ajusta o offset para não exceder o número de mensagens
  const effectiveOffset = Math.min(scrollOffset, Math.max(0, messages.length - 5));
  const displayMessages = messages.slice(0, messages.length - effectiveOffset).slice(-15);

  const hasMoreAbove = messages.length > displayMessages.length + effectiveOffset;
  const hasMoreBelow = effectiveOffset > 0;

  return (
    <Box flexDirection="row" flexGrow={1} paddingX={1} marginTop={1} overflow="hidden">
      <Box flexDirection="column" flexGrow={1} justifyContent="flex-end">
        {hasMoreAbove && (
          <Box justifyContent="center" marginBottom={1}>
            <Text color="#3A3A3A">▲ Mais mensagens acima (PageUp)</Text>
          </Box>
        )}
        
        {displayMessages.map((msg) => {
          if (msg.role === 'permission' && msg.permission) {
            return (
              <PermissionBox 
                key={msg.id} 
                request={msg.permission} 
                status={msg.status as any} 
                onResolve={(action) => onResolvePermission?.(msg.id, action)} 
              />
            );
          }
          
          return (
            <Message 
              key={msg.id} 
              role={msg.role as any} 
              content={msg.content} 
              status={msg.status as any} 
              userName={userName}
              toolName={msg.toolName}
              toolInput={msg.toolInput}
              toolOutput={msg.toolOutput}
            />
          );
        })}

        {hasMoreBelow && (
          <Box justifyContent="center" marginTop={1}>
            <Text color="#3A3A3A">▼ Mais mensagens abaixo (PageDown)</Text>
          </Box>
        )}
      </Box>

      {/* Barra de Rolagem Visual */}
      <Box flexDirection="column" width={1} marginLeft={1} justifyContent="center">
        <Text color={hasMoreAbove ? "#7a9e7a" : "#222222"}>┃</Text>
        <Text color="#7a9e7a" bold>┃</Text>
        <Text color={hasMoreBelow ? "#7a9e7a" : "#222222"}>┃</Text>
      </Box>
    </Box>
  );
};
