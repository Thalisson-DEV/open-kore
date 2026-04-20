# .kore/rules.md

## 1. Contexto do Sistema
- **Propósito Técnico**: Desenvolver um assistente automatizado para jogos MMORPG, focado em tarefas de roteamento e interação com o servidor através da API OpenKore.
- **Domínio**: Jogos Online Multiplayer (MMORPG), Sistema de Roteamento, Interação Servidor-Jogador.

## 2. Padrões Arquiteturais
- **Arquitetura**: Monolito Modular & DDD
  - Siga princípios de Domain-Driven Design (DDD).
  - Comunicação entre módulos apenas via eventos ou interfaces.
  - Isole a lógica de domínio dos frameworks externos.

## 3. Stack e Bibliotecas
- **Tecnologias Principais**:
  - Node.js
  - Express.js para o servidor HTTP
  - OpenKore API para comunicação com o jogo
  - TypeScript para tipagem forte
  - Bun (em vez de fs) para manipulação de arquivos
  - React para UI frontend (se necessário)
- **Preferências de Implementação**:
  - Use `Bun.file` em vez de `fs`.
  - Utilize componentes funcionais e hooks no React.
  - Mantenha tipagem forte com TypeScript.

## 4. Anti-Padrões (O que NÃO fazer)
- Evite o uso direto do OpenKore API dentro da lógica de domínio.
- Não utilize frameworks ou bibliotecas não necessárias, mantendo a simplicidade do código.
- Refuse a adição de dependências desnecessárias ou complexas que possam dificultar a manutenção.

## 5. Código de Conduta da IA
- Retorne apenas o código relevante.
- Não explique o óbvio.
- Mantenha tipagem forte.
- Utilize comandos e sintaxe corretos para evitar erros na implementação.

---

### Exemplo de Implementação

```typescript
// src/domain/entities/Player.ts
export interface Player {
  id: string;
  name: string;
  level: number;
}

```

```typescript
// src/application/services/LoginService.ts
import { OpenKoreApi } from 'openkore-api';

export class LoginService {
  private api: OpenKoreApi;

  constructor() {
    this.api = new OpenKoreApi();
  }

  async login(username: string, password: string): Promise<Player> {
    await this.api.connect();
    const player = await this.api.login(username, password);
    return player;
  }
}

```

```typescript
// src/presentation/controllers/LoginController.ts
import { LoginService } from '../application/services/LoginService';

export class LoginController {
  private loginService: LoginService;

  constructor(loginService: LoginService) {
    this.loginService = loginService;
  }

  async handle(req, res) {
    const { username, password } = req.body;
    try {
      const player = await this.loginService.login(username, password);
      return res.status(200).json(player);
    } catch (error) {
      return res.status(401).send('Login failed');
    }
  }
}

```

---

**Nota:** Este exemplo é uma implementação simplificada e deve ser adaptado conforme necessário para o projeto completo.