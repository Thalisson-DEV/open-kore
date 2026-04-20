# OpenKore — Plano de Desenvolvimento

## Premissas

- Runtime: **Bun** (não Node)
- Monorepo: **Turborepo + Bun workspaces**
- Servidor: **Hono** (leve, SSE nativo)
- AI SDK: **Vercel AI SDK** (provider-agnostic, streaming, tool calling)
- TUI: **Ink + React**
- Banco: **SQLite via `bun:sqlite` (Arquitetura Serverless de Estado)**
- Providers: **OpenRouter** e **Ollama** — somente esses dois no Alpha
- Design Pattern da IA: **Tool Calling Estrito (Sem Verbosidade)** e **Model Tiering**.

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

## Fase 3 — Tools, Agentes e Roteamento Autônomo

**Estado ao final:** agente lê arquivos, injeta regras dinâmicas, utiliza roteamento de modelos e executa loops autônomos de ferramentas sem intervenção manual.

### 3.1 — Tools básicas de I/O
- [x] Criar `tool/read.ts` — lê arquivo, retorna conteúdo
- [x] Criar `tool/write.ts` — escreve arquivo (dispara `permission_required`)
- [x] Criar `tool/edit.ts` — edita trecho (patch, não overwrite)
- [x] Criar `tool/bash.ts` — executa comando shell (dispara `permission_required`)
- [x] Criar `tool/glob.ts` — lista arquivos por padrão glob
- [x] Criar `tool/grep.ts` — busca regex em arquivos
- [x] Criar `tool/map-project.ts` — árvore de diretório filtrada, máx 200 linhas

### 3.2 — Tool Registry e ReAct Loop (Vercel SDK)
- [x] Criar `tool/registry.ts` — mapeia nome de tool → implementação.
- [x] Integrar tools no `streamText` do AI SDK configurando `maxSteps: 5` (ou configurável) para permitir o loop autônomo ReAct (a IA pensa, chama a tool, analisa o resultado e chama outra sem parar o stream).
- [x] Criar `agent/system-prompt.ts` focado em Supressão de Verbosidade: *"Return ONLY tool calls. NO conversational filler. NO markdown formatting unless explicitly requested."*

### 3.3 — Confirmação de tools destrutivas
- [x] Evento SSE `permission_required` com `id`, `tool`, `input`, `diff`
- [x] Criar `POST /permission/:id` — resolve `yes`, `no`, `always`
- [x] `PermissionBox` na TUI — diff colorido, `yes/no/always`, bloqueia input e pausa o loop do `maxSteps`.

### 3.4 — Sistema de Agentes e Model Tiering
- [x] Criar `agent/agent.ts` — definição de agente: nome, tools, system prompt base.
- [x] Implementar **Model Tiering**: usar modelo Tier 1 (ex: Llama 3 8B / Haiku) para classificar comandos e delegar ferramentas de leitura; invocar Tier 2 (ex: Claude 3.5 Sonnet / GPT-4o) apenas para edição de código ou abstrações complexas.
- [x] Criar `agent/registry.ts` — carrega agentes embutidos + `.openkore/agents/`
- [x] **Injeção Dinâmica (RAG Local):** Ao iniciar o agente, buscar `.kore/rules.md` ou `.kore/context.md` no diretório atual (PWD) e acoplar ao System Prompt temporariamente para reforçar padrões daquele escopo.

**Verificação:** `Tab` troca para `plan`, agente usa Tier 1 para injetar regras locais, executa 3 tools seguidas via `maxSteps` (ex: map-project, read arquivo A, read arquivo B) e devolve a resposta final sem tagarelar.

---

## Fase 4 — Memória e Orquestração Robusta via SQLite

**Estado ao final:** contexto híbrido garante que o limite de tokens nunca estoure, resumos acontecem em background e o cache estrito reduz chamadas redundantes de I/O.

