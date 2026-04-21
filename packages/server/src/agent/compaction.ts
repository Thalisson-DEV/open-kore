import { generateText } from 'ai';
import { SessionStore } from '../session/store';
import { getOllamaInstance } from '../provider/ollama';
import { getOpenRouterInstance } from '../provider/openrouter';

export async function compactSession(
  sessionId: string, 
  provider: string, 
  modelId: string
) {
  const store = SessionStore.getInstance();
  const history = store.getHistory(sessionId, 40); // Pega mensagens antigas para sumarizar
  
  if (history.length < 10) return; // Não compactar sessões muito curtas

  // Mensagens que serão sumarizadas (as 30 mais antigas das 40 capturadas)
  const toSummarize = history.slice(0, 30);
  const lastMessageId = toSummarize[toSummarize.length - 1].id;
  const previousSummary = store.getLatestSummary(sessionId);

  const historyText = toSummarize.map(m => `${m.role}: ${m.content}`).join('\n\n');
  
  const prompt = `
Condense o histórico de chat abaixo em um sumário técnico ultra-conciso.
Mantenha: decisões arquiteturais, arquivos lidos/modificados e estado atual das tarefas.
Remova: saudações, conversas triviais e redundâncias.

SUMÁRIO ANTERIOR (se houver):
${previousSummary?.condensed_context || 'Nenhum'}

HISTÓRICO A COMPACTAR:
${historyText}

Responda APENAS com o novo sumário consolidado.
`;

  try {
    let modelInstance: any;
    if (provider === 'openrouter') {
      modelInstance = (await getOpenRouterInstance('alpha-no-password'))(modelId);
    } else {
      modelInstance = (getOllamaInstance())(modelId);
    }

    const { text } = await generateText({
      model: modelInstance,
      prompt: prompt,
    });

    // Salva novo sumário e limpa banco
    store.saveSummary(sessionId, text.trim(), lastMessageId);
    store.deleteMessages(toSummarize.map(m => m.id));
    
    console.log(`[Server] Sessão ${sessionId} compactada com sucesso.`);
  } catch (e) {
    console.error(`[Server] Falha ao compactar sessão:`, e);
  }
}
