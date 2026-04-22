# 1. Contexto do Sistema
## Propósito Técnico e Domínio
O sistema OpenKore é uma plataforma de automação para jogos, especificamente projetada para interagir e automatizar tarefas em ambientes de MMORPGs (Massively Multiplayer Online Role-Playing Games). O objetivo principal é permitir a criação de bots personalizados que podem executar comandos pré-definidos para realizar tarefas como mineração, pesca ou batalhas.

## Ubiquitous Language
- Bot: Um script ou conjunto de instruções configurado para automatizar tarefas.
- Scene: Uma sessão do jogo onde o bot opera.
- Evento: Uma ação desencadeada pelo jogo que pode ser respondida pelo bot.
- Comando: Instrução específica executada pelo bot.

# 2. Padrões Arquiteturais
## Arquitetura Monolito Modular & DDD
- **Siga princípios de Domain-Driven Design (DDD).**
- **Comunicação entre módulos apenas via Eventos ou Interfaces.**
- **Isole a lógica de domínio de frameworks externos.**

# 3. Stack e Bibliotecas
## Tecnologias Principais e Preferências de Implementação
- Use `OpenKore/lib` para acesso ao kernel do jogo.
- Use componentes funcionais em vez de classes para maior flexibilidade e testabilidade.

# 4. Anti-Padrões (O que NÃO fazer)
## Restrições Estritas
- **Não use frameworks externos diretamente no domínio.**
- **Evite a manipulação direta do estado global do jogo.**
- **Não utilize callbacks desnecessariamente; preferir async/await.**

# 5. Código de Conduta da IA
## Instruções para o Modelo
- Retorne apenas código relevante.
- Não explique o óbvio.
- Mantenha tipagem forte e clara.

```kore
# Exemplo de regra do arquivo .kore/rules.md

## Não use frameworks externos diretamente no domínio
# Use OpenKore/lib para acesso ao kernel do jogo
module core {
    on init() {
        # Acesso ao kernel através da lib
        include "OpenKore/lib"
        log::info("Inicializando o bot...")
    }
}

## Evite a manipulação direta do estado global do jogo
# Utilize eventos ou interfaces para comunicação entre módulos
module scene_handler {
    on event_received(event) {
        if (event == "on_player_login") {
            log::info("Jogador logou-se.")
            # Aqui você pode iniciar as tarefas do bot sem manipular diretamente o estado global
        }
    }
}

## Preferir async/await para evitar callbacks desnecessários
# Exemplo de uso de async/await em uma função de ataque
module combat {
    on enemy_detected(enemy) {
        log::info("Inimigo detectado: " + enemy.name)
        
        # Aguarde a preparação do inimigo antes de atacar
        await prepare_for_attack(enemy)

        attack(enemy)
    }

    async function prepare_for_attack(enemy) {
        while (enemy.state != "ready_to_fight") {
            sleep(1000)
        }
    }
}
```

Este arquivo `.kore/rules.md` fornece uma estrutura clara e direta para o desenvolvimento do bot, garantindo que as regras técnicas e arquiteturais sejam seguidas rigorosamente.