# OpenKore — Arquitetura

## Visão geral

O OpenKore é um monorepo TypeScript com dois pacotes principais que se comunicam via HTTP e SSE — exatamente como o OpenCode. O servidor expõe uma API REST + SSE. O client TUI consome essa API e renderiza a interface no terminal.

```
openkore/
├── packages/
│   ├── server/          # Core engine: agentes, tools, providers, memória
│   └── tui/             # Interface terminal: @opentui/react + @opentui/core (Zig)
├── package.json         # Bun workspaces
└── turbo.json
```

**Runtime:** Bun (não Node). Mais rápido, TypeScript nativo, sem transpilação.  
**Monorepo:** Turborepo para builds e tasks paralelas.  
**TUI:** OpenTUI (@opentui/react) — Renderer nativo em Zig com suporte a Kitty protocol e 60fps.

---

## Stack

| Camada | Tecnologia | Justificativa |
|---|---|---|
| Runtime | Bun | TypeScript nativo, startup < 50ms |
| Monorepo | Turborepo + Bun workspaces | Build incremental, tasks paralelas |
| Server framework | Hono | Leve, SSE nativo, compatível com Bun |
| AI SDK | Vercel AI SDK (`ai`) | Provider-agnostic, streaming nativo, tool calling |
| Providers | OpenRouter + Ollama via AI SDK | Cobertura total de modelos |
| Memória | SQLite via `bun:sqlite` | Zero dependências, embedded, persistente |
| TUI | @opentui/react | Renderer nativo (Zig), 60fps, Yoga Layout |
| Configuração | JSON em `~/.openkore/` | Simples, sem YAML |

---

## Pacote `server`

### Estrutura de arquivos

```
packages/server/src/
├── index.ts                    # Entry point — sobe o servidor Hono
├── app.ts                      # Rotas e middlewares
│
├── agent/
│   ├── agent.ts                # Definição de Agent: config, tools, system prompt
│   ├── registry.ts             # Carrega agentes de .openkore/agents/ + embutidos
│   ├── runner.ts               # Executa um turno: chama AI SDK, despacha eventos SSE
│   └── compaction.ts           # Compacta histórico quando contexto está cheio
│
├── provider/
│   ├── index.ts                # Abstração unificada de provider
│   ├── openrouter.ts           # Integração OpenRouter via AI SDK
│   └── ollama.ts               # Integração Ollama via AI SDK
│
├── tool/
│   ├── registry.ts             # Descobre e registra tools disponíveis
│   ├── bash.ts                 # Executa comandos shell
│   ├── read.ts                 # Lê arquivos
│   ├── write.ts                # Escreve arquivos (com confirmação)
│   ├── edit.ts                 # Edita trecho de arquivo (patch, não overwrite)
│   ├── glob.ts                 # Lista arquivos por padrão glob
│   ├── grep.ts                 # Busca texto/regex em arquivos
│   └── map-project.ts          # Árvore de diretório filtrada (substitui ls cego)
│
├── session/
│   ├── session.ts              # Estado de uma sessão: mensagens, agente, provider
│   ├── store.ts                # Persistência SQLite via bun:sqlite
│   └── memory.ts               # Gerenciamento de contexto com budget de tokens
│
├── config/
│   ├── config.ts               # Lê/escreve ~/.openkore/config.json
│   └── keystore.ts             # Armazena API keys com AES-256-GCM
│
└── api/
    ├── session.ts              # GET /session, POST /session, DELETE /session/:id
    ├── message.ts              # POST /message — envia mensagem, retorna SSE stream
    ├── agent.ts                # GET /agents, POST /agents (criar agente customizado)
    ├── provider.ts             # GET /providers, POST /provider (trocar provider)
    └── health.ts               # GET /health
```

### API REST + SSE

#### `POST /message`
Envia uma mensagem para o agente ativo. Retorna um stream SSE com eventos tipados.

```
POST /message
{ "content": "analisa o UserService", "sessionId": "abc123" }

→ SSE stream:
data: {"type":"tool_start","name":"readFile","input":{"path":"UserService.ts"}}
data: {"type":"tool_result","name":"readFile","output":"...conteúdo...","durationMs":18}
data: {"type":"text","delta":"Encontrei "}
data: {"type":"text","delta":"três problemas"}
data: {"type":"finish","usage":{"inputTokens":1200,"outputTokens":340}}
```

