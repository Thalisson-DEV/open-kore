# Releases

## [v0.1.1] - 22-04-2026

### Resumo
Este lançamento marca um grande marco arquitetural para o **OpenKore**, migrando toda a stack da Interface de Usuário de Terminal (TUI) do Ink para o **OpenTUI**. Essa transição traz performance nativa (60fps), uma arquitetura modular robusta e uma experiência de usuário significativamente mais polida.

---

### Refatoração & Arquitetura
- **Migração da Stack TUI**: Substituição do `ink` e `ink-text-input` pelo `@opentui/core` e `@opentui/react`.
- **Núcleo OOP Modular**:
  - `TerminalManager`: Controle centralizado para o ciclo de vida do renderer e estilos de sintaxe.
  - `KeyboardManager`: Gerenciamento avançado de atalhos e sequências de teclas de liderança (*leader key* `Ctrl+X`).
  - `HistoryManager`: Serviço dedicado para gerenciamento do histórico de comandos.
- **Sistema de Temas**: Implementação de um `theme.ts` centralizado para uma identidade visual consistente.

### Funcionalidades
- **Componentes Nativos de Alta Performance**:
  - Integração do `<markdown>` para respostas ricas e rápidas do assistente.
  - Integração do `<diff>` para visualizações claras de modificações em arquivos.
  - Integração do `<code>` para saídas de bash e código com realce de sintaxe.
- **Sidebar Unificada**: Consolidação do contexto da sessão, agentes ativos, arquivos tocados e dicas em um único painel eficiente.
- **Sticky Scroll**: Rolagem nativa de mensagens que acompanha automaticamente a resposta mais recente.
- **Seletores Personalizados**: Implementação de menus de seleção robustos e integrados ao tema para o Setup e Ações Rápidas (`Ctrl+O`).

### Correções de Bugs
- **Corrupção do Terminal**: Corrigido um problema onde sair do aplicativo com `Ctrl+C` deixava o terminal em um estado quebrado (caracteres aleatórios).
- **Estabilidade de Stream**: Corrigidos crashes que ocorriam durante o cancelamento rápido de streams (`Esc`).
- **Integridade do Layout**: Resolvidos diversos problemas de Flexbox que causavam a divisão incorreta ou renderização errônea do chat.

### Alterações Quebrantes (*Breaking Changes*)
- **Remoção da StatusBar**: A barra de status inferior foi removida. Todas as informações essenciais estão agora localizadas na Sidebar.
- **Atualização da Stack**: O **Zig** agora é necessário para build do núcleo nativo da aplicação.

---

## [v0.1.0-alpha] - 15-04-2026
- Lançamento Alpha inicial com TUI básica baseada em Ink.
- Suporte para provedores OpenRouter e Ollama.
- Mapeamento básico de projeto e geração de regras.
