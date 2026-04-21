import React from 'react';
import { Box } from 'ink';
import { Message } from './Message';
import { SSEMessage } from '../hooks/use-sse';
import { PermissionBox } from './PermissionBox';

interface MessageListProps {
  messages: SSEMessage[];
  userName?: string;
  onResolvePermission?: (id: string, action: 'yes' | 'no' | 'always') => void;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, userName, onResolvePermission }) => {
  return (
    <Box flexDirection="column" flexGrow={1} paddingX={1} marginTop={1} justifyContent="flex-end">
      {messages.map((msg) => {
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
    </Box>
  );
};
