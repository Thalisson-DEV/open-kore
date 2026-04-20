import React from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';

interface MessageProps {
  role: 'user' | 'assistant';
  content: string;
  status: 'streaming' | 'done' | 'error';
}

export const Message: React.FC<MessageProps> = ({ role, content, status }) => {
  const isAssistant = role === 'assistant';
  
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box marginBottom={0}>
        <Text color={isAssistant ? "#7a9e7a" : "#666666"} bold>
          {isAssistant ? "● OpenKore" : "› Usuário"}
        </Text>
        {isAssistant && status === 'streaming' && !content && (
          <Box marginLeft={1}>
            <Text color="#7a9e7a">
              <Spinner type="dots" /> pensando...
            </Text>
          </Box>
        )}
      </Box>
      
      <Box paddingLeft={2} marginTop={0}>
        <Text color={status === 'error' ? "red" : "#E0E0E0"}>
          {content}
        </Text>
      </Box>
    </Box>
  );
};
