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
  agentId?: string;
}

export function useSSE() {
  const [messages, setMessages] = useState<SSEMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [touchedFiles, setTouchedFiles] = useState<string[]>([]);
  const [sessionUsage, setSessionUsage] = useState({ promptTokens: 0, completionTokens: 0, totalTokens: 0 });
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const contentRef = useRef('');
  const isBusyRef = useRef(false);
  const lastSendRef = useRef<number>(0);

  const sendMessage = useCallback(async (content: string) => {
    const now = Date.now();
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
                dataStr += trimmed.substring(trimmed.indexOf(':') + 1).trim();
              }
            }
            if (!dataStr) continue;
            try {
              const data = JSON.parse(dataStr);
              
              if (data.type === 'text' && typeof data.delta === 'string') {
                contentRef.current += data.delta;
                const snapshot = contentRef.current;
                setMessages(prev => prev.map(msg =>
                  msg.id === asstMsgId ? { ...msg, content: snapshot, agentId: data.agent } : msg
                ));
              } else if (data.type === 'tool_start') {
                if (data.input?.path || data.input?.filePath) {
                  const f = data.input.path || data.input.filePath;
                  setTouchedFiles(prev => [...new Set([...prev, f])]);
                }
                setMessages(prev => [...prev, {
                  id: `tool-${Date.now()}-${Math.random()}`,
                  role: 'tool', content: '', status: 'streaming',
                  toolName: data.name, toolInput: data.input, agentId: data.agent
                }]);
              } else if (data.type === 'tool_result') {
                const isError = data.output && (data.output.error || data.output.success === false);
                
                // Atualizar touchedFiles se houver um caminho
                const path = data.input?.path || data.input?.filePath || data.input?.file_path;
                if (path) {
                   setTouchedFiles(prev => [...new Set([...prev, path])]);
                }

                setMessages(prev => {
                  const existingStreaming = prev.find(msg => 
                    msg.role === 'tool' && msg.toolName === data.name && msg.status === 'streaming'
                  );

                  if (existingStreaming) {
                    return prev.map(msg =>
                      msg === existingStreaming
                        ? { ...msg, status: isError ? 'error' : 'done', toolOutput: data.output }
                        : msg
                    );
                  } else {
                    // Se não houver uma mensagem de start correspondente (comum para injeções via @)
                    return [...prev, {
                      id: `tool-${Date.now()}-${Math.random()}`,
                      role: 'tool',
                      status: isError ? 'error' : 'done',
                      toolName: data.name,
                      toolInput: data.input,
                      toolOutput: data.output,
                      agentId: data.agent
                    }];
                  }
                });
              } else if (data.type === 'usage') {
                setSessionUsage(prev => ({
                  promptTokens: prev.promptTokens + data.promptTokens,
                  completionTokens: prev.completionTokens + data.completionTokens,
                  totalTokens: prev.totalTokens + data.totalTokens
                }));
              } else if (data.type === 'permission_required') {
                console.error(`[TUI-SSE] Permissão recebida: ID=${data.id}, TOOL=${data.tool}`);
                setMessages(prev => {
                  const existing = prev.find(m => m.id === data.id);
                  if (existing) return prev;
                  return [...prev, { 
                    id: data.id, 
                    role: 'permission', 
                    content: '', 
                    status: 'pending', 
                    permission: data,
                    agentId: data.agent 
                  }];
                });
              } else if (data.type === 'finish') {
                setMessages(prev => prev.map(msg => msg.id === asstMsgId ? { ...msg, status: 'done' } : msg));
              } else if (data.type === 'error') {
                console.error(`[TUI-SSE] Erro do servidor: ${data.message}`);
                setMessages(prev => prev.map(msg =>
                  msg.id === asstMsgId ? { ...msg, status: 'error', content: data.message } : msg
                ));
              }
            } catch (e) {
              console.error('[TUI-SSE] Erro ao processar JSON:', e, dataStr);
            }
          }
        }
        if (done) break;
      }
    } catch (e: any) {
      const status = e.name === 'AbortError' ? 'canceled' : 'error';
      const errorMsg = e.name === 'AbortError' ? 'interrompido pelo usuário' : `[Erro de conexão: ${e.message}]`;
      setMessages(prev => prev.map(msg => msg.id === asstMsgId ? { ...msg, status, content: contentRef.current || errorMsg } : msg));
    } finally {
      setIsStreaming(false);
      isBusyRef.current = false;
      abortControllerRef.current = null;
    }
  }, []);

  return {
    messages,
    isStreaming,
    touchedFiles,
    sessionUsage,
    sendMessage,
    cancelMessage: useCallback(() => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      setIsStreaming(false);
      isBusyRef.current = false;
    }, []),
    resolvePermission: useCallback(async (id: string, action: 'yes' | 'no' | 'always') => {
      try {
        await fetch(`http://localhost:8080/permission/${id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action })
        });
        setMessages(prev => prev.map(msg => msg.id === id ? { ...msg, status: action } : msg));
      } catch (e) {
        console.error('[TUI-SSE] Erro ao resolver permissão:', e);
      }
    }, [])
  };
}
