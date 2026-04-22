Este é o arquivo de regras de alto nível. Não contém nenhuma introdução, conclusão ou texto conversacional.

***

```markdown
# OpenKore Project Guidelines (Rules.md)

## 1. Contexto do Sistema
O domínio do sistema é o Processamento Core de Conhecimento Estruturado (Knowledge Core Processing).
O OpenKore deve ser um sistema robusto de backend responsável por receber dados brutos (Raw Data) e transformá-los em estruturas de domínio coesas, seguindo princípios de Imutabilidade e Transacionalidade.
**Ubiquitous Language:** Entidades, Casos de Uso, Domínio, Porta, Adaptador.

## 2. Padrões Arquiteturais
A arquitetura mandatória é **Clean Architecture (Arquitetura Limpa)**, implementando o padrão **Domain-Driven Design (DDD)**.

### Diretrizes de Camadas:
1. **Domain Layer (Core):** Deve ser a camada mais isolada. Contém apenas modelos de valor (Value Objects), entidades e interfaces de repositório (Ports). Não deve ter dependência de *frameworks* ou tecnologias externas (ex: ORMs, HTTP).
2. **Application Layer (Use Cases):** Contém a lógica de orquestração de casos de uso (Use Cases). Esta camada implementa o fluxo transacional, chamando métodos no domínio e utilizando as interfaces definidas no Domain Layer.
3. **Infrastructure Layer (Adapters):** Implementa as portas (Ports) definidas no Domain Layer. É onde residem os adaptadores concretos (e.g., PostgreSQLAdapter, RESTClientAdapter).
4. **Presentation Layer (Gateways):** Responsável apenas por receber a requisição e delegá-la ao Application Layer.

### Regras de Acoplamento:
* **Direção de Dependência:** As dependências devem fluir estritamente do nível de abstração mais alto para o mais baixo (Presentation $\to$ Application $\to$ Domain). O Domain Layer não pode depender de nenhuma outra camada.
* **Comunicação:** A comunicação entre Use Cases ou módulos deve ocorrer exclusivamente através de Eventos de Domínio (Domain Events) ou através da injeção de dependência de Interfaces (Ports).
* **Código de Domínio:** A lógica de negócios deve residir exclusivamente nas entidades e serviços de domínio. A manipulação de dados (Data Access Logic) deve ser encapsulada nos Repositórios (Infrastructure).

## 3. Stack e Bibliotecas
* **Linguagem:** TypeScript (preferencialmente) ou Python 3.10+.
* **Tipagem:** Tipagem Forte (Strict Typing) é obrigatória. A inferência de tipos deve ser usada apenas quando não for possível garantir o rigor da tipagem estática.
* **Estruturação:** Preferir estruturas modulares (Microkernel Pattern) para encapsular cada serviço de domínio.
* **Persistência:** Utilizar um ORM assíncrono e tipado (ex: TypeORM/Prisma, ou equivalent). Todas as operações de persistência devem ser transacionais.
* **Testes:** Uso obrigatório de testes unitários, testes de integração e testes de ponta a ponta (E2E). A cobertura de teste deve ser $\ge 90\%$ para a camada de domínio e serviços.
* **Formatação:** A padronização de código deve ser rigorosa. Utilizar linters e formatters automatizados (Prettier, ESLint, etc.) com configuração obrigatória no `package.json` (ou equivalente).

## 4. Anti-Padrões (Proibições Estritas)
1. **Global State:** É estritamente proibido o uso de variáveis de estado global ou de sessão sem encapsulamento e controle de concorrência.
2. **Fat Controllers/God Objects:** Não deve haver classes que contenham lógica de negócios, de acesso a dados e de manipulação de requisições. Cada responsabilidade deve ser segregada.
3. **Mixed Concerns:** Jamais misturar código de acesso a dados (SQL) com lógica de negócios (Domain Logic) dentro do mesmo método ou serviço.
4. **Hardcoding:** Não pode haver *hardcoding* de credenciais, endpoints, ou valores de domínio em qualquer camada superior à Domain Layer.

## 5. Código de Conduta da IA (Tier 2 Instruction Set)
1. **Formato:** Retorne código apenas dentro dos blocos Markdown. Evite texto explicativo fora dos blocos.
2. **Profundidade:** Quando fornecer código, inclua sempre comentários de propósito (*Why*) e não apenas de sintaxe (*What*).
3. **Tipagem:** O código retornado deve ser 100% tipado e seguir o rigor da tipagem estática definido na seção 3.
4. **Requisitos:** Assuma que todas as dependências de pacotes e *setups* de ambiente são tipados e funcionais.
5. **Tom:** Mantenha um tom técnico, conciso e diretivo em todas as respostas.
```