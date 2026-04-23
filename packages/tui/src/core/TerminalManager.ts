import { createCliRenderer, type CliRenderer, SyntaxStyle } from '@opentui/core';
import { theme } from '../theme';

export class TerminalManager {
  private static instance: TerminalManager;
  private _renderer: CliRenderer | null = null;
  private _syntaxStyle: SyntaxStyle | null = null;

  private constructor() {}

  public static getInstance(): TerminalManager {
    if (!TerminalManager.instance) {
      TerminalManager.instance = new TerminalManager();
    }
    return TerminalManager.instance;
  }

  public async initialize(): Promise<CliRenderer> {
    if (this._renderer) return this._renderer;

    this._renderer = await createCliRenderer({
      exitOnCtrlC: false,
      screenMode: 'alternate-screen',
      backgroundColor: theme.bg,
      width: process.stdout.columns,
      height: process.stdout.rows,
      targetFps: 30,
      maxFps: 60,
      useKittyKeyboard: {},
      consoleMode: 'disabled',
    });

    // Inicializa o motor de syntax highlighting
    this._syntaxStyle = SyntaxStyle.create();

    this.setupCleanup();
    return this._renderer;
  }

  public disableMouse() {
    process.stdout.write('\x1b[?1000l\x1b[?1002l\x1b[?1003l\x1b[?1006l');
  }

  public enableMouse() {
    process.stdout.write('\x1b[?1000h\x1b[?1002h\x1b[?1003h\x1b[?1006h');
  }

  private setupCleanup() {
    const cleanup = () => {
      if (this._syntaxStyle) {
        this._syntaxStyle.destroy();
        this._syntaxStyle = null;
      }
      if (this._renderer) {
        this._renderer.destroy();
        this._renderer = null;
      }
      process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
  }

  public get renderer(): CliRenderer {
    if (!this._renderer) {
      throw new Error('TerminalManager not initialized. Call initialize() first.');
    }
    return this._renderer;
  }

  public get syntaxStyle(): SyntaxStyle {
    if (!this._syntaxStyle) {
      this._syntaxStyle = SyntaxStyle.create();
    }
    return this._syntaxStyle;
  }
}
