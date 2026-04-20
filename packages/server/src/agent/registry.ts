import { Agent } from './agent';
import { join } from 'path';
import { homedir } from 'os';
import { readdir } from 'node:fs/promises';

const AGENTS_DIR = join(homedir(), '.openkore', 'agents');

const BUILTIN_AGENTS: Agent[] = [
  {
    id: 'backend',
    name: 'Backend Engineer',
    description: 'Especialista em arquitetura, lógica de servidor e infraestrutura.',
    systemPrompt: `Você é o OpenKore Backend Engineer. 
Especialista em TypeScript, Node.js e arquitetura de sistemas.
Sua missão é implementar lógica robusta e escalável.
REGRAS:
1. Sempre verifique a estrutura com 'mapProject'.
2. Siga padrões Clean Code e SOLID.`,
    tools: ['readFile', 'writeFile', 'editFile', 'executeBash', 'listWithGlob', 'searchWithGrep', 'mapProject']
  },
  {
    id: 'frontend',
    name: 'Frontend Engineer',
    description: 'Especialista em interfaces, React e UX/UI.',
    systemPrompt: `Você é o OpenKore Frontend Engineer.
Especialista em React, Ink e design de interfaces via terminal.
Foque em criar experiências fluidas e visualmente atraentes.`,
    tools: ['readFile', 'writeFile', 'editFile', 'listWithGlob', 'mapProject']
  },
  {
    id: 'plan',
    name: 'Architect & Planner',
    description: 'Agente de análise e planejamento. Não faz alterações destrutivas.',
    systemPrompt: `Você é o OpenKore Architect.
Sua função é analisar requisitos e criar planos de ação detalhados.
Você NÃO deve fazer alterações no código, apenas ler e propor soluções.`,
    tools: ['readFile', 'listWithGlob', 'searchWithGrep', 'mapProject']
  },
  {
    id: 'agent-builder',
    name: 'Agent Builder',
    description: 'Especializado em criar e configurar novos agentes.',
    systemPrompt: `Você é o Agent Builder do OpenKore.
Sua missão é ajudar o usuário a configurar novos agentes e ajustar os existentes.`,
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
