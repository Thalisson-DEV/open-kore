import React from 'react'
import { Box, Text } from 'ink'

interface StatusBarProps {
  agent: string
  model: string
  status: 'idle' | 'busy' | 'error'
}

export const StatusBar: React.FC<StatusBarProps> = ({ agent, model, status }) => {
  const statusColor = status === 'busy' ? 'yellow' : status === 'error' ? 'red' : 'green'

  return (
    <Box 
      paddingX={1} 
      borderStyle="single" 
      borderColor="#4ade80" 
      justifyContent="space-between"
      width="100%"
    >
      <Box>
        <Text bold color="#4ade80">openkore</Text>
        <Text color="gray"> | </Text>
        <Text color="#4ade80">{agent}</Text>
      </Box>
      <Box>
        <Text color="gray">{model} </Text>
        <Text color={statusColor}>●</Text>
      </Box>
    </Box>
  )
}
