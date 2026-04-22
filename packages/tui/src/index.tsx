import { createRoot } from '@opentui/react';
import { TerminalManager } from './core/TerminalManager';
import { ThemeProvider } from './core/ThemeContext';
import { App } from './App';

const terminal = TerminalManager.getInstance();
const renderer = await terminal.initialize();

createRoot(renderer).render(
  <ThemeProvider syntaxStyle={terminal.syntaxStyle}>
    <App />
  </ThemeProvider>
);
