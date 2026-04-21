import { SessionStore, Message } from './store';
import { compactSession } from '../agent/compaction';

export class MemoryManager {
  private static instance: MemoryManager;
  private readonly BUDGETS: Record<string, number> = { openrouter: 32000, ollama: 8000 };

  private constructor() {}

  public static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  private formatToolResult(trValue: any): string {
    if (!trValue) return "A ferramenta não retornou dados.";
    const str = typeof trValue === 'string' ? trValue : JSON.stringify(trValue);
    if (str === '{}' || str === '[]' || str === '{"results":[]}') {
      return "A ferramenta não encontrou nenhum resultado. Avise o usuário ou tente outra abordagem (ex: mudar o padrão de busca ou listar diretórios).";
    }
    return str;
  }

  public async buildPayload(
    sessionId: string, 
    provider: string, 
    newPrompt: string, 
    systemPrompt: string,
    tier1Model: string
  ): Promise<any[]> {
    const store = SessionStore.getInstance();
    const budget = this.BUDGETS[provider] || 8000;
    
    // 1. Bloco de Sistema (sempre o primeiro)
    let finalSystemPrompt = systemPrompt;
    const summary = store.getLatestSummary(sessionId);
    if (summary) {
      finalSystemPrompt += `\n\nSUMÁRIO DO CONTEXTO ANTERIOR: ${summary.condensed_context}`;
    }
    const messages: any[] = [{ role: 'system', content: String(finalSystemPrompt) }];
    let currentTokens = this.estimateTokens(finalSystemPrompt);

    const history = store.getHistory(sessionId, 50); 
    let historyMessages: any[] = [];
    
    for (let i = history.length - 1; i >= 0; i--) {
      const msg = history[i];
      const tokens = msg.token_count || this.estimateTokens(msg.content);
      if (currentTokens + tokens > budget) break;
      
      try {
        if (msg.role === 'assistant_tool_call') {
          const tc = JSON.parse(msg.content);
          const toolCallId = tc.toolCallId || tc.id;
          
          if (toolCallId) {
            historyMessages.unshift({ 
              role: 'assistant', 
              content: [{
                type: 'tool-call',
                toolCallId: String(toolCallId),
                toolName: String(tc.toolName),
                args: tc.args || tc.input || {}
              }]
            });
          }
        } else if (msg.role === 'tool_result') {
          const tr = JSON.parse(msg.content);
          const toolCallId = tr.toolCallId || tr.id;
          
          if (toolCallId) {
            historyMessages.unshift({ 
              role: 'tool', 
              content: [{
                type: 'tool-result',
                toolCallId: String(toolCallId),
                toolName: tr.toolName ? String(tr.toolName) : 'unknown',
                output: { type: 'text', value: this.formatToolResult(tr.result || tr.output) }
              }]
            });
          }
        } else if (msg.role === 'user' || msg.role === 'assistant' || msg.role === 'system') {
          if (msg.content && msg.content.trim()) {
            historyMessages.unshift({ 
              role: msg.role, 
              content: String(msg.content) 
            });
          }
        }
        currentTokens += tokens;
      } catch (e) {
        console.error('Erro ao processar mensagem do histórico:', e);
      }
    }

    // SANITIZAÇÃO RIGOROSA: AI SDK exige alternância e IDs válidos
    const sanitized: any[] = [];
    const rawMessages = [...messages, ...historyMessages];

    for (const msg of rawMessages) {
      const last = sanitized[sanitized.length - 1];
      
      // 1. Merge de mensagens consecutivas do mesmo papel
      if (last && last.role === msg.role) {
        if (msg.role === 'system') {
          last.content = String(last.content) + "\n" + String(msg.content);
          continue;
        }

        if (typeof last.content === 'string' && typeof msg.content === 'string') {
          last.content += "\n" + msg.content;
          continue;
        } else {
          // Normalizar para arrays de parts e concatenar (mantém flat)
          const lastParts = Array.isArray(last.content) ? last.content : [{ type: 'text', text: String(last.content) }];
          const msgParts = Array.isArray(msg.content) ? msg.content : [{ type: 'text', text: String(msg.content) }];
          last.content = [...lastParts, ...msgParts];
          continue;
        }
      }
      
      // 2. Garantir que tool result tenha uma chamada antes
      if (Array.isArray(msg.content) && msg.content.some((p: any) => p.type === 'tool-result')) {
        if (!last || last.role !== 'assistant') {
          continue; 
        }
        // Verificar se a última mensagem assistant tem pelo menos um tool-call part
        const hasToolCall = Array.isArray(last.content) && last.content.some((p: any) => p.type === 'tool-call');
        if (!hasToolCall) continue;
      }

      sanitized.push(msg);
    }

    // 2.5. Preencher tool-results ausentes para múltiplos tool-calls
    for (let i = 0; i < sanitized.length; i++) {
      const msg = sanitized[i];
      if (msg.role === 'assistant' && Array.isArray(msg.content)) {
        const toolCalls = msg.content.filter((p: any) => p.type === 'tool-call');
        if (toolCalls.length > 0) {
          const nextMsg = sanitized[i + 1];
          const nextMsgIsToolResult = nextMsg && nextMsg.role === 'tool' && Array.isArray(nextMsg.content) && nextMsg.content.some((p: any) => p.type === 'tool-result');
          
          if (!nextMsgIsToolResult) {
            // Se não tem próxima mensagem de tool-result, precisamos criar uma
            const syntheticResults = toolCalls.map((tc: any) => ({
              type: 'tool-result',
              toolCallId: tc.toolCallId,
              toolName: tc.toolName,
              output: { type: 'text', value: this.formatToolResult({ error: 'Result omitted from history' }) }
            }));
            sanitized.splice(i + 1, 0, { role: 'tool', content: syntheticResults });
            i++; // Pula a mensagem que acabamos de inserir
          } else {
            // Verifica quais IDs faltam na próxima mensagem
            const resultIds = new Set(nextMsg.content.filter((p: any) => p.type === 'tool-result').map((p: any) => (p as any).toolCallId));
            const missingCalls = toolCalls.filter((tc: any) => !resultIds.has(tc.toolCallId));
            
            if (missingCalls.length > 0) {
              const syntheticResults = missingCalls.map((tc: any) => ({
                type: 'tool-result',
                toolCallId: tc.toolCallId,
                toolName: tc.toolName,
                output: { type: 'text', value: this.formatToolResult({ error: 'Result omitted from history' }) }
              }));
              nextMsg.content.push(...syntheticResults);
            }
          }
        }
      }
    }

    // 3. Adicionar nova mensagem se não for vazia
    if (newPrompt && newPrompt.trim()) {
      const last = sanitized[sanitized.length - 1];
      if (last && last.role === 'user' && typeof last.content === 'string') {
        last.content += "\n" + newPrompt;
      } else {
        sanitized.push({ role: 'user', content: String(newPrompt) });
      }
    }

    // 4. Limpeza final: remover mensagens vazias que podem ter sobrado
    const finalPayload = sanitized.filter(msg => {
      if (Array.isArray(msg.content)) return msg.content.length > 0;
      if (typeof msg.content === 'string') return msg.content.trim().length > 0;
      return !!msg.content;
    });
    
    if (currentTokens > budget * 0.8) {
      compactSession(sessionId, provider, tier1Model).catch(console.error);
    }

    return finalPayload;
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}
