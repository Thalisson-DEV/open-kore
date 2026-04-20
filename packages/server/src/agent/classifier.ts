import { generateText } from 'ai';

export type Intent = 'READ_ONLY' | 'WRITE_COMPLEX' | 'GREETING';

export async function classifyIntent(model: any, prompt: string): Promise<Intent> {
  const classificationPrompt = `
Classify the user intent into one of these three categories:
- GREETING: Simple greetings like "oi", "ola", "hello", "bom dia".
- READ_ONLY: Requests that only involve reading files, listing directories, or analyzing code without changes (e.g., "mapeie o projeto", "leia o arquivo X", "onde esta a classe Y?").
- WRITE_COMPLEX: Requests that involve creating/editing files, running bash commands, or complex architectural reasoning.

USER PROMPT: "${prompt}"

Respond ONLY with the category name.
`;

  try {
    const { text } = await generateText({
      model: model,
      prompt: classificationPrompt,
    });

    const result = text.trim().toUpperCase();
    if (result.includes('GREETING')) return 'GREETING';
    if (result.includes('WRITE_COMPLEX')) return 'WRITE_COMPLEX';
    return 'READ_ONLY';
  } catch (e) {
    return 'WRITE_COMPLEX'; // Fallback seguro
  }
}
