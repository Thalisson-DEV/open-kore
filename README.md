# OpenKore

> Um agente de IA para desenvolvedores que vivem no terminal.

**OpenKore** é um agente de coding open source, 100% TypeScript, inspirado na arquitetura e experiência do OpenCode. Suporta qualquer modelo via OpenRouter e modelos locais via Ollama. Agentes personalizados são cidadãos de primeira classe — incluindo um agente especializado em criar outros agentes.

---

## Instalação

```bash
npm install -g openkore
```

## Uso

```bash
openkore
```

---

## Interface

---

## Agentes

O OpenKore vem com agentes embutidos que você troca com `Tab`.

| Agente | Descrição | Modo |
|---|---|---|
| **backend** | Desenvolvimento backend, APIs, bancos de dados | Leitura + Escrita |
| **frontend** | UI, CSS, componentes, acessibilidade | Leitura + Escrita |
| **plan** | Análise e exploração de código — sem edições | Somente leitura |
| **agent-builder** | Cria e configura agentes personalizados para o seu contexto | Leitura + Escrita |

Agentes personalizados ficam em `.openkore/agents/` no diretório do projeto.

---

## Providers

```bash
openkore --provider openrouter --model qwen/qwen3-coder:free
openkore --provider ollama --model llama3.2
```

Configuração inicial interativa no primeiro boot — sem editar arquivos YAML manualmente.

---

## Filosofia

**Provider-agnostic.** OpenRouter dá acesso a qualquer modelo. Ollama para soberania total dos dados.

**Agentes como código.** Cada agente é um arquivo TypeScript ou YAML no seu projeto — versionável, compartilhável, editável.

**Contexto inteligente.** O orquestrador controla o budget de tokens, trunca outputs grandes e evita loops sem precisar de configuração manual.

---

**Licença:** MIT  
**Inspiração:** [OpenCode](https://github.com/anomalyco/opencode)