import { Agent } from './agent';
import { join } from 'path';
import { homedir } from 'os';
import { readdir } from 'node:fs/promises';

import { VERBOSITY_SUPPRESSION, BASE_RULES } from './system-prompt';

const AGENTS_DIR = join(homedir(), '.openkore', 'agents');

const BUILTIN_AGENTS: Agent[] = [
  {
    id: 'backend',
    name: 'Backend Engineer',
    description: 'Especialista em arquitetura, lógica de servidor e infraestrutura.',
    systemPrompt: `Você é o OpenKore Backend Engineer. 
TypeScript, Node.js, SOLID. Use 'mapProject' para análise estrutural.
${BASE_RULES}
${VERBOSITY_SUPPRESSION}`,
    tools: ['readFile', 'writeFile', 'editFile', 'executeBash', 'listWithGlob', 'searchWithGrep', 'mapProject']
  },
  {
    id: 'frontend',
    name: 'Frontend Engineer',
    description: 'Especialista em interfaces, React e UX/UI.',
    systemPrompt: `Você é o OpenKore Frontend Engineer.
React, Ink, TUI components. Foque em UX minimalista e funcional.
${BASE_RULES}
${VERBOSITY_SUPPRESSION}`,
    tools: ['readFile', 'writeFile', 'editFile', 'listWithGlob', 'mapProject']
  },
  {
    id: 'plan',
    name: 'Architect & Planner',
    description: 'Agente de análise e planejamento. Não faz alterações destrutivas.',
    systemPrompt: `Você é o OpenKore Architect.
Análise de requisitos, planos de ação técnicos. Proponha soluções sem executar alterações.
${BASE_RULES}
${VERBOSITY_SUPPRESSION}`,
    tools: ['readFile', 'listWithGlob', 'searchWithGrep', 'mapProject']
  },
  {
    id: 'agent-builder',
    name: 'Agent Builder',
    description: 'Especializado em criar e configurar novos agentes.',
    systemPrompt: `Você é o Agent Builder do OpenKore.
Configuração de agentes e automação de workflows do orquestrador.
${BASE_RULES}
${VERBOSITY_SUPPRESSION}`,
    tools: ['readFile', 'writeFile', 'editFile', 'listWithGlob', 'mapProject']
  }
];

export class AgentRegistry {
  private static instance: AgentRegistry;
  private agents: Map<string, Agent> = new Map();

  private constructor() {
    this.refresh();
  }

  public static getInstance(): AgentRegistry {
    if (!AgentRegistry.instance) {
      AgentRegistry.instance = new AgentRegistry();
    }
    return AgentRegistry.instance;
  }

  public async refresh() {
    this.agents.clear();
    for (const agent of BUILTIN_AGENTS) {
      this.agents.set(agent.id, agent);
    }

    try {
      const files = await readdir(AGENTS_DIR);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = await Bun.file(join(AGENTS_DIR, file)).json();
          this.agents.set(content.id, content);
        }
      }
    } catch (e) {
      // Diretório pode não existir
    }
  }

  public getAgent(id: string): Agent | undefined {
    return this.agents.get(id);
  }

  public getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }
}
