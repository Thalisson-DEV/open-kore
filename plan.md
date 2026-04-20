# OpenKore — Plano de Desenvolvimento

## Premissas

- Runtime: **Bun** (não Node)
- Monorepo: **Turborepo + Bun workspaces**
- Servidor: **Hono** (leve, SSE nativo)
- AI SDK: **Vercel AI SDK** (provider-agnostic, streaming, tool calling)
- TUI: **Ink + React**
- Banco: **SQLite via `bun:sqlite`**
- Providers: **OpenRouter** e **Ollama** — somente esses dois no Alpha

Qualquer dúvida de implementação: consultar `ARCHITECTURE.md`.

---

## Fase 1 — Fundação do Monorepo

**Estado ao final:** repositório estruturado, servidor Hono respondendo `/health`, TUI abrindo no terminal com status bar verde.

### 1.1 — Setup do monorepo
- [x] Criar `package.json` raiz com `bun workspaces: ["packages/*"]`
- [x] Criar `turbo.json` com tasks `dev`, `build`, `typecheck`
- [x] Criar `packages/server/` e `packages/tui/` com seus `package.json`
- [x] Configurar `tsconfig.json` em cada pacote
- [x] Criar script `bin/openkore.ts` que spawna o server e inicia a TUI
- [x] Adicionar dependências: `hono`, `ai`, `ink`, `react`, `@ai-sdk/openai`, `@ai-sdk/ollama`

### 1.2 — Servidor mínimo
- [x] Criar `packages/server/src/index.ts` com Hono
- [x] Implementar `GET /health` → `{ status: "ok", version: "0.1.0" }`
- [x] Implementar `GET /session` → estado inicial da sessão
- [x] Servidor sobe em porta `8080` com log mínimo

### 1.3 — Configuração e keystore
- [x] Criar `config.ts` — lê/escreve `~/.openkore/config.json`
- [x] Criar `keystore.ts` — AES-256-GCM para API keys em `~/.openkore/keys.enc`
- [x] Wizard de primeiro boot: detectar se config existe, se não, perguntar provider + API key + modelo

### 1.4 — TUI mínima
- [x] Avaliar a documentação @interface.md e realizar as implementações contidas lá.

**Verificação:** `bun run dev` abre a TUI com status bar verde e input funcionando.

---

## Fase 2 — Providers e AI SDK

**Estado ao final:** enviar mensagem, receber resposta em streaming via OpenRouter ou Ollama.

### 2.1 — Provider OpenRouter
- [x] Criar `packages/server/src/provider/openrouter.ts`
- [x] Usar `@ai-sdk/openai` com `baseURL: "https://openrouter.ai/api/v1"`
- [x] `POST /provider` para trocar provider/modelo em runtime

### 2.2 — Provider Ollama
- [x] Criar `packages/server/src/provider/ollama.ts`
- [x] Usar `@ai-sdk/ollama` com `baseURL: "http://localhost:11434/api"`
- [x] Detectar automaticamente modelos disponíveis via `ollama list`

### 2.3 — Endpoint de mensagem com SSE
- [x] Criar `POST /message` em Hono com resposta SSE
- [x] Usar `streamText` do Vercel AI SDK
- [x] Emitir eventos tipados: `text`, `finish`, `error`
- [x] **Sem tool calling ainda** — só texto

### 2.4 — Streaming na TUI
- [x] Criar `use-sse.ts` — consome SSE via `fetch` + `ReadableStream`, despacha evento por evento
- [x] Criar `Message` component — renderiza texto conforme tokens chegam
- [x] Criar `MessageList` — lista de mensagens com scroll automático
- [x] Integrar no `index.tsx`: submit do input → POST /message → SSE → re-render por token

**Verificação:** enviar "oi" via OpenRouter, texto aparece token por token na TUI.

---

## Fase 3 — Tools e Agentes

**Estado ao final:** agente lê arquivos, mapeia o projeto, executa comandos com confirmação.

### 3.1 — Tools básicas
- [x] Criar `tool/read.ts` — lê arquivo, retorna conteúdo
- [x] Criar `tool/write.ts` — escreve arquivo (dispara `permission_required`)
- [x] Criar `tool/edit.ts` — edita trecho (patch, não overwrite)
- [x] Criar `tool/bash.ts` — executa comando shell (dispara `permission_required`)
- [x] Criar `tool/glob.ts` — lista arquivos por padrão glob
- [x] Criar `tool/grep.ts` — busca regex em arquivos
- [x] Criar `tool/map-project.ts` — árvore de diretório filtrada, máx 200 linhas

### 3.2 — Tool registry
- [ ] Criar `tool/registry.ts` — mapeia nome de tool → implementação
- [ ] Integrar tools no `streamText` via parâmetro `tools` do AI SDK

### 3.3 — Confirmação de tools destrutivas
- [ ] Evento SSE `permission_required` com `id`, `tool`, `input`, `diff`
- [ ] Criar `POST /permission/:id` — resolve `yes`, `no`, `always`
- [ ] `PermissionBox` na TUI — diff colorido, `yes/no/always`, bloqueia input

