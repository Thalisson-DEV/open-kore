# .kore/rules.md

## 1. Contexto do Sistema
**Propósito Técnico**: O sistema é uma implementação do jogo OpenKore, um software de automação para jogos MMORPGs (Massively Multiplayer Online Role-Playing Games), que permite interações automatizadas com os servidores de um jogo específico.

**Domínio**: Automatização de Ações em MMORPGs

## 2. Padrões Arquiteturais
- **Arquitetura**: Monolito Modular
- **Comunicação entre módulos**: Realize comunicação através de interfaces ou eventos.
- **Isolamento de camadas**: Lógica de negócio separada da lógica de interface com o usuário e do código de infraestrutura.

## 3. Stack e Bibliotecas
- Utilize OpenKore API para interação com o jogo.
- Implemente usando estruturas de dados nativas (ex: `Array`, `Object`).
- Evite a utilização desnecessária de bibliotecas externas, exceto as especificamente necessárias para funcionalidades do jogo.

## 4. Anti-Padrões (O que NÃO fazer)
- **Não use** frameworks ou bibliotecas não relacionadas ao jogo OpenKore.
- **Evite** a implementação direta de lógica de negócio em camadas que deveriam ser interfaciais.
- **Não adicione** código que gere dependências externas, a menos que seja absolutamente necessário.

## 5. Código de Conduta da IA
- **Retorne apenas o código necessário**, sem explicações adicionais ou conversa fiada.
- **Mantenha tipagem forte**: Use tipos explícitos para variáveis e funções quando for relevante.
- **Evite comentários desnecessários**; use-os apenas quando absolutamente essenciais.