# OpenKore — Especificação de Interface TUI

> Design técnico e visual da interface de linha de comando para o sistema de orquestração OpenKore.
> Inspirado na arquitetura do OpenCode (SST), com foco em micro-iterações, feedback em tempo real e navegação de teclado.

---

## Índice

1. [Filosofia de Design](#filosofia-de-design)
2. [Paleta de Cores e Tokens Visuais](#paleta-de-cores-e-tokens-visuais)
3. [Arquitetura da Interface](#arquitetura-da-interface)
4. [Tela Inicial (Home)](#tela-inicial-home)
5. [Interface de Chat e Orquestração](#interface-de-chat-e-orquestração)
6. [Micro-iterações e Loop de Agente](#micro-iterações-e-loop-de-agente)
7. [Sidebar de Contexto e Metadados](#sidebar-de-contexto-e-metadados)
8. [Sistema de Comandos e Paleta](#sistema-de-comandos-e-paleta)
9. [Atalhos de Teclado (Keybinds)](#atalhos-de-teclado-keybinds)
10. [Componentes e Interações](#componentes-e-interações)
11. [Barra de Status Global](#barra-de-status-global)
12. [Temas e Personalização](#temas-e-personalização)

---

## Filosofia de Design

A TUI do OpenKore segue três princípios centrais:

**Thin-client, heavy-backend.** A interface renderiza estado e captura input. Toda lógica de orquestração, sessão e contexto reside no servidor. A TUI comunica via REST + SSE (Server-Sent Events) e nunca bloqueia em IO.

**Micro-iterações visíveis.** Cada passo do raciocínio do agente é uma unidade renderizável. O usuário vê o progresso acontecendo — não uma tela em branco seguida de uma resposta. Cada ferramenta invocada, arquivo lido, comando executado é exibido inline com duração e status.

**Teclado-first.** Mouse é suportado (captura opcional), mas todos os fluxos críticos possuem keybind. O sistema usa leader key (`Ctrl+X`) para sequências compostas, inspirado no modelo do OpenCode.

---

## Paleta de Cores e Tokens Visuais

```
TOKEN                    VALOR HEX    ANSI     USO
─────────────────────────────────────────────────────────────────────
--color-accent           #7a9e7a      —        Bordas ativas, logo, labels, cursor
--color-accent-dim       #405140      —        Itens de thinking, bordas idle
--color-bg               #0A0A0A      —        Fundo global
--color-bg-panel         #111111      —        Painéis elevados
--color-fg               #E0E0E0      —        Texto principal
--color-fg-dim           #666666      —        Texto secundário, placeholders
--color-fg-muted         #3A3A3A      —        Separadores, guides
--color-success          #3FB950      32       Status OK, checkmarks
--color-warning          #D29922      33       Avisos, tokens próx. do limite
--color-error            #F85149      31       Erros, falhas de ferramenta
--color-info             #58A6FF      34       Info, links, refs de arquivo
--color-diff-add         #1C361C      —        Background de linhas adicionadas
--color-diff-rem         #3A1A1A      —        Background de linhas removidas
```

**Spinners e animadores:** `⠋ ⠙ ⠹ ⠸ ⠼ ⠴ ⠦ ⠧ ⠇ ⠏` (Braille, 80ms/frame)

**Ícones de estado:**
```
🟢  Sistema online / agente respondendo
🟡  Requisição em andamento / aguardando
🔴  Erro / agente falhou
⚙️  Processamento em background
📎  Arquivo referenciado
🔧  Ferramenta sendo executada
✓   Etapa concluída
✗   Etapa falhou
```

---

## Arquitetura da Interface

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          HEADER  (sessão + modelo)                       │
├──────────────────────────────────────────────────────────────────────┬───┤
│                                                                      │   │
│                     PAINEL PRINCIPAL (chat)                          │ S │
│                                                                      │ I │
│   ┌─ mensagens ────────────────────────────────────────────────────┐ │ D │
│   │  [Usuário]  →  [Agente pensando...]  →  [OpenKore resposta]   │ │ E │
│   │  ↳ micro-iterações inline (tools, diffs, comandos)            │ │ B │
│   └────────────────────────────────────────────────────────────────┘ │ A │
│                                                                      │ R │
│   ┌─ input ────────────────────────────────────────────────────────┐ │   │
│   │ > _                                                            │ │   │
│   └────────────────────────────────────────────────────────────────┘ │   │
├──────────────────────────────────────────────────────────────────────┴───┤
│                       STATUS BAR (global)                                │
└──────────────────────────────────────────────────────────────────────────┘
```

A sidebar é **colapsável** (`Ctrl+X B`) e se adapta à largura do terminal. Em terminais < 100 colunas, colapsa automaticamente.

---

## Tela Inicial (Home)

Ponto de entrada minimalista. Logo em ASCII art centralizada, input pronto, modo e modelo exibidos abaixo.

```
                  ██████╗ ██████╗ ███████╗███╗   ██╗██╗  ██╗ ██████╗ ██████╗ ███████╗
                 ██╔═══██╗██╔══██╗██╔════╝████╗  ██║██║ ██╔╝██╔═══██╗██╔══██╗██╔════╝
                 ██║   ██║██████╔╝█████╗  ██╔██╗ ██║█████╔╝ ██║   ██║██████╔╝█████╗
                 ██║   ██║██╔═══╝ ██╔══╝  ██║╚██╗██║██╔═██╗ ██║   ██║██╔══██╗██╔══╝
                 ╚██████╔╝██║     ███████╗██║ ╚████║██║  ██╗╚██████╔╝██║  ██║███████╗
                  ╚═════╝ ╚═╝     ╚══════╝╚═╝  ╚═══╝╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝

                                  [ Orchestrating Intelligence ]


                       ╭──────────────────────────────────────────────────╮
                       │ > Inicie uma tarefa ou digite um comando...      │
                       ╰──────────────────────────────────────────────────╯

                             [Modo: Orquestrador]  ·  [Modelo: Kore-Alpha]

                              @ Referenciar arquivo    ! Executar shell
                              / Comandos               Ctrl+X H Ajuda
```

**Comportamento:**
- Input com borda `--color-fg-muted` em idle; transita para `--color-accent` ao digitar
- `@palavra` → fuzzy search de arquivos no workspace (inline, sem abrir modal)
- `!comando` → executa shell; saída aparece como bloco de ferramenta no chat
- `/comando` → aciona palette de comandos filtrada pelo que foi digitado
- `Enter` → transição limpa para Interface de Chat

---

## Interface de Chat e Orquestração

Layout split-pane. Painel principal à esquerda, sidebar de metadados à direita.

```
╭──────────────────────────────────────────────────────────────────────┬────────────────────────────╮
│ ● OpenKore  SIPEL-CES  claude-kore-alpha                             │                            │
├──────────────────────────────────────────────────────────────────────┤  ⚙ CONTEXTO DA SESSÃO      │
│                                                                      │ ──────────────────         │
│ [Usuário]  14:32                                                     │ Tokens:  14.520 / 120k     │
│ Inicie a estruturação do módulo C.E.S. e gere a documentação.        │ Uso:  12%  [██░░░░░░░░]    │
│                                                                      │ Custo:  $0.024             │
│ [OpenKore]  ⠹ pensando...                                            │ Sessão: #a3f2              │
│                                                                      │                            │
│   ┌─ 🔧 tool: read_file ──────────────────────────── 120ms ✓ ──────┐ │ 🤖 AGENTES ATIVOS          │
│   │  src/ces/module.ts, src/ces/interfaces/IStrategy.ts            │ │ ──────────────────         │
│   └────────────────────────────────────────────────────────────────┘ │ ⠹ Arquiteto    45%         │
│                                                                      │ ○  Revisor      0%         │
│   ┌─ 🔧 tool: bash ─────────────────────────────────  45ms ✓ ──────┐ │ ⠸ Engenheiro   15%         │
│   │  $ find src/ces -name "*.ts" | head -20                        │ │                            │
│   │  src/ces/index.ts                                              │ │ 📎 ARQUIVOS TOCADOS         │
│   │  src/ces/module.ts                                             │ │ ──────────────────         │
│   │  src/ces/strategy/BaseStrategy.ts                              │ │ src/ces/module.ts     ~    │
│   └────────────────────────────────────────────────────────────────┘ │ src/ces/index.ts      +    │
│                                                                      │ docs/CES_MODULE.md    +    │
│   ┌─ 🔧 tool: write_file ─────────────────────────── 230ms ✓ ──────┐ │                            │
│   │  📄 src/ces/module.ts  (+42 linhas, -8 linhas)                 │ │ 💡 DICAS                   │
│   │  ──────────────────────────────────────────────                │ │ ──────────────────         │
│   │  + export class CESModule implements IStrategy {               │ │ @ arquivo p/ incluir       │
│   │  +   private readonly context: SessionContext;                 │ │ ! shell inline             │
│   │  +   constructor(ctx: SessionContext) {                        │ │ /diff ver mudanças         │
│   │  -   // TODO: implementar                                      │ │ Ctrl+C parar agente        │
│   │  └────────────────────────────────────────────────────────────┘ │                            │
│                                                                      │                            │
│ A estrutura preliminar foi criada. A documentação está sendo         │                            │
│ gerada em background. O padrão adotado separa responsabilidades      │                            │
│ nos serviços estratégicos do C.E.S.                                  │                            │
│                                                                      │                            │
│ Gostaria de revisar os contratos de API antes de continuar?          │                            │
│                                                                      │                            │
│ ╭──────────────────────────────────────────────────────────────────╮ │                            │
│ │ > _                                                              │ │                            │
│ ╰──────────────────────────────────────────────────────────────────╯ │                            │
├──────────────────────────────────────────────────────────────────────┴────────────────────────────┤
│  🟢 v1.0.0-beta  |  SIPEL-CES  |  3 tools  ·  2 arquivos modificados  |  14:32  (Ctrl+X) Menu    │
╰────────────────────────────────────────────────────────────────────────────────────────────────────╯
```

---

## Micro-iterações e Loop de Agente

Esta é a seção central do design. Cada iteração do agente é renderizada como uma sequência de **blocos de ferramenta** visíveis, colapsáveis e com métricas de execução.

### 6.1 Anatomia de um Bloco de Ferramenta

```
┌─ 🔧 tool: <nome_da_ferramenta> ───────────── <duração> <status> ──┐
│  <input resumido ou output formatado>                             │
└───────────────────────────────────────────────────────────────────┘
```

**Status possíveis:**
```
⠋ running   →  ferramenta em execução (spinner animado)
✓ <Xms>     →  concluída com sucesso (verde)
✗ erro      →  falhou (vermelho, com mensagem expansível)
⊘ cancelada →  interrompida por Ctrl+C
```

**Ferramentas reconhecidas e seus ícones:**

| Ferramenta      | Ícone | Renderização especial                         |
|----------------|-------|-----------------------------------------------|
| `read_file`    | 📖    | Nome do arquivo + primeiras linhas (colapsado)|
| `write_file`   | 📄    | Diff inline (+/- linhas coloridas)            |
| `bash`         | 💻    | Bloco de código com output (scrollável)       |
| `search_files` | 🔍    | Lista de matches com contexto                 |
| `list_files`   | 📁    | Árvore de diretório compacta                  |
| `fetch_url`    | 🌐    | URL + status HTTP + resumo de conteúdo        |
| `agent_spawn`  | 🤖    | Sub-agente lançado + ID de thread             |

### 6.2 Sequência de Micro-iterações

Uma tarefa complexa renderiza o loop de forma progressiva:

```
[OpenKore]  ⠹ iteração 1/N — analisando codebase...

  ┌─ 📖 tool: read_file ────────────────────── 89ms ✓ ─┐
  │  package.json, tsconfig.json                       │
  └────────────────────────────────────────────────────┘

  ┌─ 🔍 tool: search_files ────────────────── 134ms ✓ ─┐
  │  pattern: "class.*Strategy"  →  3 matches          │
  │  src/strategy/Base.ts:12                           │
  │  src/strategy/Auth.ts:8                            │
  └────────────────────────────────────────────────────┘

[OpenKore]  ⠸ iteração 2/N — gerando scaffolding...

  ┌─ 📄 tool: write_file ──────────────────── 312ms ✓ ─┐
  │  src/ces/module.ts  [novo]  (+67 linhas)           │
  │  + import { IStrategy } from './interfaces'        │
  │  + export class CESModule implements IStrategy {   │
  └────────────────────────────────────────────────────┘

  ┌─ 📄 tool: write_file ──────────────────── 198ms ✓ ─┐
  │  docs/CES_MODULE.md  [novo]  (+120 linhas)         │
  └────────────────────────────────────────────────────┘

[OpenKore]  ⠼ iteração 3/N — validando...

  ┌─ 💻 tool: bash ────────────────────────── 445ms ✓ ─┐
  │  $ npx tsc --noEmit                                │
  │  ✓ Compilação sem erros                            │
  └────────────────────────────────────────────────────┘

[OpenKore]  ✓ tarefa concluída em 3 iterações · 1.178ms total
```

### 6.3 Modo de Iteração Configurável

```
/iterations set 5        # limite de iterações por tarefa
/iterations auto         # agente decide (padrão)
/iterations show         # exibe contador no status bar
```

**Barra de progresso de iterações (visível na status bar durante execução):**
```
│  ⠸ iteração 2/5  [██░░░░░░░░]  tools: 4  |  tokens: +1.240
```

### 6.4 Comportamento de Aprovação

Por padrão, operações destrutivas pedem confirmação inline antes de executar:

```
  ┌─ ⚠️  tool: bash — requer aprovação ─────────────────────────────┐
  │  $ rm -rf dist/                                                 │
  │                                                                 │
  │  [Y] Permitir    [N] Recusar    [A] Sempre permitir este tool   │
  └─────────────────────────────────────────────────────────────────┘
```

Aprovações persistem por sessão. `/permissions` lista e revoga.

### 6.5 Interrupção e Retomada

- `Ctrl+C` → interrompe a iteração atual, exibe `⊘ cancelado` no bloco
- `Ctrl+C Ctrl+C` (duplo) → encerra o agente completamente
- `/continue` → retoma de onde parou (contexto preservado)
- `/undo` → reverte o último `write_file` ou `bash` com efeitos

---

## Sidebar de Contexto e Metadados

A sidebar direita organiza informações em seções colapsáveis individualmente.

```
⚙ CONTEXTO DA SESSÃO
──────────────────────
Tokens:  14.520 / 120k
Uso:  12%  [██░░░░░░░░]
Custo:  $0.024
Sessão: #a3f2c1
Duração: 00:04:32

🤖 AGENTES ATIVOS
──────────────────────
⠹ Arquiteto    45%  [████░░]
○  Revisor       0%  [      ]
⠸ Engenheiro   15%  [█░░░░░]

📎 ARQUIVOS TOCADOS
──────────────────────
src/ces/module.ts     ~
src/ces/index.ts      +
docs/CES_MODULE.md    +
  (3 arquivo(s) nesta sessão)

🔌 LSP / MCP STATUS
──────────────────────
✓ TypeScript LSP  ativo
✓ eslint-mcp      ativo
○ prettier-mcp    ocioso

📋 TAREFAS (TODOS)
──────────────────────
✓ Criar scaffolding CES
⠸ Gerar documentação
○ Revisar contratos API
○ Escrever testes

💡 DICAS CONTEXTUAIS
──────────────────────
@ arquivo p/ incluir
! shell inline
/diff ver mudanças
Ctrl+C parar agente
```

**Legenda de modificações de arquivo:**
```
+   arquivo criado
~   arquivo modificado
-   arquivo deletado
R   arquivo renomeado
```

A seção **TAREFAS** é gerada automaticamente pelo agente ao receber tarefas multi-etapa e atualizada em tempo real conforme o progresso.

---

## Sistema de Comandos e Paleta

### 8.1 Slash Commands

Digitados diretamente no input. Autocomplete fuzzy ativado após `/`.

```
/new             Inicia nova sessão (preserva workspace)
/sessions        Lista sessões salvas (dialog de seleção)
/model           Troca modelo de LLM (dialog fuzzy)
/agent           Seleciona ou cria agente
/continue        Retoma iteração interrompida
/undo            Reverte última ação com efeito colateral
/diff            Exibe diff acumulado da sessão no painel
/export          Exporta conversa para arquivo (usa $EDITOR)
/permissions     Lista e revoga aprovações de ferramentas
/iterations      Configura limite de micro-iterações
/connect         Gerencia chaves de API e conexões
/agents          Lista e gerencia threads de agentes
/help            Abre paleta de ajuda contextual
/clear           Limpa histórico visual (contexto preservado)
```

### 8.2 Paleta de Comandos (Command Palette)

Ativada por `Ctrl+X H` ou `/help`. Busca fuzzy em todos os 60+ comandos registrados.

```
╭─ Paleta de Comandos ──────────────────────────────────────────────╮
│ > model                                                           │
│ ─────────────────────────────────────────────────────────────────│
│   /model           Trocar modelo LLM              Ctrl+X M        │
│   /model list      Listar modelos disponíveis                     │
│   /model default   Definir modelo padrão                          │
╰───────────────────────────────────────────────────────────────────╯
```

### 8.3 Referências Inline

```
@arquivo.ts          Inclui conteúdo do arquivo no contexto (fuzzy search)
@nomeDoAgente        Menciona agente específico (ex: @Arquiteto)
!comando shell       Executa e inclui output como tool result
```

Paste de mais de 3 linhas ou 150 chars → automaticamente convertido em anexo de arquivo com visualização colapsada.

---

## Atalhos de Teclado (Keybinds)

Leader key padrão: `Ctrl+X`

### Navegação

| Atalho            | Ação                                    |
|-------------------|-----------------------------------------|
| `Ctrl+X H`        | Abre paleta de comandos / ajuda         |
| `Ctrl+X N`        | Nova sessão                             |
| `Ctrl+X S`        | Lista sessões salvas                    |
| `Ctrl+X M`        | Troca de modelo LLM                     |
| `Ctrl+X B`        | Toggle sidebar                          |
| `Ctrl+X D`        | Toggle modo diff da sessão              |
| `Ctrl+X T`        | Toggle timestamps nas mensagens         |
| `Ctrl+X U`        | Toggle exibição de username             |
| `Ctrl+X P`        | Menu principal                          |

### Chat e Edição

| Atalho            | Ação                                    |
|-------------------|-----------------------------------------|
| `Enter`           | Envia mensagem                          |
| `Shift+Enter`     | Quebra de linha no input                |
| `↑ / ↓`           | Navega histórico de prompts             |
| `Ctrl+P / Ctrl+N` | Navega histórico (alternativo)          |
| `Esc`             | Cancela autocomplete / fecha modal      |
| `Tab`             | Confirma sugestão de autocomplete       |

### Agente e Ferramentas

| Atalho            | Ação                                    |
|-------------------|-----------------------------------------|
| `Ctrl+C`          | Interrompe iteração atual               |
| `Ctrl+C Ctrl+C`   | Encerra agente completamente            |
| `Y`               | Aprova ação pendente                    |
| `N`               | Recusa ação pendente                    |
| `A`               | Aprova sempre (persiste na sessão)      |

### Scroll e Visualização

| Atalho            | Ação                                    |
|-------------------|-----------------------------------------|
| `PgUp / PgDown`   | Scroll rápido no chat                   |
| `Ctrl+U / Ctrl+D` | Scroll meia tela                        |
| `G / gg`          | Ir para fim / início do chat            |
| `Ctrl+Z`          | Colapsa/expande bloco de ferramenta     |

---

## Componentes e Interações

### 9.1 Input Box

```
╭─────────────────────────────────────────────────────────────────╮
│ > Digite uma tarefa, @arquivo, !shell ou /comando...            │
╰─────────────────────────────────────────────────────────────────╯
```

- Borda `--color-fg-muted` em idle
- Borda `--color-accent` ao focar ou digitar
- Cresce verticalmente até 8 linhas antes de rolar internamente
- Suporta extmarks (virtual text) para hints contextuais

### 9.2 Autocomplete Fuzzy

Ativado por `@`, `!` ou `/`. Aparece acima do input.

```
╭─ Arquivos ────────────────────────────────────────────╮
│  ▶ src/ces/module.ts                      (recente)   │
│    src/ces/index.ts                                   │
│    src/strategy/BaseStrategy.ts                       │
╰───────────────────────────────────────────────────────╯
```

Ranking por frecency (frequência + recência de uso na sessão).

### 9.3 Diff Inline

Exibido dentro de blocos de ferramenta `write_file` e pelo comando `/diff`.

```
  src/ces/module.ts
  ────────────────────────────────────────────
  @@ -1,5 +1,12 @@
  + import { IStrategy } from './interfaces';
  + import { SessionContext } from '../core';
  +
    export class CESModule {
  -   // TODO: implementar
  +   private readonly context: SessionContext;
  +
  +   constructor(ctx: SessionContext) {
  +     this.context = ctx;
  +   }
    }
```

- Background `--color-diff-add` em linhas `+`
- Background `--color-diff-rem` em linhas `-`
- Modo `stacked` (coluna única) ou `auto` (adaptativo à largura)

### 9.4 Toast Notifications

Notificações temporárias no topo da tela para eventos assíncronos.

```
╭── ✓ Arquivo salvo: docs/CES_MODULE.md ──────────────────────────╮
╰──────────────────────────────────────────────────────────────────╯
```

Duram 3s por padrão. Erros persistem até interação.

### 9.5 Diálogos Modais

Usados para seleção de sessão, modelo e aprovações críticas.

```
╭─ Selecionar Modelo ───────────────────────────────────────────╮
│ > claude                                                      │
│ ─────────────────────────────────────────────────────────────│
│   claude-kore-alpha       Anthropic · contexto 120k          │
│   claude-kore-beta        Anthropic · rápido, contexto 32k   │
│   gemini-2.5-pro          Google · contexto 1M               │
╰───────────────────────────────────────────────────────────────╯
```

---

## Barra de Status Global

Fixada no rodapé. Atualiza em tempo real.

```
│  🟢 OpenKore v1.0.0-beta  |  SIPEL-CES  |  ⠸ iteração 2/5  ·  3 tools  ·  +1.240 tokens  |  14:34  (Ctrl+X) Menu  │
```

**Estados do indicador:**
```
🟢  Sistema respondendo, agente idle ou aguardando input
🟡  Requisição em andamento / aguardando resposta do LLM
🔴  Erro de conexão ou falha crítica do agente
⚪  Modo offline / sessão encerrada
```

**Slots da status bar (esquerda → direita):**
1. Indicador de saúde + versão
2. Workspace atual
3. Estado da iteração atual (visível durante execução)
4. Contagem de ferramentas e tokens da iteração
5. Relógio (HH:MM)
6. Hint de leader key

---

## Temas e Personalização

### Configuração via `tui.json`

```jsonc
{
  "theme": "openkore-olive",      // tema padrão
  "scroll_speed": 3,
  "scroll_acceleration": {
    "enabled": true               // aceleração estilo macOS
  },
  "diff_style": "auto",           // "auto" | "stacked"
  "mouse": true,                  // captura de mouse
  "sidebar": {
    "default_open": true,
    "width": 32                   // colunas
  },
  "iterations": {
    "default_limit": 0,           // 0 = ilimitado
    "show_counter": true
  },
  "show_timestamps": false,
  "show_username": true,
  "show_thinking": true           // exibe etapas de reasoning
}
```

### Variável de Ambiente

```bash
OPENKORE_TUI_CONFIG=~/.config/openkore/tui.json
```

### Temas Disponíveis

| Tema                | Descrição                                   |
|--------------------|---------------------------------------------|
| `openkore-olive`   | Padrão. Verde oliva + fundo preto profundo  |
| `openkore-mono`    | Monocromático cinza, sem cores de destaque  |
| `openkore-dawn`    | Modo claro com acentos âmbar               |

Temas personalizados seguem o schema de tokens CSS definido em [Paleta de Cores](#paleta-de-cores-e-tokens-visuais). Basta criar `~/.config/openkore/themes/meutema.json` com os overrides desejados.

---

*OpenKore TUI Design Spec — v0.1.0*