#### Tipos de evento SSE

| type | campos | quando |
|---|---|---|
| `text` | `delta: string` | A cada token gerado |
| `tool_start` | `name`, `input` | Ao iniciar uma tool |
| `tool_result` | `name`, `output`, `durationMs` | Ao concluir uma tool |
| `permission_required` | `id`, `tool`, `input`, `diff?` | Antes de ação destrutiva |
| `finish` | `usage` | Fim do turno |
| `error` | `message` | Qualquer falha |

#### Outros endpoints

```
GET  /health                    → { status: "ok", version: "0.1.0" }
GET  /session                   → sessão atual
POST /session                   → nova sessão
GET  /agents                    → lista de agentes disponíveis
POST /agents                    → cria agente customizado
GET  /providers                 → lista de providers configurados
POST /provider                  → troca provider/modelo ativo
POST /permission/:id            → responde permissão pendente (yes/no/always)
POST /session/compact           → força compactação do histórico
```

### Gerenciamento de contexto (Memory Manager)

O `memory.ts` controla o budget de tokens para nunca exceder o limite do modelo:

**Estratégia de evicção:**
1. Sempre preservar: system prompt + última mensagem do usuário
2. Preservar: últimas 3 tool executions completas (start + result)
3. Preservar: últimas 5 mensagens de chat
4. Truncar: outputs de tools maiores que 3.000 caracteres com aviso de truncamento
5. Se ainda exceder: disparar compactação automática via `compaction.ts`

**Compactação:** quando o histórico acumula mais de 80% do budget, um agente interno (`compaction`) resume as mensagens antigas em um bloco de contexto compacto e descarta as originais. Mesmo padrão do OpenCode.

**Budget por provider:**

```ts
const TOKEN_BUDGET: Record<string, number> = {
  "openrouter": 32_000,   // conservador para compatibilidade com modelos variados
  "ollama": 8_000,        // modelos locais geralmente têm contexto menor
}
```

O budget pode ser sobrescrito por agente no arquivo de configuração.

### Anti-Stall Loop

No `runner.ts`, o loop de execução detecta quando o modelo parou sem completar a tarefa:

- Detectar: modelo emitiu texto conversacional sem tool call quando ainda há trabalho pendente
- Ação: injetar mensagem de sistema `[Sistema: Tarefa ainda não concluída. Qual é o próximo passo?]`
- Limite: máximo 3 reinjeções por turno. Na 4ª, encerrar com evento `error`

### Tool Calling com Confirmação

Tools destrutivas (`write`, `edit`, `bash`) disparam evento `permission_required` antes de executar. O client exibe a caixa de confirmação, o usuário responde via `POST /permission/:id`, e a execução continua ou é cancelada.

---

## Pacote `tui`

### Estrutura de arquivos

```
packages/tui/src/
├── index.tsx                   # Entry point — monta providers e inicializa Ink
├── app.tsx                     # Layout raiz
│
├── context/
│   ├── sdk.tsx                 # HTTP client + SSE stream para o server
│   ├── session.tsx             # Estado reativo da sessão atual
│   ├── agent.tsx               # Agente ativo e lista de agentes
│   └── provider.tsx            # Provider e modelo ativos
│
├── routes/
│   └── session/
│       ├── index.tsx           # Layout da sessão: chat + prompt
│       ├── message-list.tsx    # Lista de mensagens com scroll
│       ├── message.tsx         # Uma mensagem (user ou assistant)
│       ├── tool-call.tsx       # Bloco de tool: nome, input, resultado, duração
│       └── permission-box.tsx  # Caixa de confirmação com diff
│
├── components/
│   ├── status-bar.tsx          # Topo: nome do app, agente ativo, modelo
│   ├── input.tsx               # Campo de entrada com histórico e autocomplete
│   ├── spinner.tsx             # Indicador de loading durante tool execution
│   └── help.tsx                # Overlay de ajuda (tecla ?)
│
└── hooks/
    ├── use-sse.ts              # Consome SSE do server, despacha eventos tipados
    └── use-permission.ts       # Gerencia estado de permissão pendente
```

### Layout visual

