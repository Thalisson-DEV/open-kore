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
