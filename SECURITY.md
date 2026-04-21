# Política de Segurança

Valorizamos a segurança da nossa comunidade e levamos a sério qualquer vulnerabilidade encontrada no OpenKore.

## Versões Suportadas

Atualmente, apenas a versão principal (main) recebe atualizações de segurança.

| Versão | Suportada |
| :--- | :--- |
| 0.1.x | ✅ Sim |
| < 0.1.0 | ❌ Não |

## Reportando uma Vulnerabilidade

Se você encontrar uma vulnerabilidade de segurança, por favor **não abra uma issue pública**. Em vez disso, envie um e-mail para `security@openkore.ai` ou utilize o recurso de "Private Vulnerability Reporting" do GitHub.

Nossa equipe revisará o reporte e responderá em até 48 horas.

## Boas Práticas de Uso

O OpenKore é um agente potente capaz de executar comandos no seu terminal e ler/escrever arquivos. Para sua segurança:

1. **Nunca** rode o OpenKore em diretórios com arquivos sensíveis ou segredos sem supervisão.
2. **Revise** as permissões solicitadas pelos agentes (especialmente comandos `bash`).
3. **Mantenha** suas chaves de API do OpenRouter ou OpenAI seguras e nunca as compartilhe.
4. Ao usar modelos locais via **Ollama**, o processamento é feito 100% na sua máquina, garantindo que nenhum dado saia do seu ambiente.

---

Obrigado por ajudar a manter o OpenKore seguro!
