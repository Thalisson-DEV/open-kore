import os from 'os'
import path from 'path'
import React, { useState, useEffect, useCallback } from 'react'
import { render, Box, Text, useInput } from 'ink'
import { StatusBar } from './components/StatusBar'
import { InputField } from './components/InputField'
import { SetupWizard } from './components/SetupWizard'
import { Home } from './components/Home'
import { MessageList } from './components/MessageList'
import { Sidebar } from './components/Sidebar'
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
  tier1Model: string
  tier2Model: string
  userName: string
  status: 'idle' | 'busy' | 'error' | 'needs_setup'
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

const App = () => {
  const [session, setSession] = useState<SessionState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [terminalRows, setTerminalRows] = useState(process.stdout.rows || 24)
  const [terminalCols, setTerminalCols] = useState(process.stdout.columns || 80)
  const [view, setView] = useState<'home' | 'chat'>('home')
  const [showSidebar, setShowSidebar] = useState(true)

  const { 
    messages, 
    isStreaming, 
    touchedFiles,
    sessionUsage,
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
        setError('Falha ao obter sessão')
      }
    } catch (e) {
      setError('Servidor offline')
    }
  }, [])

  const switchAgent = async () => {
    if (!session || isStreaming) return
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

  const initProject = async () => {
    if (isStreaming) return;
    try {
      await fetch('http://localhost:8080/init', { method: 'POST' });
      await fetchSession();
    } catch (e) {}
  }

  useInput((input, key) => {
    if (key.tab) switchAgent()
    if (input.toLowerCase() === 'i' && !isStreaming && view === 'chat') initProject()
    if (key.escape && isStreaming) cancelMessage()
    if (key.ctrl && input === 'c') {
      if (!isStreaming) process.exit(0)
      else cancelMessage()
    }
  });

  useEffect(() => {
    const onData = (data: Buffer) => {
      const str = data.toString();
      if (str === '\x18b') { // Ctrl+X seguido de 'b'
        setShowSidebar(prev => !prev);
      }
    };
    process.stdin.on('data', onData);
    return () => { process.stdin.off('data', onData); };
  }, []);

  useEffect(() => {
    fetchSession()
    const interval = setInterval(fetchSession, 5000)
    const handleResize = () => {
      setTerminalRows(process.stdout.rows)
      setTerminalCols(process.stdout.columns)
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

  if (!session) return <Box height={terminalRows} justifyContent="center" alignItems="center"><Text color="#666666">Conectando...</Text></Box>
  if (session.status === 'needs_setup') return <Box height={terminalRows}><SetupWizard onComplete={fetchSession} /></Box>

  if (view === 'home') {
    return (
      <Box flexDirection="column" height={terminalRows} backgroundColor="#0A0A0A">
        <Home model={session.model} onStart={handleStart} />
        <StatusBar agent={session.agent} model={session.model} status={session.status} />
      </Box>
    )
  }

  const isWideEnough = terminalCols > 100;
  const effectiveShowSidebar = showSidebar && isWideEnough;

  return (
    <Box flexDirection="column" height={terminalRows} backgroundColor="#0A0A0A">
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

      {/* Main Area */}
      <Box flexGrow={1} flexDirection="row">
        <Box flexGrow={1} flexDirection="column">
          <Box flexGrow={1} flexDirection="column">
            {messages.length === 0 && (
              <Box padding={2} flexDirection="column" alignItems="center">
                <Text color="#666666">Nenhuma regra de projeto detectada (.kore/rules.md)</Text>
                <Text color="#7a9e7a" bold>Pressione [ i ] para inicializar e gerar regras inteligentes automaticamente</Text>
              </Box>
            )}
            <MessageList messages={messages} userName={session.userName} onResolvePermission={resolvePermission} />
          </Box>
          <Box paddingX={1}><Text color="#3A3A3A">{"─".repeat(terminalCols - (effectiveShowSidebar ? 34 : 2))}</Text></Box>
          {pendingPermission ? (
            <Box paddingX={2} paddingY={1}><Text color="#666666">Aguardando permissão... [Y/N/A]</Text></Box>
          ) : isStreaming ? (
            <Box paddingX={2} paddingY={1} flexDirection="row">
              <Text color="#444444">Aguardando resposta da IA...</Text>
              <Box marginLeft={1}><Text color="#3A3A3A">[Esc] Interromper</Text></Box>
            </Box>
          ) : (
            <InputField onSubmit={sendMessage} />
          )}
        </Box>

        {effectiveShowSidebar && (
          <Sidebar 
            agents={session.agents} 
            activeAgentId={session.agent} 
            isStreaming={isStreaming} 
            model={session.model}
            files={touchedFiles}
            usage={sessionUsage}
          />
        )}
      </Box>

      <StatusBar agent={session.agent} model={session.model} status={isStreaming ? 'busy' : session.status} />
    </Box>
  )
}

render(<App />)
