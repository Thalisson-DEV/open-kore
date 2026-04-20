import { tool } from 'ai';
import { z } from 'zod';

export const bashTool = tool({
  description: 'Executa um comando shell no diretório do projeto.',
  parameters: z.object({
    command: z.string().describe('O comando shell a ser executado.'),
  }),
  execute: async ({ command }) => {
    try {
      const proc = Bun.spawn(['bash', '-c', command]);
      const stdout = await new Response(proc.stdout).text();
      const stderr = await new Response(proc.stderr).text();
      const exitCode = await proc.exited;

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
