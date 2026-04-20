export interface Agent {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  tools: string[]; // Nomes das ferramentas permitidas (ex: 'readFile', 'writeFile')
  model?: string;   // Modelo específico (opcional)
}
