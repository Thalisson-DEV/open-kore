import os from 'os'
import path from 'path'
import React, { useState, useEffect } from 'react'
import { Box, Text } from 'ink'

interface StatusBarProps {
  agent: string
  model: string
  version?: string
  status?: 'idle' | 'busy' | 'error' | 'needs_setup'
}

const formatPath = (p: string) => {
  const home = os.homedir()
  let projectPath = p;
  if (p.endsWith('packages/tui')) {
    projectPath = path.join(p, '..', '..');
  } else if (p.endsWith('packages/server')) {
    projectPath = path.join(p, '..', '..');
  }

  if (projectPath.startsWith(home)) {
    return projectPath.replace(home, '~')
  }
  return projectPath
}

export const StatusBar: React.FC<StatusBarProps> = ({ agent, model, version = 'v0.1.0-alpha', status = 'idle' }) => {
  const [cwd, setCwd] = useState(() => formatPath(process.cwd()))
  const [time, setTime] = useState(() => {
    const now = new Date()
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  })

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date()
      setTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`)
    }, 60000)
    
    const cwdInterval = setInterval(() => {
      setCwd(formatPath(process.cwd()))
    }, 5000)

    return () => {
      clearInterval(interval)
      clearInterval(cwdInterval)
    }
  }, [])

  const statusColors = {
    idle: '#4CAF50',
    busy: '#FFC107',
    error: '#F44336',
    needs_setup: '#2196F3'
  }

  return (
    <Box 
      width="100%"
      backgroundColor="#111111"
      paddingX={1}
      flexDirection="row"
    >
      <Box flexGrow={1} flexDirection="row">
        <Text color="#E0E0E0">
          <Text color="#E0E0E0">{version}</Text>
          <Text color="#3A3A3A">  |  </Text>
          <Text color="#E0E0E0">{cwd}</Text>
          <Text color="#3A3A3A">  |  </Text>
          <Text color="#E0E0E0">{agent}</Text>
          <Text color="#3A3A3A">  |  </Text>
          <Text color="#E0E0E0">{model}</Text>
          <Text color="#3A3A3A">  |  </Text>
          <Text color={statusColors[status]}>● </Text>
          <Text color="#666666">{time}</Text>
        </Text>
      </Box>
      <Box>
        <Text color="#3A3A3A">(Ctrl+X) Menu</Text>
      </Box>
    </Box>
  )
}
