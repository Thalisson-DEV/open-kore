import os from 'os'
import React, { useState, useEffect, useCallback } from 'react'
import { render, Box, Text, useInput } from 'ink'
import { StatusBar } from './components/StatusBar'
import { InputField } from './components/InputField'
import { SetupWizard } from './components/SetupWizard'
import { Home } from './components/Home'
import { MessageList } from './components/MessageList'
import { useSSE } from './hooks/use-sse'

interface Agent {
  id: string;
  name: string;
  description: string;
}

interface SessionState {
  agent: string
  agents: Agent[]
  model: string
  userName: string
  status: 'idle' | 'busy' | 'error' | 'needs_setup'
}

const formatPath = (p: string) => {
  const home = os.homedir()
  if (p.startsWith(home)) {
    return p.replace(home, '~')
  }
  return p
}

const App = () => {
  const [session, setSession] = useState<SessionState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [terminalRows, setTerminalRows] = useState(process.stdout.rows || 24)
  const [view, setView] = useState<'home' | 'chat'>('home')

  const { 
    messages, 
    isStreaming, 
    isProcessing,
    sendMessage, 
    cancelMessage,
    pendingPermission, 
    resolvePermission 
  } = useSSE()

  const fetchSession = useCallback(async () => {
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
  }, [])

  const switchAgent = async () => {
    if (!session || isStreaming || isProcessing) return
    const currentIndex = session.agents.findIndex(a => a.id === session.agent)
    const nextIndex = (currentIndex + 1) % session.agents.length
    const nextAgent = session.agents[nextIndex]

    try {
      await fetch('http://localhost:8080/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: nextAgent.id })
      })
      await fetchSession()
    } catch (e) {}
  }

  useInput((input, key) => {
    if (key.tab) {
      switchAgent()
    }

    // Escape interrompe o pensamento/streaming
    if (key.escape) {
      if (isStreaming || isProcessing) {
        cancelMessage();
      }
    }

    // Ctrl+C encerra o app (apenas se não estiver processando, para evitar saídas acidentais)
    if (key.ctrl && input === 'c') {
      if (!isStreaming && !isProcessing) {
        process.exit(0);
      } else {
        cancelMessage();
      }
    }
  });

  useEffect(() => {
    fetchSession()
    const interval = setInterval(fetchSession, 5000)

    const handleResize = () => {
      setTerminalRows(process.stdout.rows)
    }

    process.stdout.on('resize', handleResize)

    return () => {
      clearInterval(interval)
      process.stdout.off('resize', handleResize)
    }
  }, [fetchSession])

  const handleStart = (query: string) => {
    if (query.trim()) {
      setView('chat')
      sendMessage(query)
    }
  }

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

  if (view === 'home') {
    return (
      <Box flexDirection="column" height={terminalRows} backgroundColor="#0A0A0A">
        <Home model={session.model} onStart={handleStart} />
        <StatusBar 
          agent={session.agent} 
          model={session.model} 
          status={session.status} 
        />
      </Box>
    )
  }

  return (
    <Box 
      flexDirection="column" 
      height={terminalRows} 
      backgroundColor="#0A0A0A"
    >
      {/* Header */}
      <Box paddingX={1} paddingTop={1} flexDirection="row" justifyContent="space-between">
        <Box>
          <Text color="#666666">● </Text>
          <Text color="#E0E0E0" bold>OpenKore</Text>
          <Text color="#3A3A3A">  {formatPath(process.cwd())}  </Text>
        </Box>
        <Box flexDirection="row">
          <Text color="#7a9e7a">{session.agent}</Text>
          <Text color="#3A3A3A">  |  </Text>
          <Text color="#666666">{session.model}</Text>
        </Box>
      </Box>

      {/* Area de mensagens */}
      <Box flexGrow={1} flexDirection="column">
        <MessageList 
          messages={messages} 
          userName={session.userName}
          onResolvePermission={resolvePermission} 
        />
      </Box>

      {/* Separador */}
      <Box paddingX={1}>
        <Text color="#3A3A3A">{"─".repeat(process.stdout.columns - 2)}</Text>
      </Box>

      {/* Input - Bloqueado se houver permissão pendente ou se estiver processando */}
      {pendingPermission ? (
        <Box paddingX={2} paddingY={1}>
          <Text color="#666666">Aguardando decisão de permissão... [Y/N/A]</Text>
        </Box>
      ) : isStreaming ? (
        <Box paddingX={2} paddingY={1} flexDirection="row">
          <Text color="#444444">Aguardando resposta da IA...</Text>
          <Box marginLeft={1}>
            <Text color="#3A3A3A">[Esc] Interromper</Text>
          </Box>
        </Box>
      ) : (
        <InputField onSubmit={sendMessage} />
      )}

      {/* Footer */}
      <StatusBar 
        agent={session.agent} 
        model={session.model} 
        status={isStreaming ? 'busy' : session.status} 
      />
    </Box>
  )
}

render(<App />)