```
┌─ status bar ──────────────────────────────────────────────────────────────┐
│ openkore                                    backend · qwen3-coder  ●      │
├─ message list (scrollável) ────────────────────────────────────────────────┤
│                                                                            │
│  › analisa o UserService                                                   │
│                                                                            │
│    ✓ mapProject .                                               120ms      │
│    ✓ readFile src/service/UserService.ts                         18ms      │
│   ─────────────────────────────────────────────────────────────────────   │
│    Encontrei três problemas...                                             │
│                                                                            │
├─ input ────────────────────────────────────────────────────────────────────┤
│  › _                                          Tab: agente  ?: ajuda        │
└────────────────────────────────────────────────────────────────────────────┘
```

### Paleta de cores (verde como base)

| Elemento | Cor |
|---|---|
| Prompt `›` e elementos ativos | `#4ade80` (verde) |
| Tool name | `#4ade80` |
| Tool path/args | `#6b7280` |
| Tool duration | `#374151` |
| Separador após tools | `#1f2937` |
| Texto da resposta | `#e5e7eb` |
| Texto secundário | `#9ca3af` |
| Diff add `+` | `#4ade80` |
| Diff remove `-` | `#f87171` |
| Status bar background | `#111827` |

### Streaming em tempo real

O hook `use-sse.ts` consome o stream SSE e despacha cada evento individualmente via `useState` — sem acumular. O componente `message.tsx` re-renderiza a cada evento `text` recebido, produzindo o efeito de digitação em tempo real.

---

## Sistema de Agentes

### Agentes embutidos

Definidos em `packages/server/src/agent/builtin/`:

**`backend`** — Agente padrão para desenvolvimento backend. Tools disponíveis: todas. System prompt com expertise em APIs, bancos de dados, arquitetura.

**`frontend`** — Especializado em UI, CSS, componentes, acessibilidade. Mesmo conjunto de tools do backend.

**`plan`** — Modo somente leitura. Tools disponíveis: `read`, `glob`, `grep`, `map-project`. Sem `write`, `edit` nem `bash`. Ideal para explorar código sem alterar nada.

**`agent-builder`** — Agente especializado em criar outros agentes. Ver seção abaixo.

### Agentes personalizados

Cada projeto pode ter seus próprios agentes em `.openkore/agents/`. Dois formatos suportados:

**YAML** (simples):
```yaml
# .openkore/agents/my-agent.yaml
name: my-agent
description: Especialista em meu domínio específico
model: qwen/qwen3-coder:free       # opcional, sobrescreve o default
tools:
  - read
  - write
  - bash
  - glob
  - grep
system: |
  Você é um especialista em...
  Regras de comportamento:
  - Sempre leia o código antes de sugerir mudanças
  - ...
```

**TypeScript** (avançado, com lógica):
```ts
// .openkore/agents/my-agent.ts
import { defineAgent } from "openkore/agent"

export default defineAgent({
  name: "my-agent",
  description: "Especialista em meu domínio",
  tools: ["read", "write", "bash"],
  system: async (ctx) => {
    // system prompt dinâmico baseado no contexto do projeto
    return `Você está trabalhando em ${ctx.projectName}...`
  }
})
```

### Agent Builder

O agente `agent-builder` é um agente especializado em ajudar o desenvolvedor a criar agentes personalizados para o seu contexto. Quando invocado, ele:

1. Pergunta sobre o domínio e objetivo do novo agente
2. Lê o código do projeto para entender o contexto
3. Sugere um nome, descrição, tools necessárias e system prompt
4. Escreve o arquivo `.openkore/agents/<nome>.yaml` com confirmação
5. Registra o agente no registry sem precisar reiniciar

**Usar o agent-builder:**
```
Tab → agent-builder
› cria um agente especialista em testes para o meu projeto
```

---

## Configuração

Toda configuração fica em `~/.openkore/config.json`:

```json
{
  "provider": "openrouter",
  "model": "qwen/qwen3-coder:free",
  "theme": "dark",
  "defaultAgent": "backend"
}
```

API keys em `~/.openkore/keys.enc` — criptografadas com AES-256-GCM, derivadas de senha mestre no primeiro boot.

**Primeiro boot:** wizard interativo no terminal que pede provider, API key e modelo. Sem editar arquivos manualmente.

---

## Distribuição

```bash
# Instalar globalmente
npm install -g openkore

# Ou via bun
bun install -g openkore
```

O pacote npm inclui o binário compilado (`bun build --compile`). Startup < 50ms. Sem necessidade de runtime separado.