import { tool } from 'ai';
import { z } from 'zod';
import { PermissionCallback } from './write';

export const createBashTool = (onConfirm: PermissionCallback) => tool({
  description: 'Executa um comando shell no diretório do projeto.',
  parameters: z.object({
    command: z.string().describe('O comando shell a ser executado.'),
  }),
  execute: async ({ command }) => {
    const action = await onConfirm({
      id: `bash-${Date.now()}`,
      tool: 'executeBash',
      input: { command }
    });

    if (action === 'no') {
      return { error: 'Usuário recusou a execução do comando shell.' };
    }

    try {
      const proc = Bun.spawn(['bash', '-c', command]);
      let stdout = await new Response(proc.stdout).text();
      const stderr = await new Response(proc.stderr).text();
      const exitCode = await proc.exited;

      if (stdout.length > 3000) {
        stdout = stdout.substring(0, 3000) + '\n\n[STDOUT_TRUNCATED]';
      }

      return {
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode,
      };
    } catch (e: any) {
      return { error: `Falha ao executar comando: ${e.message}` };
    }
  },
});
