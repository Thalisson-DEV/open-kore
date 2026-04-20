import { tool } from 'ai';
import { z } from 'zod';

export const writeTool = tool({
  description: 'Cria um novo arquivo ou sobrescreve um existente com o conteúdo fornecido.',
  parameters: z.object({
    path: z.string().describe('O caminho para o arquivo que deve ser escrito.'),
    content: z.string().describe('O conteúdo completo para gravar no arquivo.'),
  }),
  execute: async ({ path, content }) => {
    try {
      const bytes = await Bun.write(path, content);
      return { success: true, bytes, path };
    } catch (e: any) {
      return { error: `Falha ao escrever arquivo: ${e.message}` };
    }
  },
});
