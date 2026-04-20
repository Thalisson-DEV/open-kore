import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { streamSSE } from 'hono/streaming'
import { streamText } from 'ai'
import { readConfig, writeConfig, DEFAULT_CONFIG } from './config/config'
import { Keystore } from './config/keystore'
import { listOllamaModels, getOllamaInstance } from './provider/ollama'
import { getOpenRouterInstance } from './provider/openrouter'

const app = new Hono()

app.use('*', logger())
app.use('*', cors())

app.get('/health', (c) => c.json({ status: 'ok', version: '0.1.0' }))

app.get('/session', async (c) => {
  const config = await readConfig()
  if (!config) return c.json({ status: "needs_setup", message: "Configuração não encontrada" })

  return c.json({
    id: "default-session",
    agent: config.defaultAgent,
    provider: config.provider,
    model: config.model,
    status: "idle",
    createdAt: new Date().toISOString()
  })
})

app.post('/setup', async (c) => {
  const body = await c.req.json()
  const { provider, apiKey, model, masterPassword } = body
  const keystore = new Keystore(masterPassword)
  await keystore.setKey(provider, apiKey)
  await writeConfig({ ...DEFAULT_CONFIG, provider, model: model || DEFAULT_CONFIG.model })
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

app.post('/message', async (c) => {
  const { content } = await c.req.json()
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
    return c.json({ error: e.message }, 500)
  }

  return streamSSE(c, async (stream) => {
    try {
      const result = await streamText({
        model: modelInstance,
        prompt: content,
      })

      for await (const textPart of result.textStream) {
        await stream.writeSSE({
          data: JSON.stringify({ type: 'text', delta: textPart }),
          event: 'message'
        })
      }
      await stream.writeSSE({ data: JSON.stringify({ type: 'finish' }), event: 'message' })
    } catch (e: any) {
      await stream.writeSSE({ data: JSON.stringify({ type: 'error', message: e.message }), event: 'message' })
    }
  })
})

export { app }
