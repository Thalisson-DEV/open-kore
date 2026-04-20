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
    userName: config.userName,
    status: "idle",
    createdAt: new Date().toISOString()
  })
})

app.post('/setup', async (c) => {
  const body = await c.req.json()
  const { provider, apiKey, model, masterPassword, userName } = body
  const keystore = new Keystore(masterPassword)
  await keystore.setKey(provider, apiKey)
  await writeConfig({ 
    ...DEFAULT_CONFIG, 
    provider, 
    model: model || DEFAULT_CONFIG.model,
    userName: userName || DEFAULT_CONFIG.userName
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

  let modelInstance: any
  try {
    if (config.provider === 'openrouter') {
      const openrouter = await getOpenRouterInstance(masterPassword)
      modelInstance = openrouter(config.model)
    } else {
      const ollama = getOllamaInstance()
      modelInstance = ollama(config.model)
    }
  } catch (e: any) {
    console.error(`[Server] Erro ao instanciar modelo: ${e.message}`);
    return c.json({ error: e.message }, 500)
  }

  return streamSSE(c, async (stream) => {
    const registry = AgentRegistry.getInstance()
    const activeAgent = registry.getAgent(config.defaultAgent) || registry.getAgent('backend')!
    const permissionManager = PermissionManager.getInstance()
    
    const allTools = getTools(async (req) => {
      console.log(`[Server] Tool "${req.tool}" requer permissão para:`, req.input.path || req.input.command);
      await stream.writeSSE({
        data: JSON.stringify({ 
          type: 'permission_required', 
          id: req.id,
          tool: req.tool,
          path: req.input.path || req.input.command || '',
          input: req.input,
          diff: req.diff 
        })
      })
      return await permissionManager.waitFor(req.id)
    })

    // Filtra ferramentas permitidas pelo agente
    const tools = Object.fromEntries(
      Object.entries(allTools).filter(([name]) => activeAgent.tools.includes(name))
    )

    try {
      console.log(`[Server] Iniciando stream com o agente ${activeAgent.name} e modelo ${config.model}...`);
      const result = await streamText({
        model: modelInstance,
        system: activeAgent.systemPrompt,
        prompt: content,
        tools: tools,
        maxSteps: 10,
      } as any)

      for await (const part of result.fullStream) {
        if (part.type === 'text-delta') {
          const delta = (part as any).textDelta || (part as any).text || '';
          if (delta) {
            console.log(`[Server] Enviando delta: "${delta}"`);
            await stream.writeSSE({
              data: JSON.stringify({ type: 'text', delta })
            })
          }
        } else if (part.type === 'tool-call') {
          const toolCall = part as any;
          const args = toolCall.args || toolCall.input;
          console.log(`[Server] Tool Call: ${toolCall.toolName}`, args);
          await stream.writeSSE({
            data: JSON.stringify({ 
              type: 'tool_start', 
              name: toolCall.toolName, 
              input: args 
            })
          })
        } else if (part.type === 'tool-result') {
          const toolResult = part as any;
          const resultData = toolResult.result || toolResult.output;
          console.log(`[Server] Tool Result: ${toolResult.toolName}`);
          await stream.writeSSE({
            data: JSON.stringify({ 
              type: 'tool_result', 
              name: toolResult.toolName, 
              output: resultData 
            })
          })
        }
      }

      await stream.writeSSE({ data: JSON.stringify({ type: 'finish' }) })
    } catch (e: any) {
      console.error(`[Server] Erro durante o stream:`, e);
      await stream.writeSSE({ data: JSON.stringify({ type: 'error', message: e.message }) })
    }
  })
})

export { app }
