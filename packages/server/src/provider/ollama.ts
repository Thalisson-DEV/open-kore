import { createOllama } from 'ai-sdk-ollama';

export function getOllamaInstance() {
  return createOllama({
    baseURL: 'http://localhost:11434', // Removido o /api para evitar 404
  });
}

/**
 * Lista modelos instalados localmente no Ollama via API
 */
export async function listOllamaModels() {
  try {
    const response = await fetch('http://localhost:11434/api/tags');
    if (!response.ok) return [];
    
    const data = await response.json() as { models: Array<{ name: string }> };
    return data.models.map(m => m.name);
  } catch (e) {
    return [];
  }
}
