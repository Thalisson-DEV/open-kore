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
13. [Plano de Implementação por Fases](#plano-de-implementação-por-fases)

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

> **Nota sobre ANSI:** `--color-accent` usa `#7a9e7a` (verde-sálvia) e não possui mapeamento ANSI preciso. Em terminais true-color o valor hex é usado diretamente. Em terminais sem suporte, definir fallback manualmente no tema.

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
│   └────────────────────────────────────────────────────────────────┘ │                            │
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

| Ferramenta      | Ícone | Renderização especial                          |
|----------------|-------|------------------------------------------------|
| `read_file`    | 📖    | Nome do arquivo + primeiras linhas (colapsado) |
| `write_file`   | 📄    | Diff inline (+/- linhas coloridas)             |
| `bash`         | 💻    | Bloco de código com output (scrollável)        |
| `search_files` | 🔍    | Lista de matches com contexto                  |
| `list_files`   | 📁    | Árvore de diretório compacta                   |
| `fetch_url`    | 🌐    | URL + status HTTP + resumo de conteúdo         |
| `agent_spawn`  | 🤖    | Sub-agente lançado + ID de thread              |

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

- `Esc` → interrompe a iteração atual, exibe `⊘ cancelado` no bloco
- `Ctrl+C` (duplo) → encerra o agente completamente
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

Ativada por `Ctrl+X H` ou `/help`. Busca fuzzy em todos os comandos registrados.

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
  "theme": "openkore-sage",       // tema padrão
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

| Tema               | Descrição                                    |
|--------------------|----------------------------------------------|
| `openkore-sage`    | Padrão. Verde-sálvia #7a9e7a + fundo #0A0A0A |
| `openkore-mono`    | Monocromático cinza, sem cores de destaque   |
| `openkore-dawn`    | Modo claro com acentos âmbar                 |

Temas personalizados seguem o schema de tokens definido em [Paleta de Cores](#paleta-de-cores-e-tokens-visuais). Basta criar `~/.config/openkore/themes/meutema.json` com os overrides desejados.

---

## Plano de Implementação por Fases

A TUI é construída em 6 fases incrementais. Cada fase entrega uma camada funcional e visualmente verificável, sobre a qual a próxima se apoia. Campos ainda sem dados reais devem usar **mocks explicitamente marcados** com o comentário `// [MOCK]` no código e sufixo visual `[M]` em modo `NODE_ENV=development`, para facilitar identificação e substituição futura.

```
Fase 1  →  Layout root + StatusBar + InputField
Fase 2  →  MessageList + identificadores + thinking
Fase 3  →  ToolBlock + micro-iterações + diff
Fase 4  →  Sidebar (todas as seções)
Fase 5  →  Autocomplete fuzzy + slash commands
Fase 6  →  Toasts + modais + aprovações + polimento final
```

---

### Fase 1 — Fundação: Layout Root, StatusBar e InputField

**Objetivo:** Estabelecer o esqueleto estrutural da TUI. Ao final desta fase, o terminal exibe o fundo correto, uma barra de status ancorada no rodapé e uma caixa de entrada funcional com as cores da paleta.

**Escopo:**

| Inclui | Não inclui |
|--------|------------|
| Layout root com `flexDirection: column` e altura total | Renderização de mensagens |
| StatusBar ancorada no rodapé | Sidebar |
| InputField com borda arredondada em `--color-accent` | Autocomplete |
| Relógio HH:MM atualizado por `setInterval` | Integração com backend real |
| Histórico de comandos `↑/↓` | Blocos de ferramenta |

**Arquivos envolvidos:**
```
packages/tui/src/index.tsx
packages/tui/src/components/StatusBar.tsx
packages/tui/src/components/InputField.tsx
```

**`index.tsx` — Layout Root**

- Componente `App` com `<Box flexDirection="column" minHeight={process.stdout.rows || 24} backgroundColor="#0A0A0A">`
- Filhos em ordem vertical: `<Header />` (stub vazio), `<MessageList />` (stub com `flexGrow={1}`), `<InputField />`, `<StatusBar />`
- O `flexGrow={1}` no `MessageList` garante que `InputField` e `StatusBar` grudem no rodapé independente do conteúdo

**`StatusBar.tsx` — Barra de Status Global**

- Wrapper: `<Box flexDirection="row" backgroundColor="#111111" paddingX={1}>`
- Slots em ordem, separados por `·` ou `|` em `--color-fg-muted`:
  1. Indicador `🟢` + `OpenKore v1.0.0-beta`
  2. Workspace: `SIPEL-CES` [MOCK]
  3. Agente ativo: `Kore-Alpha` [MOCK]
  4. Contagem: `0 tools` [MOCK]
  5. Relógio: estado local React, `setInterval` a cada 1000ms, formato `HH:MM`
  6. Hint: `(Ctrl+X) Menu` em `--color-fg-dim`
- Preparar prop `status: 'online' | 'loading' | 'error' | 'offline'` tipada mas hardcoded como `'online'` por ora

**`InputField.tsx` — Caixa de Entrada**

- Wrapper: `<Box borderStyle="round" borderColor={value === '' ? '#3A3A3A' : '#7a9e7a'}>`
- Prefixo `> ` como `<text fg="#7a9e7a">{">"} </text>` antes do `<input>` nativo
- Estado local: `value: string`, `history: string[]`, `historyIndex: number`
- `↑` decrementa `historyIndex` e carrega entrada anterior; `↓` avança; `Enter` empurra para `history` e reseta `value` e `historyIndex`
- `onSubmit` recebe o texto e dispara callback prop para `index.tsx`

**Verificação:**
```bash
bun run dev
```
- [ ] Fundo `#0A0A0A` ocupa todo o terminal
- [ ] StatusBar no rodapé com todos os slots visíveis
- [ ] Relógio atualiza a cada minuto sem rerender da tela inteira
- [ ] InputField logo acima da StatusBar com borda arredondada
- [ ] Borda muda de `#3A3A3A` (idle) para `#7a9e7a` (digitando)
- [ ] `↑/↓` navega histórico; `Enter` limpa o campo e empurra para histórico

---

### Fase 2 — Painel de Mensagens e Identificadores

**Objetivo:** Substituir o stub `MessageList` por renderização real de mensagens com identidade visual, timestamps opcionais e área de thinking colapsável.

**Escopo:**

| Inclui | Não inclui |
|--------|------------|
| Componente `MessageList` scrollável | Blocos de ferramenta (Fase 3) |
| Identificadores `[Usuário]` e `[OpenKore]` em `--color-accent` + negrito | Integração SSE real |
| Área de thinking em `--color-fg-dim` + itálico, recuada 2 espaços | Sidebar (Fase 4) |
| Timestamps opcionais `HH:MM` por mensagem | Diff inline |
| Scroll: `PgUp/PgDown`, `Ctrl+U/D`, `G/gg` | |
| Auto-scroll para o fim ao receber nova mensagem | |
| Spinner `⠹` ao lado do label durante streaming | |

**Arquivos envolvidos:**
```
packages/tui/src/components/MessageList.tsx   ← novo
packages/tui/src/components/Message.tsx        ← novo
packages/tui/src/components/ThinkingBlock.tsx  ← novo
packages/tui/src/types/message.ts              ← novo
```

**`types/message.ts`**
```typescript
type MessageRole = 'user' | 'assistant'

interface ThinkingStep {
  text: string
}

interface Message {
  id: string
  role: MessageRole
  content: string
  thinking?: ThinkingStep[]
  timestamp: Date
  isStreaming?: boolean
}
```

**`Message.tsx`**
- `role === 'user'`: label `[Usuário]` em `--color-accent` bold; texto em `--color-fg`
- `role === 'assistant'` + `isStreaming`: label `[OpenKore]` + spinner `⠹` animado (Braille 80ms) ao lado
- `role === 'assistant'` + concluído: label `[OpenKore]` sem spinner
- Timestamp à direita do label se prop `showTimestamps` ativo, em `--color-fg-dim`
- Conteúdo com suporte básico a Markdown: `**negrito**`, `*itálico*`, `` `código` ``

**`ThinkingBlock.tsx`**
- Cada etapa renderizada como `  > texto` em `--color-fg-dim` itálico, recuo 2 espaços
- Exibido entre o label e o conteúdo final da mensagem
- Expandido automaticamente durante `isStreaming`; colapsado após conclusão
- `Ctrl+Z` na mensagem em foco alterna colapso/expansão

**`MessageList.tsx`**
- Lista scrollável de `<Message>` com overflow interno
- Estado: `messages: Message[]`, `scrollOffset: number`
- Keybinds locais: `PgUp/PgDown` (3 linhas), `Ctrl+U/Ctrl+D` (meia tela), `G` (ir ao fim), `gg` (ir ao início)
- Auto-scroll: se `scrollOffset === 0` (usuário está no fundo), nova mensagem mantém o fundo visível. Se rolou para cima, não força.

**Mocks para desenvolvimento:**
```typescript
// index.tsx
const MOCK_MESSAGES: Message[] = [
  {
    id: '1', role: 'user',
    content: 'Inicie a estruturação do módulo C.E.S.',
    timestamp: new Date()
  },
  {
    id: '2', role: 'assistant',
    thinking: [
      { text: 'Analisando dependências e padrões do projeto...' },
      { text: 'Ativando agente de arquitetura de software...' }
    ],
    content: 'A estrutura preliminar foi criada com sucesso.',
    timestamp: new Date()
  }
]
```

**Verificação:**
- [ ] Mensagens com labels coloridos e em negrito
- [ ] Etapas de thinking visíveis em cinza/itálico recuadas
- [ ] Spinner animado no label durante `isStreaming`
- [ ] Scroll funciona com todas as teclas mapeadas
- [ ] Auto-scroll ativo ao receber nova mensagem quando já no fundo
- [ ] Timestamps visíveis/ocultos conforme `showTimestamps`

---

### Fase 3 — Blocos de Ferramenta e Micro-iterações

**Objetivo:** Implementar o componente central de visualização do loop de agente. Cada chamada de ferramenta é um bloco inline renderizado progressivamente dentro do fluxo de mensagens, com spinner durante execução, duração ao concluir e diff colorido para escrita de arquivos.

**Escopo:**

| Inclui | Não inclui |
|--------|------------|
| Componente `ToolBlock` com spinner, duração e status | Aprovações inline (Fase 6) |
| Renderização específica por tipo de ferramenta | Integração real com o backend |
| `DiffView` para `write_file` com linhas `+/-` coloridas | |
| `BashOutput` com scroll interno e truncamento | |
| Contador de iterações na StatusBar | |
| Colapse/expanda com `Ctrl+Z` | |

**Arquivos envolvidos:**
```
packages/tui/src/components/ToolBlock.tsx
packages/tui/src/components/tools/DiffView.tsx
packages/tui/src/components/tools/BashOutput.tsx
packages/tui/src/types/tool.ts
```

**`types/tool.ts`**
```typescript
type ToolStatus = 'running' | 'success' | 'error' | 'cancelled'

interface ToolCall {
  id: string
  name: string
  input: Record<string, unknown>
  output?: string
  status: ToolStatus
  durationMs?: number
  startedAt: Date
}
```

**`ToolBlock.tsx` — Estrutura base**

Layout:
```
┌─ <ícone> tool: <nome> ─────────── <duração|spinner> <status> ──┐
│  <conteúdo específico da ferramenta>                           │
└────────────────────────────────────────────────────────────────┘
```

- Borda externa em `--color-fg-muted`; texto do header em `--color-accent-dim`
- `status === 'running'`: spinner Braille 80ms no lugar da duração; borda pulsa em `--color-accent-dim`
- `status === 'success'`: duração em `--color-success` + `✓`
- `status === 'error'`: `✗` em `--color-error`; conteúdo expande para mostrar mensagem de erro
- `status === 'cancelled'`: `⊘ cancelada` em `--color-fg-dim`
- Estado colapsado por padrão após conclusão; expandido durante execução
- `Ctrl+Z` na mensagem em foco alterna colapso de todos os blocos da mensagem

Mapeamento de ícones por `name`:
```typescript
const TOOL_ICONS: Record<string, string> = {
  read_file: '📖', write_file: '📄', bash: '💻',
  search_files: '🔍', list_files: '📁', fetch_url: '🌐', agent_spawn: '🤖'
}
```

**`DiffView.tsx` — Para `write_file`**
- Recebe `patch: string` em formato unidiff padrão
- Linha `+`: `backgroundColor="#1C361C"`, texto em `--color-success`
- Linha `-`: `backgroundColor="#3A1A1A"`, texto em `--color-error`
- Linha de contexto: texto em `--color-fg-dim`
- Header `@@ ... @@`: texto em `--color-info`

**`BashOutput.tsx` — Para `bash`**
- Linha de comando: `$ <cmd>` em `--color-accent`
- Output com scroll interno; máximo 10 linhas visíveis por padrão
- `↑/↓` rola dentro do bloco quando em foco
- Output longo truncado: `... (N linhas ocultas — Ctrl+Z para expandir)`

**Integração com `Message.tsx`**
- `Message` passa a aceitar `toolCalls?: ToolCall[]`
- `ToolBlock`s renderizados entre `ThinkingBlock` e o conteúdo final
- `StatusBar` exibe durante execução: `⠸ iteração N/N · tools: X · +Y tokens` [contadores parcialmente MOCK]

**Mocks para desenvolvimento:**
```typescript
const MOCK_TOOL_CALLS: ToolCall[] = [
  {
    id: 't1', name: 'read_file',
    input: { path: 'src/ces/module.ts' },
    output: '// conteúdo do arquivo...',
    status: 'success', durationMs: 120, startedAt: new Date()
  },
  {
    id: 't2', name: 'bash',
    input: { command: 'npx tsc --noEmit' },
    output: '✓ Compilação sem erros',
    status: 'success', durationMs: 445, startedAt: new Date()
  },
  {
    id: 't3', name: 'write_file',
    input: { path: 'src/ces/module.ts' },
    output: '@@ -1,3 +1,10 @@\n+import { IStrategy } from \'./interfaces\';\n-// TODO',
    status: 'running', startedAt: new Date()
  }
]
```

**Verificação:**
- [ ] Blocos renderizados inline dentro do fluxo de mensagens
- [ ] Spinner animado em `running`; duração verde + `✓` em `success`; vermelho + `✗` em `error`
- [ ] Diff com cores corretas para linhas `+` e `-`
- [ ] Output de bash scrollável internamente com truncamento
- [ ] `Ctrl+Z` na mensagem colapsa/expande todos os seus blocos
- [ ] StatusBar exibe contador de iteração durante execução

---

### Fase 4 — Sidebar de Contexto e Metadados

**Objetivo:** Implementar o painel lateral direito com todas as seções de metadados. Toda seção pode iniciar com dados mockados; a estrutura de componentes deve estar pronta para receber dados reais via props sem refatoração.

**Escopo:**

| Inclui | Não inclui |
|--------|------------|
| Componente `Sidebar` com seções em coluna | Integração com API real de tokens/custo |
| Seção: Contexto da Sessão | Lógica real de LSP |
| Seção: Agentes Ativos com barra de progresso | |
| Seção: Arquivos Tocados com legenda `+/~/−/R` | |
| Seção: LSP / MCP Status | |
| Seção: Tarefas/TODOs | |
| Seção: Dicas contextuais (estáticas nesta fase) | |
| Toggle `Ctrl+X B` | |
| Auto-colapso em terminais < 100 colunas | |

**Arquivos envolvidos:**
```
packages/tui/src/components/Sidebar.tsx
packages/tui/src/components/sidebar/SessionInfo.tsx
packages/tui/src/components/sidebar/AgentStatus.tsx
packages/tui/src/components/sidebar/FilesTouched.tsx
packages/tui/src/components/sidebar/LspStatus.tsx
packages/tui/src/components/sidebar/TodoList.tsx
packages/tui/src/components/sidebar/Tips.tsx
```

**`Sidebar.tsx` — Container**
- `<Box flexDirection="column" width={32} borderLeft borderColor="--color-fg-muted">`
- Prop `visible: boolean` — quando `false`, renderiza `<Box width={0} />` sem reflow do chat
- Detecta `process.stdout.columns < 100` e força `visible = false` automaticamente
- Cada seção tem título em `--color-accent` bold e separador `──────────` em `--color-fg-muted`

**`SessionInfo.tsx`**
```
⚙ CONTEXTO DA SESSÃO
──────────────────────
Tokens:  14.520 / 120k     ← [MOCK]
Uso:  12%  [██░░░░░░░░]    ← barra dinâmica
Custo:  $0.024             ← [MOCK]
Sessão: #a3f2c1            ← [MOCK]
Duração: 00:04:32          ← timer real via setInterval
```
- Barra de uso: `Math.round(percent / 10)` blocos `█` + restante `░`, total 10 blocos
- Cor da barra: `--color-success` abaixo de 80%, `--color-warning` entre 80-95%, `--color-error` acima de 95%
- Timer de duração com `setInterval` a cada segundo

**`AgentStatus.tsx`**
```
🤖 AGENTES ATIVOS
──────────────────────
⠹ Arquiteto    45%  [████░░]
○  Revisor       0%  [      ]
⠸ Engenheiro   15%  [█░░░░░]
```
- Barra de 6 blocos `█/░` proporcional ao percentual
- Spinner animado ao lado do nome quando `status === 'active'`; `○` quando idle

**`FilesTouched.tsx`**
```
📎 ARQUIVOS TOCADOS
──────────────────────
src/ces/module.ts     ~
src/ces/index.ts      +
```
- Status colorido: `+` em `--color-success`, `~` em `--color-warning`, `-` em `--color-error`, `R` em `--color-info`
- Path longo truncado com `…` para caber na largura da sidebar (32 cols)
- Contador `(N arquivo(s))` ao final da lista

**`LspStatus.tsx`**
```
🔌 LSP / MCP STATUS
──────────────────────
✓ TypeScript LSP  ativo
✓ eslint-mcp      ativo
○ prettier-mcp    ocioso
```
- `✓` em `--color-success`; `○` em `--color-fg-dim`; `✗` em `--color-error`
- Dados [MOCK] nesta fase; interface tipada pronta para integração

**`TodoList.tsx`**
```
📋 TAREFAS (TODOS)
──────────────────────
✓ Criar scaffolding CES
⠸ Gerar documentação
○ Revisar contratos API
```
- `✓` concluído em `--color-success`; spinner em andamento; `○` pendente em `--color-fg-dim`
- Dados [MOCK]; gerado pelo agente em versões futuras

**`Tips.tsx`**
- Array de 4 dicas hardcoded nesta fase
- Rotação dinâmica por contexto implementada na Fase 6

**Integração em `index.tsx`:**
```tsx
<Box flexDirection="row" flexGrow={1}>
  <MessageList flexGrow={1} />
  <Sidebar visible={sidebarVisible} />
</Box>
```

**Verificação:**
- [ ] Sidebar visível à direita com todas as 6 seções
- [ ] `Ctrl+X B` colapsa e expande sem reflow do chat
- [ ] Terminal < 100 colunas colapsa automaticamente
- [ ] Barra de uso muda de cor conforme percentual
- [ ] Timer de duração atualiza a cada segundo
- [ ] Paths longos truncados com `…`

---

### Fase 5 — Autocomplete Fuzzy e Sistema de Comandos

**Objetivo:** Implementar o autocomplete ativado por `@`, `!` e `/`, o sistema de slash commands com paleta fuzzy e a conversão automática de paste longo em anexo colapsado.

**Escopo:**

| Inclui | Não inclui |
|--------|------------|
| Dropdown de autocomplete acima do `InputField` | Integração com sistema de arquivos real |
| Fuzzy search por `@` (arquivos), `!` (histórico shell), `/` (comandos) | Frecency persistida em disco |
| Ranking por frecency em memória | |
| Paleta de comandos `Ctrl+X H` com busca fuzzy | |
| Slash commands: `/new`, `/clear`, `/model`, `/help`, `/diff` | |
| Conversão automática de paste longo em anexo | |

**Arquivos envolvidos:**
```
packages/tui/src/components/Autocomplete.tsx
packages/tui/src/components/CommandPalette.tsx
packages/tui/src/hooks/useFuzzySearch.ts
packages/tui/src/hooks/useFrecency.ts
packages/tui/src/commands/registry.ts
```

**`useFuzzySearch.ts`**
- Recebe `items: string[]` e `query: string`
- Retorna itens ranqueados com score de similaridade (implementar manualmente ou usar `fuzzysort`)
- Retorna também `highlights: number[][]` — índices dos chars que fizeram match, para renderização em `--color-accent`

**`useFrecency.ts`**
- Estado em memória: `Map<string, { uses: number, lastUsed: Date }>`
- `record(item: string)` → incrementa uso e atualiza timestamp
- `sort(items: string[])` → ordena por `uses * recencyDecay` onde `recencyDecay` decresce com a idade

**`Autocomplete.tsx`**
- Renderizado acima do `InputField`, posicionado pelo layout do container
- Detecção de trigger no valor do input:
  - `@<query>` → lista `MOCK_FILES` filtrada por fuzzy
  - `!<query>` → lista histórico de comandos bash da sessão atual
  - `/<query>` → lista slash commands do registro
- Navegação: `↑/↓` move seleção; `Tab` ou `Enter` confirma e insere no input; `Esc` fecha sem inserir
- Máximo 5 itens visíveis; scroll interno se mais resultados
- Item selecionado: `▶` em `--color-accent`; itens normais em `--color-fg-dim`

```
╭─ Arquivos ────────────────────────────────────────────╮
│  ▶ src/ces/module.ts                      (recente)   │
│    src/ces/index.ts                                   │
│    src/strategy/BaseStrategy.ts                       │
╰───────────────────────────────────────────────────────╯
```

**`registry.ts` — Registro de Comandos**
```typescript
interface Command {
  name: string
  description: string
  keybind?: string
  handler: (args?: string) => void
}

const commands: Command[] = []

export const registerCommand = (cmd: Command) => commands.push(cmd)
export const getCommands = (query: string): Command[] =>
  fuzzySearch(commands.map(c => c.name), query)
    .map(name => commands.find(c => c.name === name)!)
```

**`CommandPalette.tsx`**
- Modal overlay centralizado, ativado por `Ctrl+X H`
- Campo de busca próprio no topo com borda `--color-accent`
- Lista de comandos filtrada em tempo real por `useFuzzySearch`
- Cada item: `/nome`, descrição em `--color-fg-dim`, keybind em `--color-info`
- `Enter` executa o comando selecionado e fecha; `Esc` fecha sem executar

**Paste longo:**
- Em `InputField`, detectar paste (texto com `\n` e > 3 linhas, ou > 150 chars)
- Converter para `<Attachment filename="paste-{timestamp}.txt" lines={N} collapsed />`
- Conteúdo completo enviado no contexto ao backend; UI exibe apenas o resumo colapsado
- Hint: `Ctrl+Z para expandir` ao lado do anexo

**Mocks de arquivos:**
```typescript
// [MOCK] substituir por leitura real do workspace
const MOCK_FILES = [
  'src/ces/module.ts', 'src/ces/index.ts',
  'src/strategy/BaseStrategy.ts', 'package.json',
  'tsconfig.json', 'docs/CES_MODULE.md'
]
```

**Verificação:**
- [ ] `@` abre dropdown com fuzzy search de arquivos
- [ ] `!` abre dropdown com histórico de comandos bash da sessão
- [ ] `/` abre dropdown com slash commands disponíveis
- [ ] `Tab` confirma; `Esc` fecha sem inserir
- [ ] `Ctrl+X H` abre paleta de comandos com busca
- [ ] `/clear` limpa mensagens; `/new` reseta sessão
- [ ] Comandos não implementados exibem toast `⚡ em breve`
- [ ] Paste de 4+ linhas vira anexo colapsado com contagem de linhas

---

### Fase 6 — Toasts, Modais, Aprovações e Polimento Final

**Objetivo:** Implementar os sistemas de notificação temporária, diálogos modais, aprovações inline de ferramentas destrutivas e aplicar polimento visual em toda a TUI. Esta fase encerra o ciclo de desenvolvimento da interface base.

**Escopo:**

| Inclui | Não inclui |
|--------|------------|
| Sistema de Toast (topo, temporário) | Integração com backend de sessões reais |
| Modal base + `DialogModel` + `DialogSessions` | |
| Aprovação inline de ferramentas destrutivas | |
| `usePermissions` — aprovações por sessão | |
| Header completo (estado + workspace + modelo) | |
| Dicas contextuais dinâmicas na Sidebar | |
| `Ctrl+C` duplo com debounce para encerrar agente | |
| Polimento: consistência de cores, sem flickering | |

**Arquivos envolvidos:**
```
packages/tui/src/components/Toast.tsx
packages/tui/src/components/ToastContainer.tsx
packages/tui/src/components/Modal.tsx
packages/tui/src/components/ToolApproval.tsx
packages/tui/src/components/Header.tsx
packages/tui/src/hooks/useToast.ts
packages/tui/src/hooks/usePermissions.ts
```

**`useToast.ts` + `ToastContainer.tsx`**
```typescript
interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
  duration: number  // ms; 0 = persistente até interação
}
```
- `showToast(message, type, duration?)` adiciona; remove automaticamente após `duration` ms (padrão 3000)
- Toasts `error` com `duration: 0` — persistem até `Esc` ou clique
- `ToastContainer` renderizado no topo absoluto, toasts empilhados verticalmente
- Novo toast empurra o anterior para baixo (máximo 3 simultâneos; mais antigo descartado)

```
╭── ✓ Arquivo salvo: docs/CES_MODULE.md ──────────────────────────╮
╰──────────────────────────────────────────────────────────────────╯
```

**`Modal.tsx` — Base de diálogos**
- `<Box borderStyle="round" borderColor="#7a9e7a">` centralizado com overlay semitransparente
- Props: `title: string`, `children: ReactNode`, `onClose: () => void`
- `Esc` fecha qualquer modal aberto
- Exporta contexto `ModalContext` para abertura programática

**`DialogModel.tsx`**
- Abre via `Ctrl+X M` ou `/model`
- Campo de busca fuzzy interno; lista de modelos filtrada em tempo real
- `Enter` seleciona e fecha; dispara toast `✓ Modelo alterado: <nome>`
- Dados [MOCK] nesta fase

**`ToolApproval.tsx` — Aprovação inline**
- Renderizado dentro do `ToolBlock` quando `status === 'pending_approval'`
- Layout:
```
  ┌─ ⚠️  tool: bash — requer aprovação ───────────────────────────┐
  │  $ rm -rf dist/                                               │
  │  [Y] Permitir    [N] Recusar    [A] Sempre permitir           │
  └───────────────────────────────────────────────────────────────┘
```
- Teclado: `Y` aprova; `N` recusa; `A` chama `grantAlways(toolName)` via `usePermissions`
- Após decisão, bloco retorna ao fluxo normal de `ToolBlock` com o status resultante

**`usePermissions.ts`**
```typescript
type Permission = 'always' | 'never'

// estado em memória por sessão
const permissions = new Map<string, Permission>()

export const isApproved = (name: string): boolean | 'ask' => {
  const p = permissions.get(name)
  if (p === 'always') return true
  if (p === 'never') return false
  return 'ask'
}
export const grant = (name: string) => permissions.set(name, 'always') // temporário
export const grantAlways = (name: string) => permissions.set(name, 'always') // persiste sessão
export const revoke = (name: string) => permissions.delete(name)
```
- `/permissions` slash command lista o estado atual via toast ou modal simples

**`Header.tsx` — Cabeçalho real**
```
● OpenKore  SIPEL-CES  claude-kore-alpha
```
- `●` com cor dinâmica conforme estado do sistema (`--color-success`, `--color-warning`, `--color-error`)
- Workspace e modelo ativo; dados vindos de props do `App`
- Separador visual da área de chat via borda inferior `--color-fg-muted`

**`Ctrl+C` duplo para encerrar agente:**
- Estado `lastCtrlC: Date | null` em `index.tsx`
- Primeiro `Ctrl+C`: seta `lastCtrlC = now()`, exibe toast `⚡ Pressione Ctrl+C novamente para encerrar o agente`
- Segundo `Ctrl+C` dentro de 500ms: encerra agente e exibe `⊘ Agente encerrado`
- Após 500ms sem segundo press: reseta `lastCtrlC`

**Dicas contextuais dinâmicas em `Tips.tsx`:**
- Banco de dicas por contexto: `'idle'`, `'streaming'`, `'tool_running'`, `'approval_pending'`
- Sidebar recebe `context` prop e `Tips` exibe o conjunto relevante
- Rotação entre dicas do contexto atual a cada 10s

**Checklist de polimento:**
- Revisar consistência de todas as cores contra a paleta
- Spinner Braille rodando a 80ms/frame sem flickering
- Testar em terminais de 80, 100, 120 e 160 colunas
- Verificar colapso correto da sidebar em terminais estreitos
- Garantir que `backgroundColor` não vaze entre componentes no renderer
- Remover todos os `console.log` de debug
- Validar que `[M]` indicators aparecem apenas em `NODE_ENV=development`

**Verificação:**
- [ ] Toast de sucesso aparece e some após 3s
- [ ] Toast de erro persiste até `Esc`
- [ ] `Ctrl+X M` abre modal de seleção de modelo com fuzzy search
- [ ] Ferramenta destrutiva exibe bloco de aprovação; `Y/N/A` funcionam corretamente
- [ ] `/permissions` lista aprovações ativas da sessão
- [ ] `Ctrl+C` simples para a iteração; duplo (< 500ms) encerra o agente
- [ ] Header exibe estado, workspace e modelo com cores corretas
- [ ] Dicas na sidebar mudam conforme contexto da sessão
- [ ] Nenhum flickering visível em uso normal por 5 minutos

---

### Resumo das Fases

| Fase | Entrega Principal | Arquivos novos/modificados | Mocks necessários |
|------|-------------------|----------------------------|-------------------|
| 1 | Layout root + StatusBar + InputField | 3 | workspace, agente, contagem |
| 2 | MessageList + identificadores + thinking | 4 | array de mensagens |
| 3 | ToolBlock + micro-iterações + diff | 4 | array de tool calls |
| 4 | Sidebar completa | 7 | tokens, custo, agentes, arquivos, LSP, TODOs |
| 5 | Autocomplete fuzzy + slash commands | 5 | lista de arquivos do workspace |
| 6 | Toasts + modais + aprovações + polimento | 7 | lista de modelos disponíveis |

> **Convenção de mocks:** todo valor mockado deve ter o comentário `// [MOCK]` no código e exibir sufixo `[M]` na UI apenas em `NODE_ENV=development`. Isso garante visibilidade durante desenvolvimento e ausência em produção sem necessidade de busca manual.

---

*OpenKore TUI Design Spec — v0.2.0 — Plano de implementação por fases adicionado*