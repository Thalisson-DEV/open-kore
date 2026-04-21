import { tool } from 'ai';
import { z } from 'zod';

export const grepTool = tool({
  description: 'Searches for a regex pattern across project files.',
  parameters: z.object({
    pattern: z.string().describe('The regex pattern to search for.'),
    include: z.string().optional().describe('Glob pattern to filter which files are searched.'),
  }),
  execute: async ({ pattern, include = '**/*' }) => {
    try {
      // Com flag 'g', o mesmo objeto mantém lastIndex entre chamadas de .test(),
      const regex = new RegExp(pattern);
      const glob = new Bun.Glob(include);
      const results: Array<{ file: string; line: number; content: string }> = [];

      for await (const path of glob.scan('.')) {
        if (path.includes('node_modules') || path.includes('.git')) continue;

        const content = await Bun.file(path).text();
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
          if (regex.test(lines[i])) {
            results.push({ file: path, line: i + 1, content: lines[i].trim() });
          }
          if (results.length >= 50) break;
        }

        if (results.length >= 50) break;
      }

      return results.length > 0
        ? { results }
        : { message: `No matches found for pattern: ${pattern}` };
    } catch (e: any) {
      return { error: `Failed to execute grep: ${e.message}` };
    }
  },
});