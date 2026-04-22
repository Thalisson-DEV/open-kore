import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useTerminalDimensions, useKeyboard, useRenderer } from '@opentui/react'
import { theme } from './theme'
import { Home } from './components/Home'
import { MessageList } from './components/MessageList'
import { Sidebar } from './components/Sidebar'
import { InputField } from './components/InputField'
import { SetupWizard } from './components/SetupWizard'
import { ActionDialog } from './components/ActionDialog'
import { useSSE } from './hooks/use-sse'
import { KeyboardManager } from './core/KeyboardManager'

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

export const App = () => {
  const { width, height } = useTerminalDimensions()
  const renderer = useRenderer()
  const [session, setSession] = useState<SessionState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<'home' | 'chat'>('home')
  const [showSidebar, setShowSidebar] = useState(true)
  const [showDialog, setShowDialog] = useState(false)

  const keyboardManager = useMemo(() => KeyboardManager.getInstance(), [])

  const { 
    messages, 
    isStreaming, 
    touchedFiles,
    sessionUsage,
    sendMessage, 
    stopStreaming,
    resolvePermission 
  } = useSSE()

  const pendingMsg = messages.find(m => m.role === 'permission' && m.status === 'pending');
  const pendingPermission = pendingMsg?.permission || null;

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

  const handleCopy = () => {
    // Funcionalidade de cópia mockada por enquanto
    // TODO: Implementar quando houver suporte a clipboard no ambiente
    setShowDialog(false);
  };

  useKeyboard((key) => {
    keyboardManager.handleKeyPress(key);

    if (showDialog) return;

    if (pendingPermission && pendingMsg) {
      if (key.name === 'y') resolvePermission(pendingMsg.id, 'yes')
      if (key.name === 'n') resolvePermission(pendingMsg.id, 'no')
      if (key.name === 'a') resolvePermission(pendingMsg.id, 'always')
      return; 
    }
    
    if (key.name === 'tab') switchAgent()
    if (key.name === 'i' && !isStreaming && view === 'chat') initProject()
    if (key.name === 'escape' && isStreaming) stopStreaming()
    if (key.ctrl && key.name === 'o') setShowDialog(true)
    if (key.ctrl && key.name === 'c') {
      if (!isStreaming) {
        renderer.destroy()
        process.exit(0)
      } else {
        stopStreaming()
      }
    }
  });

  // Leader key logic
  const [leaderActive, setLeaderActive] = useState(false);
  useKeyboard((key) => {
      if (key.ctrl && key.name === 'x') {
          setLeaderActive(true);
          setTimeout(() => setLeaderActive(false), 1000);
          return;
      }
      if (leaderActive && key.name === 'b') {
          setShowSidebar(prev => !prev);
          setLeaderActive(false);
      }
  });

  useEffect(() => {
    fetchSession()
    const interval = setInterval(fetchSession, 5000)
    return () => clearInterval(interval)
  }, [fetchSession])

  const handleStart = (query: string) => {
    if (query.trim()) {
      setView('chat')
      sendMessage(query)
    }
  }

  if (!session) {
    return (
      <box style={{ height: '100%', justifyContent: "center", alignItems: "center", backgroundColor: theme.bg }}>
        <text fg={theme.fgDim}>Conectando...</text>
      </box>
    )
  }

  if (session.status === 'needs_setup') {
    return (
      <box style={{ height: '100%', backgroundColor: theme.bg }}>
        <SetupWizard onComplete={fetchSession} />
      </box>
    )
  }

  const isWideEnough = width > 100;
  const effectiveShowSidebar = showSidebar && isWideEnough;

  return (
    <box style={{ flexDirection: "column", height: '100%', width: '100%', backgroundColor: theme.bg }}>
      {view === 'home' ? (
        <Home model={session.model} onStart={handleStart} />
      ) : (
        <box style={{ flexGrow: 1, flexDirection: "row", overflow: "hidden" }}>
          {/* Chat Area */}
          <box style={{ flexGrow: 1, flexShrink: 1, flexBasis: 0, flexDirection: "column", overflow: "hidden" }}>
            {messages.length === 0 && (
              <box style={{ padding: 2, flexDirection: "column", alignItems: "center" }}>
                <text fg={theme.fgDim}>Nenhuma regra de projeto detectada (.kore/rules.md)</text>
                <text fg={theme.accent} bold>Pressione [ i ] para inicializar e gerar regras inteligentes automaticamente</text>
              </box>
            )}
            <MessageList 
              messages={messages} 
              userName={session.userName} 
              onResolvePermission={resolvePermission}
            />
          </box>

          {/* Sidebar Area */}
          {effectiveShowSidebar && (
            <box style={{ width: 32, flexGrow: 0, flexShrink: 0 }}>
               <Sidebar 
                 agents={session.agents} 
                 activeAgentId={session.agent} 
                 isStreaming={isStreaming} 
                 model={session.model}
                 files={touchedFiles}
                 usage={sessionUsage}
               />
            </box>
          )}
        </box>
      )}

      {/* AREA DE INPUT */}
      {view === 'chat' && (
        <box style={{ flexDirection: "column" }}>
          <box style={{ paddingX: 1 }}>
            <text fg={theme.fgMuted}>{"─".repeat(width - 2)}</text>
          </box>
          {pendingPermission ? (
            <box style={{ paddingX: 2, paddingY: 1 }}>
              <text fg={theme.fgDim}>Aguardando permissão... [Y/N/A]</text>
            </box>
          ) : isStreaming ? (
            <box style={{ paddingX: 2, paddingY: 1, flexDirection: "row" }}>
              <text fg={theme.fgDim}>Aguardando resposta da IA...</text>
              <box style={{ marginLeft: 1 }}>
                <text fg={theme.fgMuted}>[Esc] Interromper</text>
              </box>
            </box>
          ) : (
            <InputField onSubmit={sendMessage} />
          )}
        </box>
      )}

      {showDialog && (
        <box 
          style={{
            position: "absolute", 
            width: '100%', 
            height: '100%', 
            justifyContent: "center", 
            alignItems: "center",
            zIndex: 100
          }}
        >
          <ActionDialog 
            onClose={() => setShowDialog(false)} 
            onCopy={handleCopy}
            onFork={() => setShowDialog(false)}
          />
        </box>
      )}
    </box>
  )
}
