import { tool } from 'ai';
import { z } from 'zod';
import { join } from 'path';
import { PermissionCallback } from './write';
import { ToolGuard } from '../agent/tool-guard';

export const createReadTool = (onConfirm: PermissionCallback) => tool({
  description: 'Lê o conteúdo de um arquivo em disco.',
  parameters: z.object({
    path: z.string().describe('O caminho relativo para o arquivo que deve ser lido.'),
  }),
  execute: async (args: any) => {
    const path = args.path || args.filePath;
    
    if (!path || typeof path !== 'string') {
      return { error: 'Caminho do arquivo inválido ou não fornecido.' };
    }

    const projectRoot = process.env.OPENKORE_PROJECT_ROOT || process.cwd();
    const fullPath = path.startsWith('/') ? path : join(projectRoot, path);

    // 1. Tentar recuperar do cache via ToolGuard
    const toolGuard = ToolGuard.getInstance();
    const cached = await toolGuard.getValidCache("default-session", 'readFile', { path });
    
    if (cached) {
      console.log(`[Tool:readFile] Usando cache para ${path}`);
      return cached;
    }

    const confirmed = await onConfirm({
      id: `read-${Date.now()}`,
      tool: 'readFile',
      input: { path },
      path: path
    });

    if (confirmed === 'no') {
      return { error: 'Usuário recusou a leitura do arquivo.' };
    }

    try {
      const file = Bun.file(fullPath);
      if (!(await file.exists())) {
        return { error: `Arquivo não encontrado: ${path}` };
      }
      const content = await file.text();
      const result = content.length > 3000 
        ? { content: content.substring(0, 3000) + '\n\n[OUTPUT_TRUNCATED: Arquivo muito grande, use searchWithGrep ou leia partes específicas se necessário.]' }
        : { content };

      return result;
    } catch (e: any) {
      return { error: `Falha ao ler arquivo: ${e.message}` };
    }
  },
});
