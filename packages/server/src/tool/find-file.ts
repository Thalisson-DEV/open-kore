import { tool } from 'ai';
import { z } from 'zod';

export const findFileTool = tool({
  description: 'Busca arquivos pelo nome no projeto quando você não tem certeza do caminho exato.',
  parameters: z.object({
    fileName: z.string().describe('O nome ou parte do nome do arquivo para buscar (ex: "user.service" ou "config.ts").'),
  }),
  execute: async ({ fileName }) => {
    try {
      // Busca ignorando pastas comuns de build e dependências
      const glob = new Bun.Glob(`**/*${fileName}*`);
      const files = [];
      let count = 0;

      for await (const file of glob.scan('.')) {
        if (file.includes('node_modules') || file.includes('.git') || file.includes('.turbo') || file.includes('dist')) {
          continue;
        }
        files.push(file);
        count++;
        if (count > 20) break; // Limite para não poluir o contexto
      }

      if (files.length === 0) {
        return { message: `Nenhum arquivo encontrado com o nome: ${fileName}. Tente um padrão mais genérico.` };
      }

      return { files };
    } catch (e: any) {
      return { error: `Erro ao buscar arquivo: ${e.message}` };
    }
  },
});
