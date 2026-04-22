import React from 'react'
import { theme } from '../theme'
import { InputField } from './InputField'

interface HomeProps {
  model: string
  onStart: (query: string) => void
}

export const Home: React.FC<HomeProps> = ({ model, onStart }) => {
  return (
    <box style={{ flexDirection: "column", alignItems: "center", justifyContent: "center", flexGrow: 1, backgroundColor: theme.bg }}>
      {/* ASCII Logo */}
      <box style={{ flexDirection: "column", marginBottom: 1 }}>
        <text fg={theme.accent}>
          {`  ██████╗ ██████╗ ███████╗███╗   ██╗██╗  ██╗ ██████╗ ██████╗ ███████╗
 ██╔═══██╗██╔══██╗██╔════╝████╗  ██║██║ ██╔╝██╔═══██╗██╔══██╗██╔════╝
 ██║   ██║██████╔╝█████╗  ██╔██╗ ██║█████╔╝ ██║   ██║██████╔╝█████╗
 ██║   ██║██╔═══╝ ██╔══╝  ██║╚██╗██║██╔═██╗ ██║   ██║██╔══██╗██╔══╝
 ╚██████╔╝██║     ███████╗██║ ╚████║██║  ██╗╚██████╔╝██║  ██║███████╗
  ╚═════╝ ╚═╝     ╚══════╝╚═╝  ╚═══╝╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝`}
        </text>
      </box>

      <box style={{ marginBottom: 2 }}>
        <text fg={theme.fgDim}>[ Orchestrating Intelligence ]</text>
      </box>

      <box style={{ width: 80, flexDirection: "column", justifyContent: "flex-end" }}>
        <InputField onSubmit={onStart} />
      </box>

      <box style={{ marginTop: 1, flexDirection: "row" }}>
        <text fg={theme.fgDim}>[Modo: </text>
        <text fg={theme.accent}>Orquestrador</text>
        <text fg={theme.fgDim}>]  ·  [Modelo: </text>
        <text fg={theme.accent}>{model}</text>
        <text fg={theme.fgDim}>]</text>
      </box>

      <box style={{ marginTop: 2, flexDirection: "column", alignItems: "center" }}>
        <box style={{ flexDirection: "row" }}>
          <text fg={theme.accent}>@ </text><text fg={theme.fgDim}>Referenciar arquivo    </text>
          <text fg={theme.accent}>! </text><text fg={theme.fgDim}>Executar shell</text>
        </box>
        <box style={{ flexDirection: "row" }}>
          <text fg={theme.accent}>/ </text><text fg={theme.fgDim}>Comandos               </text>
          <text fg={theme.accent}>Ctrl+X H </text><text fg={theme.fgDim}>Ajuda</text>
        </box>
      </box>
    </box>
  )
}
