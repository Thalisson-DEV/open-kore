# OpenKore

<div align="center">

**O agente de coding open source para quem vive no terminal.**

[![NPM Version](https://img.shields.io/npm/v/openkore.svg)](https://www.npmjs.com/package/openkore)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://img.shields.io/github/actions/workflow/status/openkore/openkore/ci.yml?branch=main)](https://github.com/openkore/openkore/actions)

[English](README.md) | [Português (Brasil)](README.md) | [简体中文](README.md) | [日本語](README.md) | [한국어](README.md) | [Español](README.md)

</div>

---

**OpenKore** é um agente de IA 100% open source, escrito em TypeScript e otimizado para o runtime Bun. Ele oferece uma experiência de terminal rica (TUI) e uma arquitetura extensível de agentes para automação de desenvolvimento, análise de código e exploração de bases legadas.

## OpenKore Terminal UI

![OpenKore TUI Placeholder](https://raw.githubusercontent.com/openkore/openkore/main/assets/tui-demo.png)

## Instalação

### Rápida (YOLO)
```bash
curl -fsSL https://openkore.ai/install | bash
```

### Gerenciadores de Pacotes
```bash
# Via NPM
npm i -g openkore@latest

# Via Bun (Recomendado)
bun install -g openkore

# Via Homebrew (macOS e Linux)
brew install openkore/tap/openkore
```

## Agentes

O OpenKore inclui agentes especializados que você pode alternar usando a tecla `Tab`.

| Agente | Descrição | Modo |
| :--- | :--- | :--- |
| **build** | Agente padrão com acesso total para desenvolvimento e refatoração. | Leitura + Escrita |
| **plan** | Agente de leitura para análise e exploração de código. Ideal para planejar mudanças. | Somente Leitura |
| **agent-builder** | Um agente especializado em criar outros agentes personalizados para o seu projeto. | Leitura + Escrita |

> Além dos embutidos, você pode criar agentes personalizados em `.openkore/agents/` usando YAML ou TypeScript.

## Por que OpenKore?

- **100% Open Source:** Sem segredos, sem telemetria forçada, total transparência.
- **Provider-Agnostic:** Funciona com Claude, OpenAI, Google ou modelos locais via **Ollama** e **OpenRouter**.
- **Arquitetura Client/Server:** O servidor pode rodar remotamente enquanto você usa a TUI localmente.
- **Runtime Bun:** Startup instantâneo (< 50ms) e performance superior.
- **LSP Integrado:** Suporte nativo para compreensão profunda de símbolos e tipos.

## Documentação

Para mais detalhes sobre configuração, comandos e criação de agentes, visite nossa [Documentação Oficial](https://docs.openkore.ai).

## Contribuição

Interessado em ajudar? Leia nosso guia de [CONTRIBUTING.md](CONTRIBUTING.md) antes de enviar um Pull Request.

## Segurança

Segurança é prioridade. Veja nossa política em [SECURITY.md](SECURITY.md).

## FAQ

### Como o OpenKore se diferencia do Claude Code ou OpenCode?
O OpenKore é inspirado no OpenCode, mas foca em ser **100% TypeScript/Bun native**. Enquanto outras ferramentas podem ser acopladas a provedores específicos, o OpenKore prioriza a soberania de dados com suporte de primeira classe ao Ollama, permitindo que você rode agentes complexos 100% offline ou via OpenRouter.

### Posso usar meus próprios modelos?
Sim. Através do Ollama, você pode usar Llama 3, Qwen 2.5 Coder, DeepSeek ou qualquer modelo local compatível.

---

<div align="center">
Feito com ❤️ pela comunidade OpenKore.
</div>
