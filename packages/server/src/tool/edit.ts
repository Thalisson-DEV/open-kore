import { tool } from 'ai';
import { z } from 'zod';
import { PermissionCallback } from './write';

export const createEditTool = (onConfirm: PermissionCallback, activeFiles?: string[]) => tool({
  description: 'Edita um arquivo existente substituindo uma string exata por outra. IMPORTANTE: oldString deve ser IDENTICA ao que está no arquivo (espaços, quebras de linha, etc). Se não tiver certeza, use readFile antes.',
  parameters: z.object({
    path: z.string().optional().describe('O caminho para o arquivo que deve ser editado. Pode ser omitido se já estiver no contexto (@arquivo).'),
    oldString: z.string().describe('O trecho de texto EXATO que deve ser substituído.'),
    newString: z.string().describe('O novo texto que entrará no lugar.'),
  }),
  execute: async (args: any) => {
    let path = args.path || args.filePath || args.file;
    
    // Auto-preenchimento do path se houver apenas 1 arquivo anexado e a IA omitiu o path
    if (!path && activeFiles && activeFiles.length === 1) {
      path = activeFiles[0];
    }

    const oldString = args.oldString || args.old_string;
    const newString = args.newString || args.new_string;

    if (!path) {
      return { error: 'Caminho do arquivo (path) não fornecido pela IA e múltiplos ou nenhum arquivo anexado.' };
    }

    const projectRoot = process.env.OPENKORE_PROJECT_ROOT || process.cwd();
    const fullPath = path.startsWith('/') ? path : `${projectRoot}/${path}`;

    if (oldString === undefined || newString === undefined) {
      return { error: 'oldString ou newString não fornecidos pela IA.' };
    }

    const action = await onConfirm({
      id: `edit-${Date.now()}`,
      tool: 'editFile',
      input: { path, oldString, newString },
      diff: oldString.split('\n').map(l => `- ${l}`).join('\n') + '\n' + newString.split('\n').map(l => `+ ${l}`).join('\n')
    });

    if (action === 'no') {
      return { error: 'Usuário recusou a edição do arquivo.' };
    }

    try {
      const file = Bun.file(fullPath);
      if (!(await file.exists())) {
        return { error: `Arquivo não encontrado: ${path}` };
      }
      
      const content = await file.text();
      if (!content.includes(oldString)) {
        return { error: `String original não encontrada no arquivo ${path}` };
      }

      const occurrences = content.split(oldString).length - 1;
      if (occurrences > 1) {
        return { error: `String original é ambígua (encontrada ${occurrences} vezes). Forneça mais contexto.` };
      }

      const newContent = content.replace(oldString, newString);
      await Bun.write(fullPath, newContent);
      
      return { success: true, path };
    } catch (e: any) {
      return { error: `Falha ao editar arquivo: ${e.message}` };
    }
  },
});
