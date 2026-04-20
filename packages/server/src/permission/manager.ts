import { EventEmitter } from 'events';

export type PermissionAction = 'yes' | 'no' | 'always';

export class PermissionManager extends EventEmitter {
  private static instance: PermissionManager;
  private pending = new Map<string, (action: PermissionAction) => void>();

  private constructor() {
    super();
  }

  public static getInstance(): PermissionManager {
    if (!PermissionManager.instance) {
      PermissionManager.instance = new PermissionManager();
    }
    return PermissionManager.instance;
  }

  /**
   * Registra uma requisição de permissão e aguarda a resolução.
   */
  async waitFor(id: string): Promise<PermissionAction> {
    return new Promise((resolve) => {
      this.pending.set(id, resolve);
    });
  }

  /**
   * Resolve uma permissão pendente. Chamado via API (POST /permission/:id).
   */
  resolve(id: string, action: PermissionAction) {
    const resolver = this.pending.get(id);
    if (resolver) {
      resolver(action);
      this.pending.delete(id);
    }
  }
}
