import { tool } from 'ai';
import { z } from 'zod';
import { readdir } from 'node:fs/promises';
import { join } from 'path';

export const mapProjectTool = tool({
  description: 'Gera uma árvore do diretório do projeto para mapear a estrutura.',
  parameters: z.object({
    directory: z.string().optional().default('.').describe('O diretório base para mapear.'),
  }),
  execute: async (args: any) => {
    const directory = args.directory || '.';
    const projectRoot = process.env.OPENKORE_PROJECT_ROOT || process.cwd();
    const targetDir = join(projectRoot, directory);
    let output = '';
    let lineCount = 0;
    const MAX_LINES = 200;

    async function walk(dir: string, prefix = '') {
      if (lineCount >= MAX_LINES) return;

      try {
        const entries = await readdir(dir, { withFileTypes: true });
        const filteredEntries = entries.filter(e => 
          !['node_modules', '.git', '.openkore', 'dist'].includes(e.name)
        );

        for (let i = 0; i < filteredEntries.length; i++) {
          if (lineCount >= MAX_LINES) break;
          
          const entry = filteredEntries[i];
          const isLast = i === filteredEntries.length - 1;
          const pointer = isLast ? '└── ' : '├── ';
          
          output += `${prefix}${pointer}${entry.name}${entry.isDirectory() ? '/' : ''}\n`;
          lineCount++;

          if (entry.isDirectory()) {
            const nextPrefix = prefix + (isLast ? '    ' : '│   ');
            await walk(join(dir, entry.name), nextPrefix);
          }
        }
      } catch (e) {
        // Ignora erros de permissão em subpastas
      }
    }

    try {
      output += `${directory || '.'}/\n`;
      await walk(targetDir);
      return { map: output };
    } catch (e: any) {
      return { error: `Falha ao mapear projeto: ${e.message}` };
    }
  },
});
