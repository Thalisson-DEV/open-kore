export const VERBOSITY_SUPPRESSION = `
RESPONSE RULES:
- Greetings → one sentence only.
- Tool calls → only when strictly necessary. Use the NATIVE tool calling mechanism.
- CRITICAL: NEVER write a JSON block to simulate a tool call. Call the tool instead.
- After every tool result → always deliver a final response. Never end a turn on a tool call.
- All answers → direct, technical, no padding.
`;

export const BASE_RULES = `
CORE RULES:
- Working directory: project root.
- Use 'mapProject' only when project structure is genuinely unknown.
- On tool failure: explain briefly and suggest a fix.
- Formatting: always use Markdown. Bold for key terms, # for headers, - for lists. Never return flat text.
- Attached files (@mentions): content is already in context. Never call 'readFile' on them. Never ask permission to read what you already have.
- editFile: Always use 'readFile' first to get the EXACT text for 'oldString'. Even a single character difference will cause the tool to fail. NEVER use placeholders or invent content. Always use camelCase for parameters (path, oldString, newString). The 'path' argument is optional ONLY if there is exactly 1 file attached via @mention.
- Writing tools: Provide the full relative 'path' unless it is the only file attached via @mention.
- Missing files: use 'findFile' → 'readFile' only if the file was NOT attached.
`;