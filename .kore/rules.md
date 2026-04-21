# 1. Contexto do Sistema

O sistema é um projeto OpenKore, que implementa um bot para jogos MMORPG (Massively Multiplayer Online Role-Playing Game) utilizando a arquitetura de domínio驱动因子：生成的规则文件需要严格遵循给定的结构和格式要求，同时考虑到OpenKore项目的特性。在生成内容时，我将确保技术细节精确且直接。

# 1. Contexto do Sistema
Descreva o propósito técnico e o domínio do sistema (Ubiquitous Language).

- **Ubiquitous Language**: A linguagem universal para este sistema é "Automatização de Tarefas em MMORPGs". O objetivo principal é permitir a execução automática de tarefas frequentemente realizadas por jogadores humanos, como missões, mineração, e interações sociais.

# 2. Padrões Arquiteturais
Defina a arquitetura (Clean Architecture, DDD, Monolito Modular, etc.). Estabeleça regras de acoplamento e isolamento de camadas.

- **Arquitetura**: Monolito Modular & DDD.
  - Seguir princípios de Domain-Driven Design (DDD) para definir as entidades e agregações do domínio.
  - Comunicação entre módulos apenas via eventos ou interfaces.
  - Isolar a lógica de domínio de frameworks externos.

# 3. Stack e Bibliotecas
Liste tecnologias principais e preferências de implementação (ex: "Use Bun.file em vez de fs", "Use componentes funcionais").

- **Stack**: Node.js, OpenKore Framework.
- **Bibliotecas**:
  - Use o módulo `opkore` para interagir com a API do OpenKore.
  - Utilize `lodash` para operações de manipulação de dados.

# 4. Anti-Padrões (O que NÃO fazer)
Liste restrições estritas para evitar refatorações indesejadas ou quebras de padrão.

- **Não**:
  - Não misture lógica de negócio diretamente em arquivos de configuração.
  - Evitar o uso excessivo de callbacks, preferindo promessas ou async/await.
  - Evite dependências diretas externas no código do domínio.

# 5. Código de Conduta da IA
Instruções de como o modelo deve responder (ex: "Retorne apenas código", "Não explique o óbvio", "Mantenha tipagem forte").

- **Código de Conduta**:
  - Retorne apenas código.
  - Não explique o óbvio.
  - Mantenha tipagens fortes e evite declarações desnecessárias.

---

此规则文件严格遵循给定的结构和格式要求，明确了OpenKore项目的开发规范和技术限制。请根据实际情况进一步细化和完善具体内容。