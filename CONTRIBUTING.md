# Contribuindo para o OpenKore

Primeiramente, obrigado por se interessar em contribuir para o OpenKore! Como um projeto open source, dependemos da comunidade para evoluir e melhorar.

## 🚀 Setup Local

O OpenKore utiliza um monorepo gerenciado pelo [Turborepo](https://turbo.build/) e o runtime [Bun](https://bun.sh/).

### Pré-requisitos
- [Bun](https://bun.sh/docs/installation) (versão 1.1 ou superior)
- Git

### Passos
1. Clone o repositório:
   ```bash
   git clone https://github.com/openkore/openkore.git
   cd openkore
   ```

2. Instale as dependências:
   ```bash
   bun install
   ```

3. Inicie o ambiente de desenvolvimento:
   ```bash
   bun dev
   ```

Este comando iniciará o servidor e a TUI em modo de observação (watch mode).

## 📁 Estrutura do Projeto

O projeto é dividido em pacotes dentro do diretório `packages/`:

- `packages/server`: O "core" do OpenKore. Contém a lógica dos agentes, integração com LLMs, ferramentas (tools) e gerenciamento de contexto.
- `packages/tui`: A interface de terminal construída com React e Ink.

## 🛠️ Desenvolvimento

### Padrões de Código
- Usamos **TypeScript** para tudo.
- Mantenha as funções pequenas e focadas.
- Adicione tipos explícitos sempre que possível.
- Use `bun run typecheck` para verificar erros de tipo.

### Testes
Ainda estamos expandindo nossa cobertura de testes. Se adicionar uma nova funcionalidade, tente incluir um teste básico.
```bash
bun test
```

## 📮 Processo de Pull Request

1. Crie uma branch para sua alteração: `git checkout -b feature/minha-melhoria`.
2. Faça seus commits seguindo o padrão [Conventional Commits](https://www.conventionalcommits.org/).
3. Certifique-se de que o build e os tipos estão passando: `bun run build`.
4. Envie sua branch: `git push origin feature/minha-melhoria`.
5. Abra um Pull Request descrevendo claramente o que foi alterado e o porquê.

## ⚖️ Código de Conduta

Seja gentil e profissional. Estamos todos aqui para aprender e construir algo incrível juntos.

---

Se tiver dúvidas, abra uma **Issue** ou junte-se ao nosso Discord!
