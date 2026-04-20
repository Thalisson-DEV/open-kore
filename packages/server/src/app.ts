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

  const registry = AgentRegistry.getInstance()
  await registry.refresh()

  return c.json({
    id: "default-session",
    agent: config.defaultAgent,
    agents: registry.getAllAgents(),
    provider: config.provider,
    model: config.model,
    tier1Model: config.tier1Model,
    tier2Model: config.tier2Model,
    userName: config.userName,
    status: "idle",
    createdAt: new Date().toISOString()
  })
})

app.post('/setup', async (c) => {
  const body = await c.req.json()
  const { provider, apiKey, model, masterPassword, userName, tier1Model, tier2Model } = body
  const keystore = new Keystore(masterPassword)
  await keystore.setKey(provider, apiKey)
  await writeConfig({ 
    ...DEFAULT_CONFIG, 
    provider, 
    model: model || DEFAULT_CONFIG.model,
    userName: userName || DEFAULT_CONFIG.userName,
    tier1Model: tier1Model || DEFAULT_CONFIG.tier1Model,
    tier2Model: tier2Model || DEFAULT_CONFIG.tier2Model
  })
  return c.json({ status: 'success' })
})

app.get('/providers/ollama/models', async (c) => {
  const models = await listOllamaModels()
  return c.json({ models })
})

app.post('/provider', async (c) => {
  const body = await c.req.json()
  const config = await readConfig()
  if (!config) return c.json({ status: 'error', message: 'Configuração não encontrada' }, 400)
  const updatedConfig = { ...config, provider: body.provider || config.provider, model: body.model || config.model }
  await writeConfig(updatedConfig)
  return c.json({ status: 'success', config: updatedConfig })
})

app.post('/permission/:id', async (c) => {
  const id = c.req.param('id')
  const { action } = await c.req.json() as { action: PermissionAction }
  PermissionManager.getInstance().resolve(id, action)
  return c.json({ status: 'success' })
})

app.post('/message', async (c) => {
  const { content } = await c.req.json()
  console.log(`[Server] Recebida mensagem: "${content}"`);
  const config = await readConfig()
  const masterPassword = c.req.header('x-master-password') || 'alpha-no-password'

  if (!config) return c.json({ error: 'Configuração não encontrada' }, 400)

  // Injeção de Contexto Local (Local RAG)
  const projectRoot = process.env.OPENKORE_PROJECT_ROOT || process.cwd();
  const localRules = await loadLocalRules(projectRoot);

  const registry = AgentRegistry.getInstance()
  const activeAgent = registry.getAgent(config.defaultAgent) || registry.getAgent('backend')!;

  // 1. Instanciar Modelo Tier 1 para classificação
  let tier1Instance: any;
  if (config.provider === 'openrouter') {
    tier1Instance = (await getOpenRouterInstance(masterPassword))(config.tier1Model);
  } else {
    tier1Instance = (getOllamaInstance())(config.tier1Model);
  }

  // 2. Classificar intenção
  console.log(`[Server] Classificando intenção com ${config.tier1Model}...`);
  const intent = await classifyIntent(tier1Instance, content);
  console.log(`[Server] Intenção detectada: ${intent}`);

  // 3. Selecionar Modelo Final baseado na intenção e no agente
  let targetModel = config.tier2Model;
  if (intent === 'GREETING' || intent === 'READ_ONLY' || activeAgent.id === 'plan') {
    targetModel = config.tier1Model;
  }

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
      console.error(`[Server] Erro ao instanciar modelo: ${e.message}`);
      await stream.writeSSE({ data: JSON.stringify({ type: 'error', message: `Erro no modelo: ${e.message}` }) });
      return;
    }

    const permissionManager = PermissionManager.getInstance()
    
    const allTools = getTools(async (req) => {
      const resourcePath = req.input.path || req.input.filePath || req.input.command || '';
      console.log(`[Server] Tool "${req.tool}" requer permissão para:`, resourcePath);
      await stream.writeSSE({
        data: JSON.stringify({ 
          type: 'permission_required', 
          id: req.id,
          tool: req.tool,
          path: resourcePath,
          input: req.input,
          diff: req.diff 
        })
      })
      return await permissionManager.waitFor(req.id)
    })

    const tools = Object.fromEntries(
      Object.entries(allTools).filter(([name]) => activeAgent.tools.includes(name))
    )

    try {
      console.log(`[Server] Iniciando stream com o agente ${activeAgent.name} e modelo ${targetModel}...`);
      const result = await streamText({
        model: modelInstance,
        system: activeAgent.systemPrompt + localRules,
        prompt: content,
        tools: tools,
        maxSteps: 10,
      } as any)

      for await (const part of result.fullStream) {
        if (part.type === 'text-delta') {
          const delta = (part as any).textDelta || (part as any).text || '';
          if (delta) {
            await stream.writeSSE({
              data: JSON.stringify({ type: 'text', delta, agent: activeAgent.id })
            })
          }
        } else if (part.type === 'tool-call') {
          const toolCall = part as any;
          const args = toolCall.args || toolCall.input;
          await stream.writeSSE({
            data: JSON.stringify({ type: 'tool_start', name: toolCall.toolName, input: args, agent: activeAgent.id })
          })
        } else if (part.type === 'tool-result') {
          const toolResult = part as any;
          const resultData = toolResult.result || toolResult.output;
          await stream.writeSSE({
            data: JSON.stringify({ type: 'tool_result', name: toolResult.toolName, output: resultData, agent: activeAgent.id })
          })
        }
      }

      // Envia estatísticas finais de uso
      const usage = await result.usage;
      await stream.writeSSE({ 
        data: JSON.stringify({ 
          type: 'usage', 
          promptTokens: usage.promptTokens, 
          completionTokens: usage.completionTokens,
          totalTokens: usage.totalTokens
        }) 
      })

      await stream.writeSSE({ data: JSON.stringify({ type: 'finish' }) })
    } catch (e: any) {
      console.error(`[Server] Erro durante o stream:`, e);
      await stream.writeSSE({ data: JSON.stringify({ type: 'error', message: e.message }) })
    }
  })
})

export { app }
