import { app } from './app'

export default {
  port: 8080,
  fetch: app.fetch,
  idleTimeout: 240, // 4 minutos
}
