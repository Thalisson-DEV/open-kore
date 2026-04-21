import { join } from 'path';
import { statSync } from 'fs';
import { SessionStore } from '../session/store';

export class ToolGuard {
  private static instance: ToolGuard;

  private constructor() {}

  public static getInstance(): ToolGuard {
    if (!ToolGuard.instance) {
      ToolGuard.instance = new ToolGuard();
    }
    return ToolGuard.instance;
  }

  public async getValidCache(sessionId: string, toolName: string, input: any): Promise<any | null> {
    const store = SessionStore.getInstance();
    const inputKey = JSON.stringify(input);
    const cached = store.getCache(sessionId, toolName, inputKey) as any;

    if (!cached) return null;

    // Lógica específica para readFile: verificar timestamp
    if (toolName === 'readFile' && (input.path || input.filePath)) {
      try {
        const path = input.path || input.filePath;
        const projectRoot = process.env.OPENKORE_PROJECT_ROOT || process.cwd();
        const fullPath = join(projectRoot, path);
        const stats = statSync(fullPath);
        
        if (cached.file_mtime !== stats.mtimeMs) {
          return null; // Cache inválido (arquivo foi modificado)
        }
      } catch (e) {
        return null;
      }
    }

    try {
      return JSON.parse(cached.output_value);
    } catch (e) {
      return cached.output_value;
    }
  }

  public saveCache(sessionId: string, toolName: string, input: any, output: any) {
    const store = SessionStore.getInstance();
    const inputKey = JSON.stringify(input);
    const outputValue = typeof output === 'string' ? output : JSON.stringify(output);
    
    let mtime: number | undefined;

    if (toolName === 'readFile' && (input.path || input.filePath)) {
      try {
        const path = input.path || input.filePath;
        const projectRoot = process.env.OPENKORE_PROJECT_ROOT || process.cwd();
        const fullPath = join(projectRoot, path);
        mtime = statSync(fullPath).mtimeMs;
      } catch (e) {}
    }

    store.saveCache(sessionId, toolName, inputKey, outputValue, mtime);
  }
}
