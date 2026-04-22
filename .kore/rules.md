# 1. Contexto do Sistema
## Propósito Técnico e Domínio
O sistema OpenKore é uma aplicação orientada a ROBOS que interage com um jogo online, controlando personagens automatizados através de scripts pré-definidos. O domínio envolve o gerenciamento de estados de personagens, interações com o servidor do jogo e execução de tarefas automatizadas.

# 2. Padrões Arquiteturais
## Arquitetura
- **Clean Architecture**: Siga estritamente os princípios de Clean Architecture.
- **DDD (Domain Driven Design)**: Implemente as entidades, agregações e regras de negócio do domínio do jogo no núcleo do sistema.

## Regras de Acoplamento e Isolamento
- Comunicação entre camadas apenas através de interfaces bem definidas.
- O módulo de execução dos scripts (UI) deve ser totalmente isolado das camadas de domínio e infraestrutura.
- Use eventos para comunicação entre camadas.

# 3. Stack e Bibliotecas
## Tecnologias Principais
- **Linguagem**: Python
- **Framework**: OpenKore

## Preferências de Implementação
- Use `OpenKore` APIs em vez de baixar o código fonte manualmente.
- Utilize bibliotecas padrão do Python (ex: `os`, `sys`) em vez de pacotes externos não-oficiais.

# 4. Anti-Padrões (O que NÃO fazer)
## Restrições Estritas
- **Evitar Dependências Externas**: Não adicione dependências externas que possam introduzir instabilidade no sistema.
- **Mantenha Código Limpo**: Refatorações devem manter a consistência do código existente.

# 5. Código de Conduta da IA
## Instruções para o Modelo
- Retorne apenas código relevante.
- Não explique o óbvio.
- Mantenha tipagem forte onde necessário, mas não seja excessivo.
- Use nomes de variáveis e funções que refletem o domínio do jogo (ex: `loginAttempt`, `gameEvent`).
- Evite comentários desnecessários, mas forneça um título para seções importantes.

Este arquivo .kore/rules.md segue a estrutura solicitada, focando em diretivas técnicas e direcionamento sem conversa adicional.