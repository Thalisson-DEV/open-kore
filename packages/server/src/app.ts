import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { streamSSE } from 'hono/streaming'
import { streamText } from 'ai'
import { readConfig, writeConfig, DEFAULT_CONFIG } from './config/config'
import { Keystore } from './config/keystore'
import { listOllamaModels, getOllamaInstance } from './provider/ollama'
import { getOpenRouterInstance } from './provider/openrouter'
import { getTools } from './tool/registry'
import { PermissionManager, PermissionAction } from './permission/manager'
import { AgentRegistry } from './agent/registry'
import { loadLocalRules } from './agent/local-rag'
import { initializeProject } from './agent/init-service'
import { classifyIntent } from './agent/classifier'
import { SessionStore } from './session/store'
import { MemoryManager } from './session/memory'
import { ToolGuard } from './agent/tool-guard'

const app = new Hono()

app.use('*', logger())
app.use('*', cors())

app.get('/health', (c) => c.json({ status: 'ok', version: '0.1.0' }))

app.get('/agents', async (c) => {
  const registry = AgentRegistry.getInstance()
  await registry.refresh()
  return c.json({ agents: registry.getAllAgents() })
})

app.post('/agent', async (c) => {
  const { id } = await c.req.json()
  const config = await readConfig()
  if (!config) return c.json({ status: 'error', message: 'Configuração não encontrada' }, 400)
  const registry = AgentRegistry.getInstance()
  const agent = registry.getAgent(id)
  if (!agent) return c.json({ status: 'error', message: 'Agente não encontrado' }, 400)
  const updatedConfig = { ...config, defaultAgent: id }
  await writeConfig(updatedConfig)
  return c.json({ status: 'success', agent })
})

app.post('/init', async (c) => {
  const projectRoot = process.env.OPENKORE_PROJECT_ROOT || process.cwd();
  const result = await initializeProject(projectRoot);
  return c.json(result);
})

app.get('/session', async (c) => {
  const config = await readConfig()
  if (!config) return c.json({ status: "needs_setup", message: "Configuração não encontrada" })
  const projectRoot = process.env.OPENKORE_PROJECT_ROOT || process.cwd();
  const store = SessionStore.getInstance();
  const session = store.getOrCreateSession(projectRoot, config.defaultAgent);
  const registry = AgentRegistry.getInstance()
  await registry.refresh()
  return c.json({
    id: session.id, agent: config.defaultAgent, agents: registry.getAllAgents(),
    provider: config.provider, model: config.model, tier1Model: config.tier1Model,
    tier2Model: config.tier2Model, userName: config.userName, status: "idle", createdAt: session.created_at
  })
})

app.post('/setup', async (c) => {
  const body = await c.req.json()
  const keystore = new Keystore(body.masterPassword)
  await keystore.setKey(body.provider, body.apiKey)
  await writeConfig({ 
    ...DEFAULT_CONFIG, provider: body.provider, model: body.model || DEFAULT_CONFIG.model,
    userName: body.userName || DEFAULT_CONFIG.userName,
    tier1Model: body.tier1Model || DEFAULT_CONFIG.tier1Model,
    tier2Model: body.tier2Model || DEFAULT_CONFIG.tier2Model
  })
  return c.json({ status: 'success' })
})

app.get('/providers/ollama/models', async (c) => {
  const models = await listOllamaModels()
  return c.json({ models })
})

app.post('/permission/:id', async (c) => {
  const id = c.req.param('id')
  const { action } = await c.req.json() as { action: PermissionAction }
  PermissionManager.getInstance().resolve(id, action)
  return c.json({ status: 'success' })
})