### 4.1 — Persistência SQLite Avançada
- [ ] Criar `session/store.ts` com `bun:sqlite`
- [ ] Tabela `sessions` — id, project_path (PWD atuando como isolador de contexto), agente, created_at
- [ ] Tabela `messages` — id, session_id, role, content, **token_count** (vital para métricas), created_at
- [ ] Tabela `summaries` — id, session_id, condensed_context, last_message_id (Armazena a memória de longo prazo compactada).

### 4.2 — Memory Manager (Sliding Window Híbrida)
- [ ] Criar `session/memory.ts` com montagem de payload em 4 blocos: `[System/Rules] + [SQLite Summary] + [Últimas N Interações] + [Novo Comando]`.
- [ ] Calcular tokens inserindo o tamanho na tabela `messages`.
- [ ] Truncar outputs de tools (ex: ler arquivos gigantes) acima de 3.000 chars com aviso de `[OUTPUT_TRUNCATED]`.
- [ ] Budget configurável por provider (default: 32k OpenRouter, 8k Ollama).

### 4.3 — Compactação Assíncrona (Tier 1)
- [ ] Criar `agent/compaction.ts`
- [ ] Disparo automático quando o histórico da janela deslizante > 80% do budget estabelecido.
- [ ] Utilizar exclusivamente o modelo Tier 1 (mais barato/rápido) em background para ler as mensagens e atualizar a tabela `summaries`.
- [ ] Descartar logs da tabela `messages` que já foram sumarizados para limpar o banco.

### 4.4 — Tool Caching Inteligente e Anti-Stall
- [ ] Criar `agent/tool-guard.ts` com integração ao SQLite.
- [ ] **Cache de I/O:** Se a IA pedir para ler (`tool/read`) um arquivo e o `fs.stat` (timestamp de modificação) for o mesmo da última leitura neste turno/sessão, retornar do cache do SQLite em vez de recarregar o disco e enviar novamente pro prompt.
- [ ] Anti-Stall: No `agent/runner.ts`, detectar parada prematura do `maxSteps`. Injetar `[Sistema: Tarefa pendente. Qual o próximo passo?]`. Encerrar na 4ª tentativa.

**Verificação:** sessão longa não eleva custo linearmente; arquivo estático lido duas vezes consome 0 tokens na segunda chamada; orquestração via banco não impacta performance da UI.

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

**Verificação:** pedir para o `agent-builder` criar um agente especialista, confirmar criação do YAML, trocar para o novo agente com `Tab` sem perder a sessão atual.

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
- [ ] Roteamento Tier 1 e Tier 2 rodando conforme complexidade.
- [ ] `POST /message` emite tokens em SSE com suporte a múltiplos steps (`maxSteps`).
- [ ] Tool calling funciona nativamente com deduplicação de chamadas (Tool Guard).
- [ ] Confirmação de tools destrutivas via `POST /permission/:id` pausando o stream corretamente.
- [ ] Memória orquestrada via SQLite + Sliding Window com compactação em background.
- [ ] Anti-stall não deixa modelo travado em loops vazios.
- [ ] Sessões persistem isoladas pelo diretório de trabalho atual (PWD).
- [ ] API keys criptografadas em disco via `keystore.ts`.

### TUI
- [ ] Tokens aparecem progressivamente (efeito máquina de escrever).
- [ ] Supressão de verbosidade ativada (IA foca nas tools, sem filler text).
- [ ] `Tab` troca entre agentes perfeitamente.
- [ ] Tools aparecem inline com tempo real de execução.
- [ ] `PermissionBox` bloqueia a tela com diff verde/vermelho claro.
- [ ] Status bar verde no topo.
- [ ] Scroll automático responsivo durante o streaming intenso do AI SDK.
- [ ] `Ctrl+C` encerra e limpa recursos adequadamente.

### Agent Builder
- [ ] Cria arquivo YAML injetável em `.openkore/agents/`
- [ ] Novo agente carrega automaticamente (Hot Reload).
- [ ] System prompt dinâmico obedece regras injetadas por `.kore/rules.md`.