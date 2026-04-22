import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { generateText } from 'ai';
import { readConfig } from '../config/config';
import { getOllamaInstance } from '../provider/ollama';
import { getOpenRouterInstance } from '../provider/openrouter';
import { mapProjectTool } from '../tool/map-project';

// Manifests por linguagem — projeto agnóstico
const PROJECT_MANIFESTS = [
  { file: 'package.json',    parse: (raw: any) => ({ name: raw.name, description: raw.description, scripts: raw.scripts, dependencies: { ...raw.dependencies, ...raw.devDependencies } }) },
  { file: 'pyproject.toml',  parse: (raw: string) => ({ raw }) },
  { file: 'Cargo.toml',      parse: (raw: string) => ({ raw }) },
  { file: 'go.mod',          parse: (raw: string) => ({ raw }) },
  { file: 'pom.xml',         parse: (raw: string) => ({ raw }) },
  { file: 'build.gradle',    parse: (raw: string) => ({ raw }) },
];

async function detectProjectContext(projectRoot: string): Promise<string> {
  for (const { file, parse } of PROJECT_MANIFESTS) {
    try {
      const f = Bun.file(join(projectRoot, file));
      if (!(await f.exists())) continue;

      // JSON parsed properly, TOML/others lidos como texto
      const isJson = file.endsWith('.json');
      const content = isJson ? parse(await f.json()) : parse(await f.text());
      return `${file}:\n${JSON.stringify(content, null, 2)}`;
    } catch {
      // Erro não é silenciado continua para o próximo manifest
      continue;
    }
  }
  return 'No manifest file found.';
}

const INIT_PROMPT = (projectMap: string, projectContext: string) => `
You are a senior software architect. Analyze this project and generate a .kore/rules.md file.
This file will be read by a Tier 2 AI model to guide all development decisions.
Be strictly technical and directive. No filler, no explanations outside the defined sections.

PROJECT STRUCTURE:
${projectMap}

PROJECT MANIFEST:
${projectContext}

Generate the file using EXACTLY this structure:

# 1. System Context
Technical purpose and domain of the system. Define the Ubiquitous Language if applicable.

# 2. Architectural Patterns
Architecture style (Clean Architecture, DDD, Modular Monolith, etc.).
Layer coupling rules and isolation boundaries.

# 3. Stack & Libraries
Primary technologies and implementation preferences.
Example: "Use Bun.file instead of fs", "Prefer functional components", "Use X over Y".

# 4. Anti-Patterns (What NOT to do)
Hard restrictions to prevent unwanted refactors or pattern violations.
Example: "Never use any", "Do not mix domain logic with HTTP handlers".

# 5. AI Conduct Rules
How the model must behave when working on this project.
Example: "Return only code", "Do not explain the obvious", "Maintain strong typing at all times".

Respond with the markdown file content only. No preamble, no explanation.
`;

export async function initializeProject(
  projectRoot: string,
  options: { overwrite?: boolean } = {}
): Promise<{ success: boolean; message: string }> {
  const koreDir  = join(projectRoot, '.kore');
  const rulesPath = join(koreDir, 'rules.md');

  // Verificação de sobrescrita explícita
  if (existsSync(rulesPath) && !options.overwrite) {
    return { success: false, message: '.kore/rules.md already exists. Pass overwrite: true to regenerate.' };
  }

  if (!existsSync(koreDir)) {
    mkdirSync(koreDir, { recursive: true });
  }

  const config = await readConfig();
  if (!config) return { success: false, message: 'Configuration not found.' };

  // Cast seguro via parâmetros tipados do tool
  const projectMap = await mapProjectTool.execute({ directory: projectRoot }, {} as any);
  if ('error' in projectMap) {
    return { success: false, message: `Failed to map project: ${projectMap.error}` };
  }

  const projectContext = await detectProjectContext(projectRoot);
  const prompt = INIT_PROMPT(projectMap.map, projectContext);

  try {
    let modelInstance: any;

    if (config.provider === 'openrouter') {
      // usa config.apiKey ou variável de ambiente
      const apiKey = config.apiKey ?? process.env.OPENROUTER_API_KEY;
      if (!apiKey) return { success: false, message: 'OpenRouter API key not found in config or environment.' };
      const openrouter = await getOpenRouterInstance(apiKey);
      modelInstance = openrouter(config.tier1Model);
    } else {
      modelInstance = getOllamaInstance()(config.tier1Model);
    }

    const { text } = await generateText({ model: modelInstance, prompt });

    // Valida que o modelo retornou conteúdo real antes de gravar
    if (!text?.trim()) {
      return { success: false, message: 'Model returned empty content. Rules file was not written.' };
    }

    await Bun.write(rulesPath, text.trim());
    return { success: true, message: `Rules file generated at ${rulesPath}` };
  } catch (e: any) {
    return { success: false, message: `Generation failed: ${e.message}` };
  }
}