import { tool } from 'ai';
import { z } from 'zod';
import { PermissionCallback } from './write';

export const createEditTool = (onConfirm: PermissionCallback) => tool({
  description: 'Edita um arquivo existente substituindo uma string exata por outra.',
  parameters: z.object({
    path: z.string().describe('O caminho para o arquivo que deve ser editado.'),
    oldString: z.string().describe('A string exata que deve ser substituída.'),
    newString: z.string().describe('A nova string que deve entrar no lugar.'),
  }),
  execute: async ({ path, oldString, newString }) => {
    const action = await onConfirm({
      id: `edit-${Date.now()}`,
      tool: 'editFile',
      input: { path },
      diff: `- ${oldString}\n+ ${newString}`
    });

    if (action === 'no') {
      return { error: 'Usuário recusou a edição do arquivo.' };
    }

    try {
      const file = Bun.file(path);
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
      await Bun.write(path, newContent);
      
      return { success: true, path };
    } catch (e: any) {
      return { error: `Falha ao editar arquivo: ${e.message}` };
    }
  },
});
