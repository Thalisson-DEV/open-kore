import React from 'react';
import { Box } from 'ink';
import { Message } from './Message';
import { SSEMessage } from '../hooks/use-sse';

interface MessageListProps {
  messages: SSEMessage[];
}

export const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  return (
    <Box flexDirection="column" flexGrow={1} paddingX={1} marginTop={1} justifyContent="flex-end">
      {messages.map((msg) => (
        <Message 
          key={msg.id} 
          role={msg.role} 
          content={msg.content} 
          status={msg.status} 
        />
      ))}
    </Box>
  );
};
