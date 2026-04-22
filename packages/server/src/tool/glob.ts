import { tool } from 'ai';
import { z } from 'zod';

export const globTool = tool({
  description: 'Lista arquivos em um diretório que correspondem a um padrão glob (ex: src/**/*.ts).',
  parameters: z.object({
    pattern: z.string().describe('O padrão glob para buscar arquivos.'),
  }),
  execute: async ({ pattern }: any) => {
    try {
      const glob = new Bun.Glob(pattern);
      const files = [];
      for await (const file of glob.scan('.')) {
        files.push(file);
      }
      return { files };
    } catch (e: any) {
      return { error: `Falha ao buscar arquivos com glob: ${e.message}` };
    }
  },
} as any);
