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
import { TerminalManager } from './core/TerminalManager'

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
  const { width: hookWidth, height: hookHeight } = useTerminalDimensions()
  const renderer = useRenderer()
  const width = renderer.width || hookWidth;
  const height = renderer.height || hookHeight;

  const [session, setSession] = useState<SessionState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<'home' | 'chat'>('home')
  const [showSidebar, setShowSidebar] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [isInputFocused, setIsInputFocused] = useState(true)
  const [currentPrompt, setCurrentPrompt] = useState('')
  const [selectionMode, setSelectionMode] = useState(false)
  const [leaderActive, setLeaderActive] = useState(false);

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
    
    // Leader key logic (Ctrl+X)
    if (key.ctrl && key.name === 'x') {
      setLeaderActive(true);
      setTimeout(() => setLeaderActive(false), 1000);
      return;
    }

    if (leaderActive && key.name === 'b') {
      setShowSidebar(prev => !prev);
      setLeaderActive(false);
      return;
    }

    if (key.name === 'tab') switchAgent()
    if (key.name === 'i' && !isStreaming && view === 'chat') initProject()
    if (key.name === 'escape') {
      if (isStreaming) {
        stopStreaming()
      } else {
        setIsInputFocused(prev => !prev)
      }
    }
    if (key.ctrl && key.name === 'o') setShowDialog(true)
    if (key.ctrl && key.name === 's') {
      const newMode = !selectionMode;
      setSelectionMode(newMode);
      if (newMode) {
        TerminalManager.getInstance().disableMouse();
      } else {
        TerminalManager.getInstance().enableMouse();
      }
    }
    if (key.ctrl && key.name === 'c') {
      if (!isStreaming) {
        renderer.destroy()
        process.exit(0)
      } else {
        stopStreaming()
      }
    }
  });

  useEffect(() => {
    fetchSession()
    const interval = setInterval(fetchSession, 5000)
    return () => clearInterval(interval)
  }, [fetchSession])

  useEffect(() => {
    if (!isStreaming && messages.length > 0) {
      setIsInputFocused(true)
    }
  }, [isStreaming])

  const handleStart = (query: string) => {
    if (query.trim()) {
      setView('chat')
      sendMessage(query)
      setCurrentPrompt('')
      setIsInputFocused(false)
    }
  }

  const handleSendMessage = (query: string) => {
    sendMessage(query)
    setCurrentPrompt('')
    setIsInputFocused(false)
  }

  const isWideEnough = width > 100;
  const effectiveShowSidebar = !!(session && showSidebar && isWideEnough);

  // Ajuste para ocupar a altura total e posicionar o input na base
  const chatHeight = height; 

  return (
    <box style={{ flexDirection: "column", height: height, width: width, backgroundColor: theme.bg }}>
      {!session ? (
        <box style={{ flexGrow: 1, justifyContent: "center", alignItems: "center" }}>
          <text style={{ color: theme.fgDim }}>Conectando...</text>
        </box>
      ) : session.status === 'needs_setup' ? (
        <SetupWizard onComplete={fetchSession} />
      ) : (
        <box style={{ flexDirection: "row", height: chatHeight, width: width }}>
          {/* Chat Area */}
          <box style={{ flexGrow: 1, flexDirection: "column" }}>
            {view === 'home' ? (
              <Home 
                model={session.model} 
                onStart={handleStart} 
                value={currentPrompt}
                onValueChange={setCurrentPrompt}
              />
            ) : (
              <box style={{ flexGrow: 1, flexDirection: "column", position: 'relative' }}>
                {selectionMode && (
                  <box style={{ 
                    position: "absolute", 
                    top: 0, 
                    right: 2, 
                    paddingX: 1, 
                    backgroundColor: theme.accent,
                    zIndex: 1000 
                  }}>
                    <text style={{ color: theme.bg, fontWeight: 'bold' }}> MODO DE SELEÇÃO (Ctrl+S para sair) </text>
                  </box>
                )}
                
                <box style={{ flexGrow: 1 }}>
                  {messages.length === 0 && (
                    <box style={{ padding: 2, flexDirection: "column", alignItems: "center" }}>
                      <text style={{ color: theme.fgDim }}>Nenhuma regra de projeto detectada (.kore/rules.md)</text>
                      <text style={{ color: theme.accent, fontWeight: 'bold' }}>Pressione [ i ] para inicializar e gerar regras inteligentes automaticamente</text>
                    </box>
                  )}
                  <MessageList 
                    key={effectiveShowSidebar ? 'with-sidebar' : 'no-sidebar'}
                    messages={messages} 
                    userName={session.userName} 
                    isInputFocused={isInputFocused}
                    onResolvePermission={resolvePermission}
                    onOpenDialog={() => setShowDialog(true)}
                  />
                </box>

                {/* AREA DE INPUT */}
                <box style={{ flexDirection: "column", flexShrink: 0 }}>
                  <text fg={theme.fgMuted}>{"─".repeat(width - (effectiveShowSidebar ? 34 : 2))}</text>
                  {pendingPermission ? (
                    <box style={{ paddingX: 2, paddingY: 1 }}>
                      <text style={{ color: theme.fgDim }}>Aguardando permissão... [Y/N/A]</text>
                    </box>
                  ) : (
                    <InputField 
                      onSubmit={handleSendMessage} 
                      isFocused={isInputFocused} 
                      value={currentPrompt}
                      onValueChange={setCurrentPrompt}
                      isLoading={isStreaming}
                    />
                  )}
                </box>
              </box>
            )}
          </box>

          {/* Sidebar Area */}
          {effectiveShowSidebar && (
            <box style={{ width: 32, flexShrink: 0 }}>
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

      {showDialog && (
        <ActionDialog 
          onClose={() => setShowDialog(false)} 
          onCopy={handleCopy}
          onFork={() => setShowDialog(false)}
        />
      )}
    </box>
  )
}
