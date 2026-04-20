import { tool } from 'ai';
import { z } from 'zod';
import { PermissionAction } from '../permission/manager';

export type PermissionCallback = (req: { 
  id: string, 
  tool: string, 
  input: any, 
  diff?: string 
}) => Promise<PermissionAction>;

export const createWriteTool = (onConfirm: PermissionCallback) => tool({
  description: 'Cria um novo arquivo ou sobrescreve um existente com o conteúdo fornecido.',
  parameters: z.object({
    path: z.string().describe('O caminho para o arquivo que deve ser escrito.'),
    content: z.string().describe('O conteúdo completo para gravar no arquivo.'),
  }),
  execute: async ({ path, content }) => {
    const action = await onConfirm({
      id: `write-${Date.now()}`,
      tool: 'writeFile',
      input: { path },
      diff: `+ ${content.length} bytes\n(Novo conteúdo para ${path})`
    });

    if (action === 'no') {
      return { error: 'Usuário recusou a escrita do arquivo.' };
    }

    try {
      const bytes = await Bun.write(path, content);
      return { success: true, bytes, path };
    } catch (e: any) {
      return { error: `Falha ao escrever arquivo: ${e.message}` };
    }
  },
});
