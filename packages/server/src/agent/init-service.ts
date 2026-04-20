import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { generateText } from 'ai';
import { AgentRegistry } from './registry';
import { readConfig } from '../config/config';
import { getOllamaInstance } from '../provider/ollama';
import { getOpenRouterInstance } from '../provider/openrouter';
import { mapProjectTool } from '../tool/map-project';

export async function initializeProject(projectRoot: string): Promise<{ success: boolean; message: string }> {
  const koreDir = join(projectRoot, '.kore');
  const rulesPath = join(koreDir, 'rules.md');

  if (!existsSync(koreDir)) {
    mkdirSync(koreDir, { recursive: true });
  }

  const config = await readConfig();
  if (!config) return { success: false, message: 'Configuração não encontrada.' };

  // 1. Mapear o projeto para contexto
  const projectMap = await mapProjectTool.execute({ directory: projectRoot }, {} as any);
  
  // 2. Tentar ler o package.json para mais detalhes
  let packageContext = '';
  try {
    const pkg = await Bun.file(join(projectRoot, 'package.json')).json();
    packageContext = `Dependencies: ${JSON.stringify(pkg.dependencies || {})}`;
  } catch (e) {}

  const prompt = `
Analise este projeto e gere um arquivo de regras (.kore/rules.md) de ALTO NÍVEL.
Este arquivo será lido por outro modelo de IA (Tier 2) para guiar o desenvolvimento. 
O conteúdo deve ser estritamente técnico, diretivo e SEM conversa fiada.

ESTRUTURA DO PROJETO DETECTADA:
${(projectMap as any).map}

CONTEXTO ADICIONAL (Dependências):
${packageContext}

ESTRUTURA OBRIGATÓRIA DO ARQUIVO .kore/rules.md:

# 1. Contexto do Sistema
Descreva o propósito técnico e o domínio do sistema (Ubiquitous Language).

# 2. Padrões Arquiteturais
Defina a arquitetura (Clean Architecture, DDD, Monolito Modular, etc.).
Estabeleça regras de acoplamento e isolamento de camadas.

# 3. Stack e Bibliotecas
Liste tecnologias principais e preferências de implementação (ex: "Use Bun.file em vez de fs", "Use componentes funcionais").

# 4. Anti-Padrões (O que NÃO fazer)
Liste restrições estritas para evitar refatorações indesejadas ou quebras de padrão.

# 5. Código de Conduta da IA
Instruções de como o modelo deve responder (ex: "Retorne apenas código", "Não explique o óbvio", "Mantenha tipagem forte").

EXEMPLO DE TOM E FORMATO:
# Arquitetura: Monolito Modular & DDD
- Siga princípios de DDD.
- Comunicação entre módulos apenas via Eventos ou Interfaces.
- Isole a lógica de domínio de frameworks externos.

Gere o arquivo agora seguindo fielmente estas seções com base na análise do projeto.
`;

  try {
    let modelInstance: any;
    if (config.provider === 'openrouter') {
      const openrouter = await getOpenRouterInstance('alpha-no-password');
      modelInstance = openrouter(config.tier1Model);
    } else {
      const ollama = getOllamaInstance();
      modelInstance = ollama(config.tier1Model);
    }

    const { text } = await generateText({
      model: modelInstance,
      prompt: prompt,
    });

    await Bun.write(rulesPath, text);
    return { success: true, message: 'Arquivo .kore/rules.md gerado com sucesso!' };
  } catch (e: any) {
    return { success: false, message: `Falha na geração: ${e.message}` };
  }
}
