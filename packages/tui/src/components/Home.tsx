import React from 'react'
import { Box, Text } from 'ink'
import { InputField } from './InputField'

interface HomeProps {
  model: string
  onStart: (query: string) => void
}

export const Home: React.FC<HomeProps> = ({ model, onStart }) => {
  return (
    <Box flexDirection="column" alignItems="center" justifyContent="center" flexGrow={1} backgroundColor="#0A0A0A">
      {/* ASCII Logo Restaurada */}
      <Box flexDirection="column" marginBottom={1}>
        <Text color="#7a9e7a">
          {`  ██████╗ ██████╗ ███████╗███╗   ██╗██╗  ██╗ ██████╗ ██████╗ ███████╗
 ██╔═══██╗██╔══██╗██╔════╝████╗  ██║██║ ██╔╝██╔═══██╗██╔══██╗██╔════╝
 ██║   ██║██████╔╝█████╗  ██╔██╗ ██║█████╔╝ ██║   ██║██████╔╝█████╗
 ██║   ██║██╔═══╝ ██╔══╝  ██║╚██╗██║██╔═██╗ ██║   ██║██╔══██╗██╔══╝
 ╚██████╔╝██║     ███████╗██║ ╚████║██║  ██╗╚██████╔╝██║  ██║███████╗
  ╚═════╝ ╚═╝     ╚══════╝╚═╝  ╚═══╝╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝`}
        </Text>
      </Box>

      <Box marginBottom={2}>
        <Text color="#666666">[ Orchestrating Intelligence ]</Text>
      </Box>

      <Box width={80} flexDirection="column">
        <InputField onSubmit={onStart} />
      </Box>

      <Box marginTop={1} flexDirection="row">
        <Text color="#666666">[Modo: </Text>
        <Text color="#7a9e7a">Orquestrador</Text>
        <Text color="#666666">]  ·  [Modelo: </Text>
        <Text color="#7a9e7a">{model}</Text>
        <Text color="#666666">]</Text>
      </Box>

      <Box marginTop={2} flexDirection="column" alignItems="center">
        <Box flexDirection="row">
          <Text color="#7a9e7a">@ </Text><Text color="#666666">Referenciar arquivo    </Text>
          <Text color="#7a9e7a">! </Text><Text color="#666666">Executar shell</Text>
        </Box>
        <Box flexDirection="row">
          <Text color="#7a9e7a">/ </Text><Text color="#666666">Comandos               </Text>
          <Text color="#7a9e7a">Ctrl+X H </Text><Text color="#666666">Ajuda</Text>
        </Box>
      </Box>
    </Box>
  )
}
