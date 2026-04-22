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

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'token' || data.type === 'text') {
                const delta = data.token || data.delta;
                contentRef.current += delta;
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
                        ? { ...msg, content: '', status: isError ? 'error' : 'done', toolOutput: data.output }
                        : msg
                    );
                  } else {
                    return [...prev, {
                      id: `tool-${Date.now()}-${Math.random()}`,
                      role: 'tool',
                      content: '',
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
              } else if (data.type === 'permission_request' || data.type === 'permission_required') {
                const permission = data.permission || {
                  id: data.id,
                  tool: data.tool,
                  input: data.input,
                  diff: data.diff
                };
                setMessages(prev => [...prev, {
                  id: permission.id || `perm-${Date.now()}`,
                  role: 'permission',
                  content: '',
                  status: 'pending',
                  permission: permission,
                  agentId: data.agent
                }]);
              } else if (data.type === 'done' || data.type === 'finish') {
                setMessages(prev => prev.map(msg =>
                  msg.id === asstMsgId ? { ...msg, status: 'done' } : msg
                ));
                isBusyRef.current = false;
                setIsStreaming(false);
              } else if (data.type === 'error') {
                const errorMsg = data.error || data.message || 'Erro desconhecido';
                setMessages(prev => prev.map(msg =>
                  msg.id === asstMsgId ? { ...msg, status: 'error', content: errorMsg } : msg
                ));
                isBusyRef.current = false;
                setIsStreaming(false);
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // Marcar como cancelado
        setMessages(prev => prev.map(msg =>
          msg.id === asstMsgId ? { ...msg, status: 'canceled' } : msg
        ));
      } else {
        setMessages(prev => prev.map(msg =>
          msg.id === asstMsgId ? { ...msg, status: 'error', content: err.message } : msg
        ));
      }
      isBusyRef.current = false;
      setIsStreaming(false);
    }
  }, []);

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      isBusyRef.current = false;
      setIsStreaming(false);
    }
  }, []);

  const resolvePermission = useCallback(async (permissionId: string, choice: 'yes' | 'no' | 'always') => {
    // Atualizar UI
    setMessages(prev => prev.map(msg => 
      msg.id === permissionId ? { ...msg, status: choice } : msg
    ));

    // Notificar servidor
    try {
      await fetch(`http://localhost:8080/permission/${permissionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-master-password': 'alpha-no-password' },
        body: JSON.stringify({ action: choice })
      });
    } catch (err) {
      console.error('Error resolving permission:', err);
    }
  }, []);

  return {
    messages,
    isStreaming,
    sendMessage,
    stopStreaming,
    touchedFiles,
    sessionUsage,
    resolvePermission
  };
}
