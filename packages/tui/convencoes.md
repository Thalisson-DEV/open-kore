# OpenKore TUI — Convenções de Refatoração Ink → OpenTUI

> Este arquivo instrui um agente inteligente a refatorar toda a base de código da TUI do OpenKore de **Ink + React** para **@opentui/react**, mantendo a interface visual e comportamental 100% idêntica ao que está especificado em `design-tui.md`.
>
> Leia este arquivo **inteiro** antes de tocar em qualquer arquivo de código.

---

## Índice

1. [Contexto e Objetivo](#contexto-e-objetivo)
2. [O que NÃO mudar](#o-que-não-mudar)
3. [Setup e Instalação](#setup-e-instalação)
4. [Mapeamento de Primitivos: Ink → OpenTUI](#mapeamento-de-primitivos-ink--opentui)
5. [Mapeamento de Hooks](#mapeamento-de-hooks)
6. [Entrypoint e Renderer](#entrypoint-e-renderer)
7. [Layout e Flexbox](#layout-e-flexbox)
8. [Cores e Estilos](#cores-e-estilos)
9. [Teclado e Input](#teclado-e-input)
10. [Scroll e ScrollBox](#scroll-e-scrollbox)
11. [Componentes Especiais](#componentes-especiais)
12. [Animações e requestLive](#animações-e-requestlive)
13. [tsconfig.json](#tsconfigjson)
14. [Armadilhas Conhecidas](#armadilhas-conhecidas)
15. [Checklist de Verificação por Fase](#checklist-de-verificação-por-fase)
16. [Ordem de Refatoração Recomendada](#ordem-de-refatoração-recomendada)

---

## Contexto e Objetivo

A TUI do OpenKore foi originalmente construída com **Ink** (`ink` + `ink-text-input`), que usa React renderizando em stdout via ANSI. Está sendo migrada para **OpenTUI** (`@opentui/react` + `@opentui/core`), que usa um core nativo em Zig com bindings TypeScript, 60fps, Yoga layout engine, e suporte a Kitty keyboard protocol.

A interface visual — layout, cores, comportamentos, keybinds — é definida em `design-tui.md` e **não deve mudar**. A refatoração é puramente de infraestrutura de renderização.

**Stack de destino:**
```
@opentui/core    ← renderer, primitivos, layout
@opentui/react   ← bindings JSX para React
react            ← mesma versão de React (state, hooks, context)
bun              ← runtime exclusivo (não usar node/npm)
```

---

## O que NÃO mudar

O agente **nunca** deve alterar os seguintes aspectos durante a refatoração:

- Paleta de cores (`#7a9e7a`, `#0A0A0A`, `#111111`, etc.) — nenhum hex muda
- Layout visual de qualquer componente (posição, tamanho, bordas, slots da StatusBar)
- Comportamento de keybinds (`Ctrl+X`, `↑/↓`, `Ctrl+C`, etc.)
- Lógica de negócio (estado, mocks, handlers de submit, histórico de comandos)
- Tipos TypeScript já definidos em `types/message.ts`, `types/tool.ts`, etc.
- Nomes de arquivos e estrutura de diretórios de componentes
- Props públicas de cada componente (interface externa permanece igual)

Se uma decisão de refatoração exige mudar qualquer item acima, **parar e reportar** antes de prosseguir.

---

## Setup e Instalação

### Remover dependências Ink

```bash
bun remove ink ink-text-input
```

### Instalar OpenTUI

```bash
bun add @opentui/core @opentui/react react
```

> **Requisito:** Zig deve estar instalado no sistema para o build nativo do `@opentui/core`.
> Verificar com `zig version`. Se ausente, instalar via `zvm` ou `mise`.

### Verificar instalação

```bash
bun run packages/tui/src/index.tsx
```

Deve abrir o terminal em alternate-screen sem erros de import.

---

## Mapeamento de Primitivos: Ink → OpenTUI

Substituição direta de cada primitivo. Aplicar globalmente em todos os arquivos `.tsx`.

### Imports

```typescript
// ANTES (Ink)
import { Box, Text, useInput, useApp, useStdin } from 'ink'
import TextInput from 'ink-text-input'

// DEPOIS (OpenTUI React)
import { useKeyboard, useRenderer, useTerminalDimensions } from '@opentui/react'
// Elementos JSX são intrínsecos — sem import necessário para box, text, input
```

### Tabela de equivalências

| Ink | OpenTUI React (JSX) | Notas |
|-----|---------------------|-------|
| `<Box>` | `<box>` | **minúsculo** — intrínseco JSX |
| `<Text>` | `<text>` | **minúsculo** — intrínseco JSX |
| `<TextInput>` (ink-text-input) | `<input>` | Ver seção [Teclado e Input](#teclado-e-input) |
| `<Static>` | sem equivalente | Usar `<scrollbox>` com scroll desabilitado |
| `<Newline>` | `<br>` dentro de `<text>` | Apenas dentro de contexto de texto |
| `<Spacer>` | `<box style={{ flexGrow: 1 }} />` | |

### Props de estilo

```typescript
// ANTES (Ink)
<Box
  flexDirection="column"
  borderStyle="round"
  borderColor="#7a9e7a"
  backgroundColor="#0A0A0A"
  paddingX={1}
  width="100%"
>

// DEPOIS (OpenTUI)
<box
  style={{
    flexDirection: "column",
    borderStyle: "rounded",   // ← "round" vira "rounded"
    borderColor: "#7a9e7a",
    backgroundColor: "#0A0A0A",
    paddingX: 1,
    width: "100%",
  }}
>
```

> **Atenção:** Em OpenTUI, props de layout e estilo vão **sempre** dentro de `style={{}}`.
> Props diretas como `flexDirection="column"` sem `style` podem não funcionar — usar `style` é a forma canônica.

### Valores de borderStyle

| Ink | OpenTUI |
|-----|---------|
| `"round"` | `"rounded"` |
| `"single"` | `"single"` |
| `"double"` | `"double"` |
| `"bold"` | `"bold"` |
| `"classic"` | `"classic"` |
| sem borda | `border: false` ou omitir |

### Text e spans

```typescript
// ANTES (Ink)
<Text color="#7a9e7a" bold>
  [OpenKore]
</Text>

// DEPOIS (OpenTUI)
<text fg="#7a9e7a" bold>
  [OpenKore]
</text>

// Com spans inline (para texto misto)
<text>
  <span fg="#7a9e7a" bold>[OpenKore]</span>
  {' '}resposta normal
</text>
```

Modificadores de texto disponíveis como elementos filhos de `<text>`:
- `<span>` — styled inline
- `<strong>` / `<b>` — negrito
- `<em>` / `<i>` — itálico
- `<u>` — sublinhado
- `<br>` — quebra de linha

---

## Mapeamento de Hooks

### useInput (Ink) → useKeyboard (OpenTUI)

```typescript
// ANTES (Ink)
import { useInput } from 'ink'

useInput((input, key) => {
  if (key.upArrow) handleUp()
  if (key.downArrow) handleDown()
  if (key.return) handleEnter()
  if (key.ctrl && input === 'c') handleCtrlC()
})

// DEPOIS (OpenTUI)
import { useKeyboard } from '@opentui/react'

useKeyboard((key) => {
  if (key.name === 'up') handleUp()
  if (key.name === 'down') handleDown()
  if (key.name === 'return') handleEnter()
  if (key.ctrl && key.name === 'c') handleCtrlC()
})
```

**Tabela de nomes de teclas:**

| Ink `key.*` | OpenTUI `key.name` |
|-------------|-------------------|
| `key.upArrow` | `'up'` |
| `key.downArrow` | `'down'` |
| `key.leftArrow` | `'left'` |
| `key.rightArrow` | `'right'` |
| `key.return` | `'return'` |
| `key.escape` | `'escape'` |
| `key.tab` | `'tab'` |
| `key.backspace` | `'backspace'` |
| `key.delete` | `'delete'` |
| `key.pageUp` | `'pageup'` |
| `key.pageDown` | `'pagedown'` |
| `key.ctrl` | `key.ctrl === true` |
| `key.shift` | `key.shift === true` |
| `key.meta` | `key.meta === true` |
| `input` (char) | `key.name` (single char) ou `key.sequence` |

### useApp (Ink) → useRenderer (OpenTUI)

```typescript
// ANTES (Ink)
import { useApp } from 'ink'
const { exit } = useApp()
exit()

// DEPOIS (OpenTUI)
import { useRenderer } from '@opentui/react'
const renderer = useRenderer()
renderer.destroy()
```

### stdout dimensions (Ink) → useTerminalDimensions (OpenTUI)

```typescript
// ANTES (Ink)
const { stdout } = useStdout()
const width = stdout.columns
const height = stdout.rows

// DEPOIS (OpenTUI)
import { useTerminalDimensions } from '@opentui/react'
const { width, height } = useTerminalDimensions()
```

`useTerminalDimensions` é reativo — re-renderiza automaticamente ao redimensionar. Não precisa de listener manual.

### Resize listener

```typescript
// ANTES (Ink) — event listener manual
process.stdout.on('resize', () => { ... })

// DEPOIS (OpenTUI)
import { useOnResize } from '@opentui/react'
useOnResize((width, height) => { ... })
```

---

## Entrypoint e Renderer

O `index.tsx` muda estruturalmente. Esta é a transformação mais importante.

```typescript
// ANTES (Ink) — packages/tui/src/index.tsx
import { render } from 'ink'
import App from './App'

render(<App />)

// DEPOIS (OpenTUI) — packages/tui/src/index.tsx
import { createCliRenderer } from '@opentui/core'
import { createRoot } from '@opentui/react'
import App from './App'

const renderer = await createCliRenderer({
  exitOnCtrlC: false,          // gerenciamos Ctrl+C manualmente via useKeyboard
  screenMode: 'alternate-screen',
  backgroundColor: '#0A0A0A',  // --color-bg do design spec
  targetFps: 30,
  maxFps: 60,
  useKittyKeyboard: {},        // habilita protocolo Kitty para keybinds compostos
  consoleMode: 'disabled',     // sem overlay de console em produção
})

createRoot(renderer).render(<App />)

// Cleanup ao sair
process.on('SIGINT', () => renderer.destroy())
process.on('SIGTERM', () => renderer.destroy())
```

> **Crítico:** `createCliRenderer` é `async`. O entrypoint deve ser `async` ou usar top-level await (Bun suporta).

### O componente App raiz

```typescript
// App.tsx — estrutura root sem mudança de layout
function App() {
  const { width } = useTerminalDimensions()
  const sidebarVisible = width >= 100

  return (
    <box
      style={{
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        backgroundColor: '#0A0A0A',
      }}
    >
      <Header />
      <box style={{ flexDirection: 'row', flexGrow: 1 }}>
        <MessageList style={{ flexGrow: 1 }} />
        <Sidebar visible={sidebarVisible} />
      </box>
      <InputField onSubmit={handleSubmit} />
      <StatusBar />
    </box>
  )
}
```

---

## Layout e Flexbox

OpenTUI usa Yoga (mesmo engine do React Native). As propriedades são as mesmas do Ink, mas **sempre dentro de `style={{}}`**.

```typescript
// height: '100%' funciona
// flexGrow: 1 funciona
// position: 'absolute' funciona para overlays (toasts, modais)

// Overlay absoluto (para Toast, Modal, Autocomplete)
<box
  style={{
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,        // OpenTUI suporta zIndex para overlays
  }}
>
  <Toast />
</box>
```

> **Nota sobre altura total:** Em OpenTUI com `screenMode: 'alternate-screen'`, o root já ocupa 100% do terminal. Não é necessário `minHeight={process.stdout.rows}` como no Ink.

---

## Cores e Estilos

A paleta do OpenKore não muda. OpenTUI aceita os mesmos valores hex diretamente.

```typescript
// Cores como prop direta no elemento
<text fg="#7a9e7a" bg="#0A0A0A">texto</text>

// Cores via style
<box style={{ backgroundColor: '#111111', borderColor: '#7a9e7a' }}>

// Cores condicionais (padrão React)
<box style={{ borderColor: isActive ? '#7a9e7a' : '#3A3A3A' }}>
```

**Tokens do design spec como constantes — criar `src/theme.ts`:**

```typescript
// packages/tui/src/theme.ts
export const theme = {
  accent:      '#7a9e7a',
  accentDim:   '#405140',
  bg:          '#0A0A0A',
  bgPanel:     '#111111',
  fg:          '#E0E0E0',
  fgDim:       '#666666',
  fgMuted:     '#3A3A3A',
  success:     '#3FB950',
  warning:     '#D29922',
  error:       '#F85149',
  info:        '#58A6FF',
  diffAdd:     '#1C361C',
  diffRem:     '#3A1A1A',
} as const
```

Importar de `theme.ts` em vez de repetir hex strings nos componentes.

---

## Teclado e Input

### InputField — substituição do TextInput do Ink

O `ink-text-input` é substituído pelo `<input>` intrínseco do OpenTUI.

```typescript
// ANTES (Ink)
import TextInput from 'ink-text-input'

<TextInput
  value={value}
  onChange={setValue}
  onSubmit={handleSubmit}
  placeholder="Digite..."
/>

// DEPOIS (OpenTUI)
<input
  value={value}
  onInput={(v) => setValue(v)}
  onSubmit={handleSubmit}
  placeholder="Digite..."
  focused={true}
  style={{ width: '100%', fg: '#E0E0E0' }}
/>
```

**Props do `<input>` OpenTUI:**

| Prop | Tipo | Descrição |
|------|------|-----------|
| `value` | `string` | Valor controlado |
| `onInput` | `(value: string) => void` | Chamado a cada keystroke |
| `onSubmit` | `(value: string) => void` | Chamado no Enter |
| `placeholder` | `string` | Texto de placeholder |
| `focused` | `boolean` | Foca o input programaticamente |
| `password` | `boolean` | Oculta caracteres |

> **Crítico:** O `<input>` do OpenTUI recebe o foco via prop `focused={true}` **ou** chamando `.focus()` na ref. Não existe `isFocused` automático como no Ink. Gerenciar foco explicitamente no estado do App.

### Histórico de comandos (↑/↓) com useKeyboard

```typescript
// O histórico precisa ser gerenciado fora do <input>
// porque o OpenTUI não tem essa feature built-in

function InputField({ onSubmit }: Props) {
  const [value, setValue] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  useKeyboard((key) => {
    if (key.name === 'up') {
      const nextIndex = Math.min(historyIndex + 1, history.length - 1)
      setHistoryIndex(nextIndex)
      setValue(history[nextIndex] ?? '')
    }
    if (key.name === 'down') {
      const nextIndex = Math.max(historyIndex - 1, -1)
      setHistoryIndex(nextIndex)
      setValue(nextIndex === -1 ? '' : history[nextIndex])
    }
  })

  const handleSubmit = (val: string) => {
    if (val.trim()) {
      setHistory(prev => [val, ...prev])
      setHistoryIndex(-1)
    }
    setValue('')
    onSubmit(val)
  }

  return (
    <box style={{ borderStyle: 'rounded', borderColor: value ? '#7a9e7a' : '#3A3A3A' }}>
      <text fg="#7a9e7a">{'>'} </text>
      <input
        value={value}
        onInput={setValue}
        onSubmit={handleSubmit}
        placeholder="Digite uma tarefa, @arquivo, !shell ou /comando..."
        focused={true}
        style={{ flexGrow: 1 }}
      />
    </box>
  )
}
```

### Leader key (Ctrl+X) — sequência composta

```typescript
// Implementar leader key manualmente com estado de tempo
function useLeaderKey(onSequence: (key: string) => void) {
  const leaderActive = useRef(false)
  const leaderTimer = useRef<Timer | null>(null)

  useKeyboard((key) => {
    if (key.ctrl && key.name === 'x') {
      leaderActive.current = true
      if (leaderTimer.current) clearTimeout(leaderTimer.current)
      leaderTimer.current = setTimeout(() => {
        leaderActive.current = false
      }, 1000) // 1s para pressionar a segunda tecla
      return
    }

    if (leaderActive.current) {
      leaderActive.current = false
      if (leaderTimer.current) clearTimeout(leaderTimer.current)
      onSequence(key.name ?? '')
    }
  })
}

// Uso em App.tsx
useLeaderKey((key) => {
  switch (key) {
    case 'b': setSidebarVisible(v => !v); break
    case 'h': setCommandPaletteOpen(true); break
    case 'm': setModelDialogOpen(true); break
    case 'n': handleNewSession(); break
  }
})
```

---

## Scroll e ScrollBox

O Ink não tinha scroll nativo. O OpenTUI tem `<scrollbox>` como primitivo.

```typescript
// MessageList — lista scrollável de mensagens
<scrollbox
  style={{
    flexGrow: 1,
    width: '100%',
    flexDirection: 'column',
  }}
  scrollY={scrollOffset}
  onScroll={(offset) => setScrollOffset(offset)}
>
  {messages.map(msg => (
    <Message key={msg.id} message={msg} />
  ))}
</scrollbox>
```

**Scroll programático (auto-scroll para o fim):**

```typescript
const scrollboxRef = useRef<ScrollBoxRenderable | null>(null)

// Auto-scroll ao receber nova mensagem
useEffect(() => {
  if (isAtBottom && scrollboxRef.current) {
    scrollboxRef.current.scrollToBottom()
  }
}, [messages])

// No JSX — refs funcionam normalmente com OpenTUI React
<scrollbox ref={scrollboxRef} style={{ flexGrow: 1 }}>
  {messages.map(msg => <Message key={msg.id} message={msg} />)}
</scrollbox>
```

**Keybinds de scroll — registrar no componente MessageList:**

```typescript
useKeyboard((key) => {
  const box = scrollboxRef.current
  if (!box) return

  if (key.name === 'pageup')   box.scroll(-10)
  if (key.name === 'pagedown') box.scroll(10)
  if (key.ctrl && key.name === 'u') box.scroll(-Math.floor(height / 2))
  if (key.ctrl && key.name === 'd') box.scroll(Math.floor(height / 2))
  if (key.name === 'g' && !key.shift) box.scrollToBottom()
  // 'gg' requer estado de double-press — implementar como leader key acima
})
```

---

## Componentes Especiais

### Diff — usar `<diff>` nativo

OpenTUI tem um componente `<diff>` nativo. Usar no `DiffView.tsx`.

```typescript
// DiffView.tsx
// ANTES: renderização manual com Text colorido por linha

// DEPOIS: componente nativo
<diff
  content={patchString}
  style={{
    width: '100%',
    addedLineBackground: '#1C361C',
    removedLineBackground: '#3A1A1A',
  }}
/>
```

### Markdown — usar `<markdown>` nativo

```typescript
// Para conteúdo de resposta do agente com markdown
<markdown
  content={message.content}
  style={{ fg: '#E0E0E0', width: '100%' }}
/>
```

### Code com syntax highlight — usar `<code>` nativo

```typescript
// BashOutput.tsx — para output de comandos bash
<code
  content={output}
  filetype="bash"
  style={{ width: '100%', fg: '#E0E0E0', bg: '#111111' }}
/>
```

### ASCIIFont — para o logo

O logo ASCII art da tela Home pode usar `<ascii-font>`:

```typescript
// HomeScreen.tsx
<ascii-font
  text="OpenKore"
  font="tiny"
  style={{ fg: '#7a9e7a', alignSelf: 'center' }}
/>
```

> Se o font "tiny" não produzir o resultado esperado, manter o ASCII art hardcoded em `<text>` como estava no Ink.

### Select — para modais de seleção

```typescript
// DialogModel.tsx
<select
  options={models.map(m => ({ label: m.name, value: m.id }))}
  onSelect={(option) => handleModelSelect(option.value)}
  style={{ width: 60, maxHeight: 10 }}
/>
```

---

## Animações e requestLive

O spinner Braille (80ms/frame) requer que o renderer rode em modo contínuo durante animações.

```typescript
// hooks/useSpinner.ts
import { useRenderer } from '@opentui/react'
import { useEffect, useState } from 'react'

const SPINNER_FRAMES = ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏']

export function useSpinner(active: boolean) {
  const renderer = useRenderer()
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    if (!active) return

    renderer.requestLive()
    const interval = setInterval(() => {
      setFrame(f => (f + 1) % SPINNER_FRAMES.length)
    }, 80)

    return () => {
      clearInterval(interval)
      renderer.dropLive()
    }
  }, [active, renderer])

  return active ? SPINNER_FRAMES[frame] : ''
}

// Uso em ToolBlock.tsx
function ToolBlock({ tool }: { tool: ToolCall }) {
  const spinner = useSpinner(tool.status === 'running')
  // ...
  return (
    <text>
      {tool.status === 'running' ? spinner : '✓'}
    </text>
  )
}
```

### setInterval para relógio e timers

```typescript
// StatusBar.tsx — relógio
// setInterval normal do JS funciona — Bun suporta
useEffect(() => {
  const interval = setInterval(() => {
    setTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
  }, 1000)
  return () => clearInterval(interval)
}, [])
```

> **Nota:** `setInterval` não requer `renderer.requestLive()` porque ele dispara re-render via `setState`, que já notifica o OpenTUI para re-renderizar.

---

## tsconfig.json

```json
{
  "compilerOptions": {
    "lib": ["ESNext", "DOM"],
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "jsxImportSource": "@opentui/react",
    "strict": true,
    "skipLibCheck": true
  }
}
```

> **Crítico:** `jsxImportSource` deve ser `"@opentui/react"`, não `"react"`. Isso faz o compilador usar o runtime JSX do OpenTUI em vez do React padrão. Sem isso, os elementos intrínsecos (`<box>`, `<text>`, etc.) não serão reconhecidos.

---

## Armadilhas Conhecidas

Erros comuns durante a migração e como evitá-los.

### 1. Elementos com letra maiúscula

```typescript
// ERRADO — Box e Text em maiúsculo são do Ink
import { Box, Text } from 'ink'
<Box><Text>...</Text></Box>

// CORRETO — minúsculo são intrínsecos do OpenTUI
<box><text>...</text></box>
```

### 2. Props fora de style

```typescript
// ERRADO — props de layout direto no elemento
<box flexDirection="column" width="100%">

// CORRETO — dentro de style
<box style={{ flexDirection: 'column', width: '100%' }}>
```

> **Exceção:** `fg`, `bg`, `bold`, `italic`, `underline` podem ir direto em `<text>` sem `style`.

### 3. console.log não aparece

Em OpenTUI, `console.log` é capturado pelo overlay interno. Para debugar:
- Usar `OTUI_USE_CONSOLE=false bun run ...` para ver logs no terminal
- Ou usar `renderer.console.log(...)` para ver no overlay interno
- **Nunca** deixar `console.log` em produção — definir `consoleMode: 'disabled'` no renderer

### 4. Sem top-level await no entrypoint

```typescript
// ERRADO — createCliRenderer é async
const renderer = createCliRenderer({...}) // retorna Promise, não renderer

// CORRETO
const renderer = await createCliRenderer({...})
```

### 5. useInput vs useKeyboard — escopo de captura

No Ink, `useInput` captura teclas globalmente. No OpenTUI, `useKeyboard` também captura globalmente, mas o componente `<input>` captura teclas de texto enquanto focado. Garantir que o `useKeyboard` no `InputField` não conflite com o `<input>` nativo para chars normais.

```typescript
// Correto: filtrar no useKeyboard apenas teclas especiais
useKeyboard((key) => {
  // Ignorar chars normais — deixar o <input> processar
  if (!key.ctrl && !key.meta && key.name && key.name.length === 1) return

  if (key.name === 'up') handleHistoryUp()
  if (key.name === 'down') handleHistoryDown()
})
```

### 6. borderStyle "round" vs "rounded"

```typescript
// ERRADO (valor Ink)
style={{ borderStyle: 'round' }}

// CORRETO (valor OpenTUI)
style={{ borderStyle: 'rounded' }}
```

### 7. Altura do root em alternate-screen

No OpenTUI com `screenMode: 'alternate-screen'`, o root já tem `height: '100%'`. Não passar `minHeight={process.stdout.rows}` — isso conflita com o sistema de layout do Yoga e pode causar corte de conteúdo.

### 8. Não usar node-specific APIs

```typescript
// ERRADO — usando API específica de Node
import { createInterface } from 'readline'

// CORRETO — usar APIs do OpenTUI
renderer.keyInput.on('keypress', ...)
```

### 9. Refs em componentes OpenTUI

```typescript
// Refs funcionam normalmente, mas o tipo é Renderable, não HTMLElement
import { type BoxRenderable } from '@opentui/core'
const ref = useRef<BoxRenderable | null>(null)

<box ref={ref}>...</box>
```

---

## Checklist de Verificação por Fase

Após refatorar cada fase (conforme `design-tui.md` seção 13), verificar:

### Fase 1 — Layout Root + StatusBar + InputField
- [ ] Sem imports de `ink` ou `ink-text-input` em nenhum arquivo da fase
- [ ] `tsconfig.json` com `jsxImportSource: "@opentui/react"`
- [ ] `createCliRenderer` com `backgroundColor: '#0A0A0A'`
- [ ] `<box>` root com `flexDirection: 'column'` e `height: '100%'`
- [ ] `<input>` com `focused={true}` e borda condicional
- [ ] Relógio via `setInterval` + `useState`
- [ ] `↑/↓` navega histórico via `useKeyboard`
- [ ] Sem `console.log` solto

### Fase 2 — MessageList
- [ ] `<scrollbox>` como container de mensagens
- [ ] Auto-scroll via ref + `scrollToBottom()`
- [ ] Spinner via `useSpinner` com `renderer.requestLive()`
- [ ] `useKeyboard` para PgUp/PgDown/Ctrl+U/D/G

### Fase 3 — ToolBlock
- [ ] `useSpinner` para status `running`
- [ ] `<diff>` nativo para `write_file`
- [ ] `<code>` nativo para `bash` output

### Fase 4 — Sidebar
- [ ] `useTerminalDimensions` para auto-colapso < 100 cols
- [ ] `<scrollbox>` se conteúdo da sidebar puder exceder altura
- [ ] Seção de Tarefas com spinner via `useSpinner`

### Fase 5 — Autocomplete
- [ ] Overlay com `position: 'absolute'` acima do `<input>`
- [ ] `<select>` para lista de opções
- [ ] `useKeyboard` para Tab/Esc/Enter no autocomplete

### Fase 6 — Toasts e Modais
- [ ] Toast com `position: 'absolute'` e `zIndex` alto
- [ ] Modal com `position: 'absolute'` + overlay semitransparente
- [ ] `renderer.destroy()` no handler de encerramento

---

## Ordem de Refatoração Recomendada

Seguir esta ordem minimiza regressões — cada passo é verificável antes de avançar.

```
1.  tsconfig.json          ← mudar jsxImportSource
2.  package.json           ← remover ink, adicionar opentui
3.  src/theme.ts           ← criar arquivo de tokens (novo)
4.  src/index.tsx          ← trocar render() por createCliRenderer + createRoot
5.  src/components/StatusBar.tsx
6.  src/components/InputField.tsx
7.  src/App.tsx            ← montar layout root com novos primitivos
    ── verificar Fase 1 ──
8.  src/components/Message.tsx
9.  src/components/ThinkingBlock.tsx
10. src/components/MessageList.tsx
    ── verificar Fase 2 ──
11. src/hooks/useSpinner.ts   ← novo hook
12. src/components/tools/DiffView.tsx
13. src/components/tools/BashOutput.tsx
14. src/components/ToolBlock.tsx
    ── verificar Fase 3 ──
15. src/components/sidebar/*.tsx
16. src/components/Sidebar.tsx
    ── verificar Fase 4 ──
17. src/hooks/useFuzzySearch.ts
18. src/hooks/useFrecency.ts
19. src/commands/registry.ts
20. src/components/Autocomplete.tsx
21. src/components/CommandPalette.tsx
    ── verificar Fase 5 ──
22. src/hooks/useToast.ts
23. src/components/Toast.tsx + ToastContainer.tsx
24. src/components/Modal.tsx
25. src/components/ToolApproval.tsx
26. src/components/Header.tsx
    ── verificar Fase 6 ──
27. Busca global por imports de 'ink' — devem ser zero
28. bun run — smoke test final
```

---

*OpenKore TUI — CONVENTIONS.md v1.0 — Ink → OpenTUI migration guide*
*Referência: https://opentui.com/docs | https://github.com/anomalyco/opentui*