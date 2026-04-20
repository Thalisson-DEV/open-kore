import { join } from 'path';
import { existsSync, readFileSync } from 'fs';

export async function loadLocalRules(cwd: string): Promise<string> {
  const rulesPath = join(cwd, '.kore', 'rules.md');
  const contextPath = join(cwd, '.kore', 'context.md');
  
  let localContext = '\n\n[LOCAL CONTEXT & RULES]';
  let found = false;

  if (existsSync(rulesPath)) {
    localContext += `\nRules from .kore/rules.md:\n${readFileSync(rulesPath, 'utf-8')}`;
    found = true;
  }

  if (existsSync(contextPath)) {
    localContext += `\nContext from .kore/context.md:\n${readFileSync(contextPath, 'utf-8')}`;
    found = true;
  }

  return found ? localContext : '';
}