### 3.4 — Sistema de agentes
- [ ] Criar `agent/agent.ts` — definição de agente: nome, tools, system prompt, modelo
- [ ] Criar `agent/registry.ts` — carrega agentes embutidos + `.openkore/agents/`
- [ ] Agentes embutidos: `backend`, `frontend`, `plan`, `agent-builder`
- [ ] `Tab` na TUI alterna entre agentes disponíveis
- [ ] `GET /agents` retorna lista, `POST /agent` troca agente ativo

**Verificação:** `Tab` troca para `plan`, agente lê arquivo sem oferecer escrita. Agente `backend` mapeia projeto e lê arquivos corretamente.

---

## Fase 4 — Memória e Orquestração Robusta

**Estado ao final:** contexto nunca estoura, modelo local não trava, histórico persiste entre sessões.

### 4.1 — Persistência SQLite
- [ ] Criar `session/store.ts` com `bun:sqlite`
- [ ] Tabela `sessions` — id, agente, provider, modelo, created_at
- [ ] Tabela `messages` — id, session_id, role, content, tokens, created_at
- [ ] `session/session.ts` — carrega/salva sessão, filtra por session_id (sem vazar entre sessões)

### 4.2 — Memory manager com budget de tokens
- [ ] Criar `session/memory.ts`
- [ ] Estratégia de evicção: system prompt + últimas 3 tool executions + últimas 5 mensagens
- [ ] Truncar outputs de tools acima de 3.000 chars com aviso
- [ ] Budget configurável por provider (default: 32k OpenRouter, 8k Ollama)

### 4.3 — Compactação automática
- [ ] Criar `agent/compaction.ts`
- [ ] Detectar quando histórico > 80% do budget
- [ ] Agente interno resume mensagens antigas em bloco compacto
- [ ] Descartar mensagens originais após compactação

### 4.4 — Anti-Stall Loop
- [ ] No `agent/runner.ts`, detectar parada prematura (texto sem tool call com tarefa pendente)
- [ ] Injetar: `[Sistema: Tarefa ainda não concluída. Qual é o próximo passo?]`
- [ ] Máximo 3 reinjeções por turno — na 4ª, encerrar com evento `error`

### 4.5 — Tool Call Deduplication
- [ ] Criar `agent/tool-guard.ts` — cache por session_id, não por thread
- [ ] Detectar chamadas duplicadas de tool com mesmos args no mesmo turno
- [ ] Retornar resultado cacheado com aviso `[DUPLICATE_CALL_BLOCKED]`
- [ ] Limpar cache no início de cada turno

**Verificação:** sessão com 20 turnos não estoura contexto. Enviar "oi" para modelo Ollama não gera 1M tokens.

---

## Fase 5 — Agent Builder

**Estado ao final:** agente cria outros agentes no seu projeto via conversa.

### 5.1 — Agent Builder
- [ ] Criar agente embutido `agent-builder` com system prompt especializado
- [ ] O agente entende o contexto do projeto lendo `package.json`, estrutura de pastas, etc.
- [ ] Gera arquivo `.openkore/agents/<nome>.yaml` via tool `write` com confirmação
- [ ] Após criar, registra o agente no registry sem reiniciar o servidor
- [ ] `GET /agents` reflete o novo agente imediatamente

### 5.2 — Hot reload de agentes
- [ ] Observar mudanças em `.openkore/agents/` com `fs.watch`
- [ ] Recarregar registry ao detectar novo arquivo ou modificação
- [ ] TUI atualiza lista de agentes disponíveis no `Tab` sem restart

**Verificação:** pedir para o `agent-builder` criar um agente especialista em testes, confirmar criação do arquivo, trocar para o novo agente com `Tab`.

---

## Fase 6 — Distribuição

**Estado ao final:** `npm install -g openkore` funciona, comando `openkore` disponível globalmente.

### 6.1 — Build do binário
- [ ] Usar `bun build --compile` para gerar binário único autossuficiente
- [ ] Script de build em `turbo.json` que gera binário para Linux, macOS (Intel + ARM)
- [ ] Startup < 50ms verificado

### 6.2 — Publicação npm
- [ ] `packages/server/package.json` e `packages/tui/package.json` com `private: true`
- [ ] Pacote raiz `openkore` com `bin: { openkore: "./dist/openkore" }`
- [ ] `README.md` com instruções de instalação e uso

---

## Checklist final

### Servidor
- [ ] `GET /health` responde em < 50ms
- [ ] `POST /message` emite tokens em SSE em tempo real
- [ ] Tool calling funciona: `read`, `write`, `edit`, `bash`, `glob`, `grep`, `map-project`
- [ ] Confirmação de tools destrutivas via `POST /permission/:id`
- [ ] Memória não excede budget — nunca mais erro 400 de contexto excedido
- [ ] Anti-stall não deixa modelo travado por mais de 3 ciclos
- [ ] Sessões persistem entre restarts
- [ ] API keys criptografadas em disco

### TUI
- [ ] Tokens aparecem progressivamente — efeito de digitação real
- [ ] `Tab` troca entre agentes
- [ ] Tools aparecem inline com tempo de execução
- [ ] `PermissionBox` com diff verde/vermelho e `yes/no/always`
- [ ] Status bar verde no topo
- [ ] Scroll automático durante streaming
- [ ] `Ctrl+C` limpo

### Agent Builder
- [ ] Cria arquivo YAML em `.openkore/agents/`
- [ ] Novo agente disponível via `Tab` sem restart
- [ ] System prompt gerado é coerente com o contexto do projeto