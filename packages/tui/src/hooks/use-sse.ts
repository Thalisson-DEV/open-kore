import { useState, useCallback, useRef } from 'react';
import { PermissionRequest } from '../components/PermissionBox';

export interface SSEMessage {
  id: string;
  role: 'user' | 'assistant' | 'permission' | 'tool';
  content: string;
  status: 'streaming' | 'done' | 'error' | 'pending' | 'yes' | 'no' | 'always' | 'canceled' | 'standby';
  toolName?: string;
  toolInput?: any;
  toolOutput?: any;
  permission?: PermissionRequest;
}

export function useSSE() {
  const [messages, setMessages] = useState<SSEMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [pendingPermissionId, setPendingPermissionId] = useState<string | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const contentRef = useRef('');
  const isBusyRef = useRef(false);
  const lastSendRef = useRef<number>(0);

  const sendMessage = useCallback(async (content: string) => {
    const now = Date.now();
    // Proteção contra múltiplos envios rápidos (< 500ms)
    if (!content.trim() || isBusyRef.current || (now - lastSendRef.current < 500)) return;

    lastSendRef.current = now;
    isBusyRef.current = true;
    setIsStreaming(true);
    contentRef.current = '';

    const asstMsgId = `asst-${now}`;
    
    setMessages(prev => [
      ...prev,
      { id: `user-${now}`, role: 'user', content, status: 'done' },
      { id: asstMsgId, role: 'assistant', content: '', status: 'streaming' }
    ]);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const response = await fetch('http://localhost:8080/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-master-password': 'alpha-no-password' },
        body: JSON.stringify({ content }),
        signal: abortController.signal
      });

      if (!response.body) throw new Error('Falha ao conectar com o servidor');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let streamBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (value) {
          streamBuffer += decoder.decode(value, { stream: true });
          const events = streamBuffer.split('\n\n');
          streamBuffer = events.pop() || ''; 
          
          for (const eventStr of events) {
            const lines = eventStr.split('\n');
            let dataStr = '';
            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith('data:')) {
                dataStr = trimmed.substring(trimmed.indexOf(':') + 1).trim();
              }
            }
            
            if (!dataStr) continue;

            try {
              const data = JSON.parse(dataStr);
              if (data.type === 'text' && typeof data.delta === 'string') {
                contentRef.current += data.delta;
                const snapshot = contentRef.current;
                setMessages(prev => prev.map(msg =>
                  msg.id === asstMsgId ? { ...msg, content: snapshot } : msg
                ));
              } else if (data.type === 'tool_start') {
                setMessages(prev => [...prev, {
                  id: `tool-${Date.now()}-${Math.random()}`,
                  role: 'tool', content: '', status: 'streaming',
                  toolName: data.name, toolInput: data.input
                }]);
              } else if (data.type === 'tool_result') {
                setMessages(prev => prev.map(msg =>
                  msg.role === 'tool' && msg.toolName === data.name && msg.status === 'streaming'
                    ? { ...msg, status: 'done', toolOutput: data.output }
                    : msg
                ));
              } else if (data.type === 'permission_required') {
                setPendingPermissionId(data.id);
                setMessages(prev => {
                  if (prev.some(m => m.id === data.id)) return prev;
                  return [...prev, {
                    id: data.id, role: 'permission', content: '', status: 'pending', permission: data
                  }];
                });
              } else if (data.type === 'finish') {
                setMessages(prev => prev.map(msg =>
                  msg.id === asstMsgId ? { ...msg, status: 'done' } : msg
                ));
              } else if (data.type === 'error') {
                setMessages(prev => prev.map(msg =>
                  msg.id === asstMsgId ? { ...msg, status: 'error', content: contentRef.current + `\n[Erro: ${data.message}]` } : msg
                ));
              }
            } catch (e) {}
          }
        }

        if (done) break;
      }
    } catch (e: any) {
      const status = e.name === 'AbortError' ? 'canceled' : 'error';
      const errorMsg = e.name === 'AbortError' ? 'interrompido pelo usuário' : `[Erro de conexão: ${e.message}]`;
      setMessages(prev => prev.map(msg =>
        msg.id === asstMsgId ? { ...msg, status, content: contentRef.current || errorMsg } : msg
      ));
    } finally {
      setIsStreaming(false);
      isBusyRef.current = false;
      abortControllerRef.current = null;
    }
  }, []);

  const cancelMessage = useCallback(() => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    setIsStreaming(false);
    isBusyRef.current = false;
  }, []);

  return {
    messages,
    isStreaming,
    isProcessing: isStreaming,
    sendMessage,
    cancelMessage,
    pendingPermission: messages.find(m => m.id === pendingPermissionId)?.permission || null,
    resolvePermission: useCallback(async (action: 'yes' | 'no' | 'always') => {
      if (!pendingPermissionId) return;
      try {
        await fetch(`http://localhost:8080/permission/${pendingPermissionId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action })
        });
        setMessages(prev => prev.map(msg => msg.id === pendingPermissionId ? { ...msg, status: action } : msg));
        setPendingPermissionId(null);
      } catch (e) {}
    }, [pendingPermissionId])
  };
}
