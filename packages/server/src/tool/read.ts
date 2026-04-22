import { tool } from 'ai';
import { z } from 'zod';
import { join } from 'path';
import { PermissionCallback } from './write';
import { ToolGuard } from '../agent/tool-guard';

const MAX_CHARS = 3000;

// ✅ FIX: Trunca no limite da última linha completa antes de MAX_CHARS,
// evitando cortes no meio de funções, strings ou tokens UTF-8.
function truncateAtLineBoundary(content: string, limit: number): { text: string; truncated: boolean } {
  if (content.length <= limit) return { text: content, truncated: false };

  const slice = content.slice(0, limit);
  const lastNewline = slice.lastIndexOf('\n');
  const cutAt = lastNewline > 0 ? lastNewline : limit;

  return {
    text: content.slice(0, cutAt),
    truncated: true,
  };
}

export const createReadTool = (onConfirm: PermissionCallback) => tool({
  description: 'CRITICAL: Reads the content of a file from disk. STRICTLY FORBIDDEN: NEVER call this tool if the file is already listed in the "--- Content from referenced files ---" section above. Doing so is redundant and a waste of tokens.',
  parameters: z.object({
    path: z.string().describe('The relative path to the file.'),
  }),
  execute: async (args: any) => {
    let path = args.path || args.filePath;

    if (!path || typeof path !== 'string') {
      return { error: 'Invalid or missing file path.' };
    }

    if (path.startsWith('@')) path = path.slice(1);

    const projectRoot = process.env.OPENKORE_PROJECT_ROOT || process.cwd();
    const fullPath = path.startsWith('/') ? path : join(projectRoot, path);

    const toolGuard = ToolGuard.getInstance();
    const cached = await toolGuard.getValidCache("default-session", 'readFile', { path });
    if (cached) {
      console.log(`[Tool:readFile] Cache hit for ${path}`);
      return cached;
    }

    const confirmed = await onConfirm({
      id: `read-${Date.now()}`,
      tool: 'readFile',
      input: { path },
    });

    if (confirmed === 'no') return { error: 'User denied file read.' };

    try {
      const file = Bun.file(fullPath);

      if (!(await file.exists())) {
        const fileName = path.split('/').pop() ?? '';
        const baseName = fileName.split('.')[0] ?? fileName;
        const glob = new Bun.Glob(`**/*${baseName}*`);
        const suggestions: string[] = [];

        for await (const s of glob.scan('.')) {
          if (!s.includes('node_modules')) {
            suggestions.push(s);
            if (suggestions.length >= 5) break;
          }
        }

        return {
          error: `File not found: ${path}.${
            suggestions.length > 0
              ? ` Suggestions: ${suggestions.join(', ')}`
              : ' Use findFile to locate it.'
          }`,
        };
      }

      const raw = await file.text();
      // ✅ FIX aplicado aqui
      const { text, truncated } = truncateAtLineBoundary(raw, MAX_CHARS);

      return {
        content: truncated
          ? `${text}\n\n[TRUNCATED: file has ${raw.length} chars, showing first ${text.length}. Use searchWithGrep to find specific sections.]`
          : text,
      };
    } catch (e: any) {
      return { error: `Failed to read file: ${e.message}` };
    }
  },
} as any);
