import { tool } from 'ai';
import { z } from 'zod';
import { PermissionAction } from '../permission/manager';

export type PermissionCallback = (req: { 
  id: string, 
  tool: string, 
  input: any, 
  diff?: string 
}) => Promise<PermissionAction>;

export const createWriteTool = (onConfirm: PermissionCallback, activeFiles?: string[]) => tool({
  description: 'Cria um novo arquivo ou sobrescreve um existente com o conteúdo fornecido.',
  parameters: z.object({
    path: z.string().optional().describe('O caminho para o arquivo que deve ser escrito. Pode ser omitido se for o único arquivo no contexto (@arquivo).'),
    content: z.string().describe('O conteúdo completo para gravar no arquivo.'),
  }),
  execute: async (args: any) => {
    let path = args.path || args.filePath || args.file;
    
    // Auto-preenchimento do path se houver apenas 1 arquivo anexado
    if (!path && activeFiles && activeFiles.length === 1) {
      path = activeFiles[0];
    }

    const content = args.content || '';

    if (!path) {
      return { error: 'Caminho do arquivo (path) não fornecido pela IA.' };
    }

    const projectRoot = process.env.OPENKORE_PROJECT_ROOT || process.cwd();
    const fullPath = path.startsWith('/') ? path : `${projectRoot}/${path}`;

    // Gera um preview do conteúdo para o diff
    const lines = content.split('\n');
    const preview = lines.length > 15 
      ? lines.slice(0, 15).join('\n') + '\n... (mais linhas)'
      : content;

    const action = await onConfirm({
      id: `write-${Date.now()}`,
      tool: 'writeFile',
      input: { path, content },
      diff: preview.split('\n').map((l: string) => `+ ${l}`).join('\n')
    });

    if (action === 'no') {
      return { error: 'Usuário recusou a escrita do arquivo.' };
    }

    try {
      const bytes = await Bun.write(fullPath, content);
      return { success: true, bytes, path };
    } catch (e: any) {
      return { error: `Falha ao escrever arquivo: ${e.message}` };
    }
  },
} as any);
