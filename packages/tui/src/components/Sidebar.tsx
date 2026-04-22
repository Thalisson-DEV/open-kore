import React from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';

interface SidebarProps {
  agents: any[];
  activeAgentId: string;
  isStreaming: boolean;
  model: string;
  files: string[];
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  agents, 
  activeAgentId, 
  isStreaming, 
  model,
  files,
  usage
}) => {
  const maxTokens = 128000;
  const usagePercent = Math.min(100, Math.round((usage.totalTokens / maxTokens) * 100));

  return (
    <Box 
      flexDirection="column" 
      width={32} 
      flexShrink={0}
      backgroundColor="#111111"
      paddingX={2}
      paddingY={1}
      height="100%"
    >
      <Box marginBottom={1} flexDirection="column">
        <Text color="#7a9e7a" bold>⚙ CONTEXTO DA SESSÃO</Text>
        <Text color="#222222">──────────────────────────</Text>
        <Box flexDirection="row" justifyContent="space-between">
          <Text color="#666666">Modelo</Text>
          <Text color="#E0E0E0">{model.split('/').pop()?.slice(0, 15)}</Text>
        </Box>
        <Box flexDirection="row" justifyContent="space-between">
          <Text color="#666666">Tokens</Text>
          <Text color="#E0E0E0">{usage.totalTokens.toLocaleString()}</Text>
        </Box>
        <Box flexDirection="row" justifyContent="space-between" marginTop={1}>
          <Text color="#666666">Uso</Text>
          <Text color={usagePercent > 80 ? "#F85149" : "#7a9e7a"}>{usagePercent}%</Text>
        </Box>
        <Box>
           <Text color="#222222">
             {'█'.repeat(Math.floor(usagePercent / 5))}
             {'░'.repeat(20 - Math.floor(usagePercent / 5))}
           </Text>
        </Box>
      </Box>

      <Box marginBottom={1} flexDirection="column" marginTop={1}>
        <Text color="#7a9e7a" bold>🤖 AGENTES ATIVOS</Text>
        <Text color="#222222">──────────────────────────</Text>
        {agents.map(agent => {
          const isActive = activeAgentId === agent.id;
          return (
            <Box key={agent.id} flexDirection="row">
              <Text color={isActive ? "#7a9e7a" : "#333333"}>
                {isActive && isStreaming ? <Spinner type="dots" /> : (isActive ? "●" : "○")}
              </Text>
              <Text color={isActive ? "#E0E0E0" : "#333333"}> {agent.name.split(' ')[0]} </Text>
              {isActive && <Text color="#222222"> (ativo)</Text>}
            </Box>
          );
        })}
      </Box>

      {files.length > 0 && (
        <Box marginBottom={1} flexDirection="column" marginTop={1}>
          <Text color="#7a9e7a" bold>📎 ARQUIVOS TOCADOS</Text>
          <Text color="#222222">──────────────────────────</Text>
          {files.slice(-8).map((file, i) => (
            <Box key={i} flexDirection="row">
              <Text color="#444444">📄 </Text>
              <Text color="#666666">
                {file.split('/').pop()}
              </Text>
            </Box>
          ))}
        </Box>
      )}

      <Box marginTop={1} flexDirection="column">
        <Text color="#7a9e7a" bold>💡 DICAS</Text>
        <Text color="#222222">──────────────────────────</Text>
        <Box flexDirection="row"><Text color="#444444">@ </Text><Text color="#666666">arquivo p/ incluir</Text></Box>
        <Box flexDirection="row"><Text color="#444444">! </Text><Text color="#666666">comando shell</Text></Box>
        <Box flexDirection="row"><Text color="#444444">Tab </Text><Text color="#666666">trocar agente</Text></Box>
        <Box flexDirection="row"><Text color="#444444">Esc </Text><Text color="#666666">parar IA</Text></Box>
        <Box flexDirection="row"><Text color="#444444">C-x b </Text><Text color="#666666">sidebar</Text></Box>
      </Box>
    </Box>
  );
};
