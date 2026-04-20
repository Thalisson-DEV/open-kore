import React, { useState, useEffect } from 'react'
import { render, Box, Text } from 'ink'
import { StatusBar } from './components/StatusBar'
import { InputField } from './components/InputField'
import { SetupWizard } from './components/SetupWizard'

interface SessionState {
  agent: string
  model: string
  status: 'idle' | 'busy' | 'error' | 'needs_setup'
}

const App = () => {
  const [session, setSession] = useState<SessionState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [terminalRows, setTerminalRows] = useState(process.stdout.rows || 24)

  const fetchSession = async () => {
    try {
      const res = await fetch('http://localhost:8080/session')
      if (res.ok) {
        const data = await res.json()
        setSession(data)
      } else {
        setError('Falha ao obter sessão do servidor')
      }
    } catch (e) {
      setError('Servidor offline')
    }
  }

  useEffect(() => {
    fetchSession()
    const interval = setInterval(fetchSession, 2000)

    const handleResize = () => {
      setTerminalRows(process.stdout.rows)
    }

    process.stdout.on('resize', handleResize)

    return () => {
      clearInterval(interval)
      process.stdout.off('resize', handleResize)
    }
  }, [])

  if (error && !session) {
    return (
      <Box 
        flexDirection="column" 
        height={terminalRows} 
        backgroundColor="#0A0A0A" 
        padding={1}
      >
        <Box borderStyle="single" borderColor="#F85149" paddingX={1}>
          <Text color="#F85149">Erro: {error}</Text>
        </Box>
      </Box>
    )
  }

  if (!session) {
    return (
      <Box 
        flexDirection="column" 
        height={terminalRows} 
        backgroundColor="#0A0A0A" 
        justifyContent="center" 
        alignItems="center"
      >
        <Text color="#666666">Conectando ao OpenKore...</Text>
      </Box>
    )
  }

  if (session.status === 'needs_setup') {
    return (
      <Box 
        flexDirection="column" 
        height={terminalRows} 
        backgroundColor="#0A0A0A"
      >
        <SetupWizard onComplete={fetchSession} />
      </Box>
    )
  }

  return (
    <Box 
      flexDirection="column" 
      height={terminalRows} 
      backgroundColor="#0A0A0A"
    >
      {/* Header (Sessão + Modelo) - Simplificado por agora */}
      <Box paddingX={1} paddingTop={1}>
        <Text color="#666666">● </Text>
        <Text color="#E0E0E0" bold>OpenKore</Text>
        <Text color="#3A3A3A">  SIPEL-CES  </Text>
        <Text color="#666666">{session.model}</Text>
      </Box>

      {/* Message List Area */}
      <Box flexGrow={1} flexDirection="column" paddingX={1} marginTop={1}>
        <Text color="#666666">Aguardando comandos...</Text>
      </Box>

      {/* Input Area */}
      <InputField onSubmit={(val) => console.log('Submit:', val)} />

      {/* Global Status Bar (Footer) */}
      <StatusBar 
        agent={session.agent} 
        model={session.model} 
        status={session.status} 
      />
    </Box>
  )
}

render(<App />)
