import React, { useState, useEffect } from 'react'
import { Box, Text } from 'ink'

interface StatusBarProps {
  agent: string
  model: string
  status: 'idle' | 'busy' | 'error' | 'needs_setup'
  version?: string
}

export const StatusBar: React.FC<StatusBarProps> = ({ agent, model, status, version = 'v0.1.0-alpha' }) => {
  const [time, setTime] = useState(() => {
    const now = new Date()
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  })

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date()
      setTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`)
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = () => {
    if (status === 'error' || status === 'needs_setup') return '🔴'
    if (status === 'busy') return '🟡'
    return '🟢'
  }

  return (
    <Box 
      width="100%"
      backgroundColor="#111111"
      paddingX={1}
      flexDirection="row"
    >
      <Text color="#E0E0E0">
        {getStatusIcon()} OpenKore {version}  
        <Text color="#3A3A3A">  |  </Text>
        <Text color="#E0E0E0">SIPEL-CES</Text>
        <Text color="#3A3A3A">  |  </Text>
        <Text color="#E0E0E0">{agent}</Text>
        <Text color="#3A3A3A">  |  </Text>
        <Text color="#E0E0E0">{model}</Text>
        <Text color="#3A3A3A">  |  </Text>
        <Text color="#666666">{time}</Text>
        <Text color="#3A3A3A">  (Ctrl+X) Menu</Text>
      </Text>
    </Box>
  )
}
