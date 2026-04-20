import { tool } from 'ai';
import { z } from 'zod';

export const readTool = tool({
  description: 'Lê o conteúdo de um arquivo em disco.',
  parameters: z.object({
    path: z.string().describe('O caminho relativo para o arquivo que deve ser lido.'),
  }),
  execute: async ({ path }) => {
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