app.post('/message', async (c) => {
  const { content } = await c.req.json()
  const config = await readConfig()
  const masterPassword = c.req.header('x-master-password') || 'alpha-no-password'
  if (!config) return c.json({ error: 'Configuração não encontrada' }, 400)

  const projectRoot = process.env.OPENKORE_PROJECT_ROOT || process.cwd();
  const localRules = await loadLocalRules(projectRoot);
  const registry = AgentRegistry.getInstance()
  const activeAgent = registry.getAgent(config.defaultAgent) || registry.getAgent('backend')!;
  const store = SessionStore.getInstance();
  const memory = MemoryManager.getInstance();
  const toolGuard = ToolGuard.getInstance();
  const session = store.getOrCreateSession(projectRoot, config.defaultAgent);

  // 1. SALVAR MENSAGEM DO USUÁRIO IMEDIATAMENTE
  store.addMessage(session.id, 'user', content);

  let tier1Instance: any;
  if (config.provider === 'openrouter') {
    tier1Instance = (await getOpenRouterInstance(masterPassword))(config.tier1Model);
  } else {
    tier1Instance = (getOllamaInstance())(config.tier1Model);
  }

  const intent = await classifyIntent(tier1Instance, content);
  let targetModel = config.tier2Model;
  if (intent === 'GREETING' || intent === 'READ_ONLY' || activeAgent.id === 'plan') {
    targetModel = config.tier1Model;
  }

  // 2. BUSCAR HISTÓRICO (O PAYLOAD JÁ INCLUIRÁ A MENSAGEM SALVA)
  const fullSystemPrompt = activeAgent.systemPrompt + localRules;
  const messages = await memory.buildPayload(session.id, config.provider, '', fullSystemPrompt, config.tier1Model);

  console.log(`[Server] Enviando payload com ${messages.length} mensagens para o modelo.`);
  const lastMsg = messages[messages.length - 1];
  console.log(`[Server] Última mensagem do payload: [${lastMsg?.role}] ${typeof lastMsg?.content === 'string' ? lastMsg.content.substring(0, 60) : '(content array)'}`);

  return streamSSE(c, async (stream) => {
    let modelInstance: any
    try {
      if (config.provider === 'openrouter') {
        const openrouter = await getOpenRouterInstance(masterPassword)
        modelInstance = openrouter(targetModel)
      } else {
        const ollama = getOllamaInstance()
        modelInstance = ollama(targetModel)
      }
    } catch (e: any) {
      await stream.writeSSE({ data: JSON.stringify({ type: 'error', message: `Erro no modelo: ${e.message}` }) });
      return;
    }

    const allTools = getTools(async (req) => {
      const cached = await toolGuard.getValidCache(session.id, req.tool, req.input);
      if (cached) return 'yes'; 
      await stream.writeSSE({
        data: JSON.stringify({ type: 'permission_required', id: req.id, tool: req.tool, path: req.input.path || req.input.filePath || req.input.command || '', input: req.input, diff: req.diff })
      })
      return await PermissionManager.getInstance().waitFor(req.id)
    })

    const tools = Object.fromEntries(Object.entries(allTools).filter(([name]) => activeAgent.tools.includes(name)))

    try {
      const result = await streamText({
        model: modelInstance,
        messages: messages,
        tools: tools,
        maxSteps: 10,
        onStepFinish: (step) => {
          step.toolCalls.forEach(tc => {
            store.addMessage(session.id, 'assistant_tool_call', JSON.stringify(tc));
          });
          step.toolResults.forEach(tr => {
            if (tr.result && !tr.result.error) {
              toolGuard.saveCache(session.id, tr.toolName, tr.args, tr.result);
            }
            store.addMessage(session.id, 'tool_result', JSON.stringify(tr));
          });
        }
      } as any)

      let assistantContent = '';
      let toolCount = 0;
      console.log(`[Stream] Iniciando processamento de fullStream...`);
      for await (const part of result.fullStream) {
        console.log(`[Stream Part]`, (part as any).type);
        if (part.type === 'text-delta') {
          console.log(`[DEBUG-TEXT-DELTA]`, JSON.stringify(part));
          const delta = (part as any).delta || (part as any).textDelta || (part as any).text;
          if (delta) {
            assistantContent += delta;
            await stream.writeSSE({ data: JSON.stringify({ type: 'text', delta: delta, agent: activeAgent.id }) })
          }
        } else if (part.type === 'reasoning-delta') {
          const delta = (part as any).delta;
          if (delta) {
            await stream.writeSSE({ data: JSON.stringify({ type: 'text', delta: `[Pensamento: ${delta}]`, agent: activeAgent.id }) })
          }
        } else if (part.type === 'tool-call') {
          toolCount++;
          const tc = part as any;
          await stream.writeSSE({ data: JSON.stringify({ type: 'tool_start', name: tc.toolName, input: tc.args || tc.input, agent: activeAgent.id }) })
        } else if (part.type === 'tool-result') {
          const tr = part as any;
          await stream.writeSSE({ data: JSON.stringify({ type: 'tool_result', name: tr.toolName, output: tr.result || tr.output, agent: activeAgent.id }) })
        } else if (part.type === 'error') {
          console.error(`[Stream Error Chunk]`, (part as any).error);
          await stream.writeSSE({ data: JSON.stringify({ type: 'error', message: String((part as any).error) }) })
        }
      }
      console.log(`[Stream] Processamento concluído. Conteúdo total: ${assistantContent.length} chars.`);

      if (assistantContent.trim()) {
        const usage = await result.usage;
        store.addMessage(session.id, 'assistant', assistantContent, usage.completionTokens);
        await stream.writeSSE({ data: JSON.stringify({ type: 'usage', ...usage }) })
      } else if (toolCount > 0) {
        console.log(`[Server] Iniciando fallback forçado para ${toolCount} ferramentas...`);
        try {
          // Fallback ultra-agressivo: limpando o payload para o modelo não se perder
          const messagesForFallback = await memory.buildPayload(session.id, config.provider, '', fullSystemPrompt, config.tier1Model);
          
          // Log do último par tool-call/result para depuração no servidor
          const lastToolMsg = messagesForFallback.filter(m => m.role === 'tool').pop();
          if (lastToolMsg) {
            console.log(`[Server-Fallback] Último resultado de ferramenta:`, JSON.stringify(lastToolMsg.content).substring(0, 200) + '...');
          }

          messagesForFallback.push({ 
            role: 'user', 
            content: 'RESUMO OBRIGATÓRIO: Baseado nos resultados das ferramentas que você acabou de executar, responda ao usuário agora de forma clara e direta sobre o que você encontrou ou o que aconteceu. Não ignore esta mensagem.' 
          });

          const fallbackResult = await streamText({
            model: modelInstance,
            messages: messagesForFallback,
            maxTokens: 1000,
            temperature: 0.7, // Um pouco mais de criatividade para evitar vácuo
          } as any);

          let fallbackContent = '';
          for await (const part of fallbackResult.fullStream) {
            if (part.type === 'text-delta' && (part as any).textDelta) {
              fallbackContent += (part as any).textDelta;
              await stream.writeSSE({ data: JSON.stringify({ type: 'text', delta: (part as any).textDelta, agent: activeAgent.id }) })
            }
          }
          
          if (fallbackContent.trim()) {
            console.log(`[Server] Fallback gerou ${fallbackContent.length} caracteres.`);
            const fallbackUsage = await fallbackResult.usage;
            store.addMessage(session.id, 'assistant', fallbackContent, fallbackUsage.completionTokens);
            await stream.writeSSE({ data: JSON.stringify({ type: 'usage', ...fallbackUsage }) })
          } else {
             console.warn("[Server] Fallback ainda retornou vazio após tentativa forçada.");
             const fallback = "[O agente concluiu a pesquisa, mas o modelo local não gerou um resumo. Por favor, tente perguntar novamente ou use um modelo mais capaz.]";
             store.addMessage(session.id, 'assistant', fallback, 0);
             await stream.writeSSE({ data: JSON.stringify({ type: 'text', delta: fallback, agent: activeAgent.id }) })
          }
        } catch (fallbackError: any) {
          console.error('[Server] Erro crítico no fallback:', fallbackError);
          const fallback = "[Erro ao processar resposta final.]";
          store.addMessage(session.id, 'assistant', fallback, 0);
          await stream.writeSSE({ data: JSON.stringify({ type: 'text', delta: fallback, agent: activeAgent.id }) })
        }
      } else {
        // Fallback para mensagens simples
        const fallback = "[O modelo não gerou uma resposta. Verifique sua conexão ou tente outro modelo.]";
        store.addMessage(session.id, 'assistant', fallback, 0);
        await stream.writeSSE({ data: JSON.stringify({ type: 'text', delta: fallback, agent: activeAgent.id }) })
      }

      await stream.writeSSE({ data: JSON.stringify({ type: 'finish' }) })
    } catch (e: any) {
      console.error(`[Server] Erro durante o stream:`, e);
      await stream.writeSSE({ data: JSON.stringify({ type: 'error', message: e.message }) })
    }
  })
})

export { app }
