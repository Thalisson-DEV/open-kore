import { join } from 'path'
import { homedir } from 'os'
import { scryptSync, createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
import { ensureConfigDir } from './config'

const KEY_FILE = join(homedir(), '.openkore', 'keys.enc')

//todo: em um ambiente real, a senha mestra não deve ser hardcoded. Ela deve ser fornecida pelo usuário ou derivada de alguma forma segura.
const SALT = 'openkore-salt-2026'

export class Keystore {
  private masterKey: Buffer

  constructor(masterPassword: string) {
    this.masterKey = scryptSync(masterPassword, SALT, 32)
  }

  async setKey(provider: string, apiKey: string) {
    const iv = randomBytes(12)
    const cipher = createCipheriv('aes-256-gcm', this.masterKey, iv)
    
    let encrypted = cipher.update(apiKey, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    const authTag = cipher.getAuthTag().toString('hex')

    const data = await this.readRaw()
    data[provider] = {
      iv: iv.toString('hex'),
      authTag,
      encrypted
    }

    await ensureConfigDir()
    await Bun.write(KEY_FILE, JSON.stringify(data))
  }

  async getKey(provider: string): Promise<string | null> {
    const data = await this.readRaw()
    const entry = data[provider]
    if (!entry) return null

    try {
      const decipher = createDecipheriv(
        'aes-256-gcm', 
        this.masterKey, 
        Buffer.from(entry.iv, 'hex')
      )
      decipher.setAuthTag(Buffer.from(entry.authTag, 'hex'))

      let decrypted = decipher.update(entry.encrypted, 'hex', 'utf8')
      decrypted += decipher.final('utf8')
      return decrypted
    } catch (e) {
      return null
    }
  }

  private async readRaw(): Promise<Record<string, any>> {
    try {
      const file = Bun.file(KEY_FILE)
      if (await file.exists()) {
        return await file.json()
      }
    } catch (e) {}
    return {}
  }
}
