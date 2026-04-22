import { tool } from 'ai';
import { z } from 'zod';
import { PermissionCallback } from './write';

const STDOUT_LIMIT = 3000;
const STDERR_LIMIT = 1000;
const DEFAULT_TIMEOUT_MS = 30_000; // 30s — configurável via env

const DESTRUCTIVE_PATTERNS = [
  /rm\s+-rf\s+\/(?!\w)/,   // rm -rf /
  /mkfs/,                   // formatar disco
  /:\(\)\{.*\}/,            // fork bomb
  /dd\s+if=.*of=\/dev\//,   // sobrescrever dispositivo
];

function isDestructive(command: string): string | null {
  for (const pattern of DESTRUCTIVE_PATTERNS) {
    if (pattern.test(command)) return pattern.toString();
  }
  return null;
}

export const createBashTool = (onConfirm: PermissionCallback) => tool({
  description: 'Executes a shell command in the project directory.',
  parameters: z.object({
    command: z.string().describe('The shell command to execute.'),
    timeout: z.number().optional().describe('Timeout in milliseconds. Defaults to 30000.'),
  }),
  execute: async ({ command, timeout = DEFAULT_TIMEOUT_MS }: any) => {
    const destructiveMatch = isDestructive(command);
    if (destructiveMatch) {
      return { error: `Command blocked: matches destructive pattern (${destructiveMatch}). Refusing to proceed.` };
    }

    const action = await onConfirm({
      id: `bash-${Date.now()}`,
      tool: 'executeBash',
      input: { command },
    });

    if (action === 'no') return { error: 'User denied command execution.' };

    // AbortController para timeout controlado
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const proc = Bun.spawn(['bash', '-c', command], {
        signal: controller.signal as any,
      });

      let stdout = await new Response(proc.stdout).text();
      let stderr = await new Response(proc.stderr).text();
      const exitCode = await proc.exited;

      // Ambos os streams têm limite com aviso explícito
      if (stdout.length > STDOUT_LIMIT) {
        stdout = stdout.slice(0, STDOUT_LIMIT) + `\n[STDOUT_TRUNCATED: ${stdout.length} chars total]`;
      }
      if (stderr.length > STDERR_LIMIT) {
        stderr = stderr.slice(0, STDERR_LIMIT) + `\n[STDERR_TRUNCATED: ${stderr.length} chars total]`;
      }

      return { stdout: stdout.trim(), stderr: stderr.trim(), exitCode };
    } catch (e: any) {
      // Distingue timeout de outros erros
      if (e.name === 'AbortError' || controller.signal.aborted) {
        return { error: `Command timed out after ${timeout}ms. Consider breaking it into smaller steps.` };
      }
      return { error: `Failed to execute command: ${e.message}` };
    } finally {
      clearTimeout(timer);
    }
  },
} as any);
