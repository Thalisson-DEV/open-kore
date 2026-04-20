import { join } from 'path'
import { homedir } from 'os'
import { mkdir } from 'node:fs/promises'

export interface AppConfig {
  provider: 'openrouter' | 'ollama'
  model: string
  theme: 'dark' | 'light'
  defaultAgent: string
  userName: string
}

const CONFIG_DIR = join(homedir(), '.openkore')
const CONFIG_FILE = join(CONFIG_DIR, 'config.json')

export const DEFAULT_CONFIG: AppConfig = {
  provider: 'openrouter',
  model: 'qwen/qwen-2.5-coder-32b-instruct',
  theme: 'dark',
  defaultAgent: 'backend',
  userName: 'usuário'
}

export async function ensureConfigDir() {
  await mkdir(CONFIG_DIR, { recursive: true })
}

export async function readConfig(): Promise<AppConfig | null> {
  try {
    const file = Bun.file(CONFIG_FILE)
    if (await file.exists()) {
      return await file.json()
    }
    return null
  } catch (e) {
    return null
  }
}

export async function writeConfig(config: AppConfig) {
  await ensureConfigDir()
  await Bun.write(CONFIG_FILE, JSON.stringify(config, null, 2))
}
