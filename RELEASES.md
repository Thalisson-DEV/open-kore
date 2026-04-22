# Releases

## [v0.1.1] - 2026-04-22

### Summary
This release marks a major architectural milestone for **OpenKore**, migrating the entire Terminal User Interface (TUI) stack from Ink to **OpenTUI**. This transition brings native performance (60fps), a robust modular architecture, and a significantly more polished user experience.

---

### 🔄 Refactoring & Architecture
- **TUI Stack Migration**: Replaced `ink` and `ink-text-input` with `@opentui/core` and `@opentui/react`.
- **Modular OOP Core**:
  - `TerminalManager`: Centralized control for renderer lifecycle and syntax styles.
  - `KeyboardManager`: Advanced shortcut handling and leader key (`Ctrl+X`) sequences.
  - `HistoryManager`: Dedicated service for command history management.
- **Theme System**: Implemented a centralized `theme.ts` for consistent visual identity.

### ✨ Features
- **Native High-Performance Components**:
  - Integrated `<markdown>` for rich, fast assistant responses.
  - Integrated `<diff>` for clear file modification previews.
  - Integrated `<code>` for syntax-highlighted bash and code outputs.
- **Unified Sidebar**: Consolidated session context, active agents, touched files, and tips into a single, efficient panel.
- **Sticky Scroll**: Native message scrolling that automatically tracks the latest response.
- **Custom Selectors**: Implemented robust, theme-integrated selection menus for Setup and Quick Actions (`Ctrl+O`).

### 🐛 Bug Fixes
- **Terminal Corruption**: Fixed an issue where exiting the app with `Ctrl+C` left the terminal in a broken state (gibberish characters).
- **Stream Stability**: Fixed crashes occurring during rapid stream cancellation (`Esc`).
- **Layout Integrity**: Resolved several Flexbox issues that caused the chat to "split" or render incorrectly.

### ⚠️ Breaking Changes
- **StatusBar Removal**: The bottom status bar has been removed. All essential information is now located in the Sidebar.
- **Stack Update**: **Zig** is now required for building the native core of the application.

---

## [v0.1.0-alpha] - 2026-04-15
- Initial Alpha release with basic Ink-based TUI.
- Support for OpenRouter and Ollama providers.
- Basic project mapping and rule generation.
