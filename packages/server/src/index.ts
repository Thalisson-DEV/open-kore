import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { readConfig, writeConfig, DEFAULT_CONFIG } from './config/config'
import { Keystore } from './config/keystore'

const app = new Hono()

// Middleware
app.use('*', logger())

// Endpoints
app.get('/health', (c) => {
  return c.json({ status: 'ok', version: '0.1.0' })
})

app.get('/session', async (c) => {
  const config = await readConfig()
  
  if (!config) {
    return c.json({
      status: "needs_setup",
      message: "Configuração não encontrada"
    })
  }

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

  // 1. Inicializar Keystore e salvar API Key
  const keystore = new Keystore(masterPassword)
  await keystore.setKey(provider, apiKey)

  // 2. Salvar configuração inicial
  await writeConfig({
    ...DEFAULT_CONFIG,
    provider,
    model: model || DEFAULT_CONFIG.model
  })

  return c.json({ status: 'success' })
})

export default {
  port: 8080,
  fetch: app.fetch,
}
