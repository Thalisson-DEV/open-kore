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
    return () => clearInterval(interval)
  }, [])

  if (error && !session) {
    return (
      <Box paddingX={1} borderStyle="single" borderColor="red">
        <Text color="red">Erro: {error}</Text>
      </Box>
    )
  }

  if (!session) {
    return (
      <Box paddingX={1}>
        <Text>Conectando ao OpenKore...</Text>
      </Box>
    )
  }

  if (session.status === 'needs_setup') {
    return <SetupWizard onComplete={fetchSession} />
  }

  return (
    <Box flexDirection="column" width="100%">
      <StatusBar 
        agent={session.agent} 
        model={session.model} 
        status={session.status} 
      />
      <Box flexGrow={1} />
      <InputField onSubmit={(val) => console.log('Submit:', val)} />
    </Box>
  )
}

render(<App />)
