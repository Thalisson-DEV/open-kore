# 1. Contexto do Sistema
## Propósito Técnico
Este sistema é uma implementação de OpenKore, um script para jogos MMORPGs (Massively Multiplayer Online Role-Playing Games), focado em automação e microuniverso.

## Domínio do Sistema
O domínio deste sistema envolve a interação com interfaces gráficas de jogos MMORPGs, análise de estados do jogo, tomada de decisões baseadas em regras pré-definidas, e execução de ações automatisadas para realizar tarefas como coleta de recursos, combates, etc.

# 2. Padrões Arquiteturais
## Arquitetura Adoptada
- **Clean Architecture**: Implementação com foco na separação de preocupações entre camadas de domínio, aplicação e infraestrutura.
  
## Regras de Acoplamento e Isolamento de Camadas
- Domínio: Contém as regras do negócio sem dependência de frameworks ou infraestrutura.
- Aplicação: Interface entre o domínio e a interface gráfica do jogo (GUI), implementa lógica de fluxo de dados, mapeamentos entre domínio e GUI.
- Infraestrutura: Responsável por interfaces externas ao sistema, como interações com o jogo (APIs).

# 3. Stack e Bibliotecas
## Tecnologias Principais
- **OpenKore**: Framework principal para a implementação do script.

## Preferências de Implementação
- Use OpenKore APIs e funcionalidades em vez de interfaces externas não suportadas.
- Utilize TypeScript para manter a tipagem forte e evitar erros de tipo.

# 4. Anti-Padrões (O que NÃO fazer)
- **Evitar:**
  - Dependências diretas do jogo ou qualquer API não oficial.
  - Código duplicado em diferentes partes do sistema.
  - Lógica de domínio interscindível à camada de aplicação.

# 5. Código de Conduta da IA
## Instruções para o Modelo
- **Retorne apenas código**: Não adicione explicações desnecessárias ou conversa fiada.
- **Não explique o óbvio**: Atenção aos detalhes técnicos e minimize a redundância na descrição.
- **Mantenha tipagem forte**: Em TypeScript, utilize anotações de tipo explícitas para todos os tipos complexos.

## Exemplo de Código
```typescript
// Arquivo example.ts
export interface PlayerState {
  health: number;
  mana: number;
}

const playerHealthCheck = (state: PlayerState): boolean => {
  return state.health < 50 && state.mana > 20;
};

if (playerHealthCheck(currentPlayerState)) {
  performHealing();
}
```

**Nota:** Este exemplo ilustra o uso de tipagem forte em TypeScript.