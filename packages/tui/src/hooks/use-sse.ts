import { useState, useCallback } from 'react';

export interface SSEMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  status: 'streaming' | 'done' | 'error';
}

export function useSSE() {
  const [messages, setMessages] = useState<SSEMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    const userMsgId = Date.now().toString();
    const userMsg: SSEMessage = { id: userMsgId, role: 'user', content, status: 'done' };
    const asstMsgId = (Date.now() + 1).toString();
    const asstMsg: SSEMessage = { id: asstMsgId, role: 'assistant', content: '', status: 'streaming' };

    setMessages(prev => [...prev, userMsg, asstMsg]);
    setIsStreaming(true);

    try {
      const response = await fetch('http://localhost:8080/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-master-password': 'alpha-no-password' 
        },
        body: JSON.stringify({ content })
      });

      if (!response.body) throw new Error('Falha ao conectar com o servidor');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            if (!dataStr) continue;

            try {
              const data = JSON.parse(dataStr);
              if (data.type === 'text') {
                assistantContent += data.delta;
                setMessages(prev => prev.map(msg => 
                  msg.id === asstMsgId ? { ...msg, content: assistantContent } : msg
                ));
              } else if (data.type === 'finish') {
                setMessages(prev => prev.map(msg => 
                  msg.id === asstMsgId ? { ...msg, status: 'done' } : msg
                ));
              } else if (data.type === 'error') {
                assistantContent += `\n[Erro: ${data.message}]`;
                setMessages(prev => prev.map(msg => 
                  msg.id === asstMsgId ? { ...msg, status: 'error', content: assistantContent } : msg
                ));
              }
            } catch (e) {
              // Ignorar JSON parcial
            }
          }
        }
      }
    } catch (e: any) {
      setMessages(prev => prev.map(msg => 
        msg.id === asstMsgId ? { ...msg, status: 'error', content: `[Erro de conexão: ${e.message}]` } : msg
      ));
    } finally {
      setIsStreaming(false);
    }
  }, []);

  return { messages, isStreaming, sendMessage };
}
