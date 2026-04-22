export class HistoryManager {
  private history: string[] = [];
  private index: number = -1;
  private currentInput: string = '';

  constructor(initialHistory: string[] = []) {
    this.history = initialHistory;
  }

  public add(entry: string) {
    if (entry.trim() && this.history[0] !== entry) {
      this.history.unshift(entry);
    }
    this.index = -1;
    this.currentInput = '';
  }

  public up(currentInput: string): string {
    if (this.index === -1) {
      this.currentInput = currentInput;
    }

    if (this.index < this.history.length - 1) {
      this.index++;
      return this.history[this.index];
    }
    
    return this.history[this.index] || currentInput;
  }

  public down(): string {
    if (this.index > 0) {
      this.index--;
      return this.history[this.index];
    }
    
    if (this.index === 0) {
      this.index = -1;
      return this.currentInput;
    }

    return this.currentInput;
  }

  public reset() {
    this.index = -1;
    this.currentInput = '';
  }

  public getHistory(): string[] {
    return [...this.history];
  }
}
