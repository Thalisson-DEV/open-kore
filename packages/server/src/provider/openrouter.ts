import { createOpenAI } from '@ai-sdk/openai';
import { Keystore } from '../config/keystore';

export async function getOpenRouterInstance(masterPassword?: string) {
  if (!masterPassword) {
    throw new Error('Master password required to access API keys');
  }

  const keystore = new Keystore(masterPassword);
  const apiKey = await keystore.getKey('openrouter');

  if (!apiKey) {
    throw new Error('OpenRouter API Key not found in keystore');
  }

  return createOpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey,
  });
}
