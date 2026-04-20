import { tool } from 'ai';
import { z } from 'zod';

export const grepTool = tool({
  description: 'Busca por uma expressão regular em arquivos do projeto.',
  parameters: z.object({
    pattern: z.string().describe('A expressão regular (regex) para buscar.'),
    include: z.string().optional().describe('Padrão glob para filtrar arquivos incluídos na busca.'),
  }),
  execute: async ({ pattern, include = '**/*' }) => {
    try {
      const regex = new RegExp(pattern, 'g');
      const glob = new Bun.Glob(include);
      const results: Array<{ file: string, line: number, content: string }> = [];

      for await (const path of glob.scan('.')) {
        if (path.includes('node_modules') || path.includes('.git')) continue;
        
        const content = await Bun.file(path).text();
        const lines = content.split('\n');
        
        lines.forEach((line, index) => {
          if (regex.test(line)) {
            results.push({ file: path, line: index + 1, content: line.trim() });
          }
        });

        if (results.length > 50) break; // Limite de segurança para o contexto
      }

      return { results };
    } catch (e: any) {
      return { error: `Falha ao executar grep: ${e.message}` };
    }
  },
});
