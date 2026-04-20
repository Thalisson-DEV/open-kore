import { tool } from 'ai';
import { z } from 'zod';
import { PermissionCallback } from './write';

export const createReadTool = (onConfirm: PermissionCallback) => tool({
  description: 'Lê o conteúdo de um arquivo em disco.',
  parameters: z.object({
    path: z.string().describe('O caminho relativo para o arquivo que deve ser lido.'),
  }),
  execute: async ({ path }) => {
    const confirmed = await onConfirm({
      id: `read-${Date.now()}`,
      tool: 'readFile',
      input: { path }
    });

    if (confirmed === 'no') {
      return { error: 'Usuário recusou a leitura do arquivo.' };
    }

    try {
      const file = Bun.file(path);
      if (!(await file.exists())) {
        return { error: `Arquivo não encontrado: ${path}` };
      }
      const content = await file.text();
      return { content };
    } catch (e: any) {
      return { error: `Falha ao ler arquivo: ${e.message}` };
    }
  },
});
