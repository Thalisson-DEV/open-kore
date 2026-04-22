import { type KeyEvent } from '@opentui/core';

export type KeyHandler = (key: KeyEvent) => void;

export class KeyboardManager {
  private static instance: KeyboardManager;
  private handlers: Set<KeyHandler> = new Set();
  private leaderActive = false;
  private leaderTimer: Timer | null = null;

  private constructor() {}

  public static getInstance(): KeyboardManager {
    if (!KeyboardManager.instance) {
      KeyboardManager.instance = new KeyboardManager();
    }
    return KeyboardManager.instance;
  }

  public register(handler: KeyHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  public handleKeyPress(key: KeyEvent) {
    // Leader key logic (Ctrl+X)
    if (key.ctrl && key.name === 'x') {
      this.leaderActive = true;
      if (this.leaderTimer) clearTimeout(this.leaderTimer);
      this.leaderTimer = setTimeout(() => {
        this.leaderActive = false;
      }, 1000);
      return;
    }

    if (this.leaderActive) {
      this.leaderActive = false;
      if (this.leaderTimer) clearTimeout(this.leaderTimer);
      // Sequence handling could be more advanced, but for now we just pass it to handlers
      // indicating it's a sequence if needed, or handlers can check leader state.
    }

    for (const handler of this.handlers) {
      handler(key);
    }
  }

  public isLeaderActive(): boolean {
    return this.leaderActive;
  }
}
