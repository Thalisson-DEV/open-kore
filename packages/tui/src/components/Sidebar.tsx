import React, { useState, useEffect } from 'react';
import { theme } from '../theme';
import { useSpinner } from '../hooks/use-spinner';
import os from 'os';
import path from 'path';

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

const formatPath = (p: string) => {
  const home = os.homedir();
  let projectPath = p;
  if (p.endsWith('packages/tui')) {
    projectPath = path.join(p, '..', '..');
  } else if (p.endsWith('packages/server')) {
    projectPath = path.join(p, '..', '..');
  }

  if (projectPath.startsWith(home)) {
    return projectPath.replace(home, '~');
  }
  return projectPath;
};

export const Sidebar: React.FC<SidebarProps> = ({ 
  agents, 
  activeAgentId, 
  isStreaming, 
  model,
  files,
  usage
}) => {
  const spinner = useSpinner(isStreaming);
  const maxTokens = 128000;
  const usagePercent = Math.min(100, Math.round((usage.totalTokens / maxTokens) * 100));
  const version = 'v0.1.1';

  const [cwd, setCwd] = useState(() => formatPath(process.cwd()));

  useEffect(() => {
    const cwdInterval = setInterval(() => {
      setCwd(formatPath(process.cwd()));
    }, 5000);
    return () => clearInterval(cwdInterval);
  }, []);

  return (
    <box 
      style={{
        flexDirection: "column", 
        width: 32, // Restaurado para uma largura confortável
        flexShrink: 0, // Garante que a sidebar nunca encolha
        backgroundColor: theme.bgPanel,
        paddingX: 2,
        paddingY: 1,
        height: "100%",
        justifyContent: "flex-start"
      }}
    >
      <scrollbox 
        style={{ flexGrow: 1, flexDirection: 'column' }}
        scrollbarOptions={{ thickness: 0 }}
      >
        {/* 1. CONTEXTO */}
        <box style={{ marginBottom: 1, flexDirection: "column" }}>
          <text fg={theme.accent} bold>⚙ CONTEXTO DA SESSÃO</text>
          
          <box style={{ flexDirection: "column", marginBottom: 1 }}>
             <text fg={theme.fgDim} dim>Diretório</text>
             <text fg={theme.fgMuted} dim>{cwd.length > 28 ? '...' + cwd.slice(-25) : cwd}</text>
          </box>

          <box style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <text fg={theme.fgDim}>Modelo</text>
            <text fg={theme.fg}>{model.split('/').pop()?.slice(0, 15)}</text>
          </box>
          
          <box style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <text fg={theme.fgDim}>Versão</text>
            <text fg={theme.fgDim} dim>{version}</text>
          </box>

          <box style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 1 }}>
             <text fg={theme.fgDim}>Uso</text>
             <text fg={usagePercent > 80 ? theme.error : theme.accent}>{usagePercent}%</text>
          </box>
          <text fg="#222222">──────────────────────────</text>
        </box>

        {/* 2. AGENTES */}
        <box style={{ marginBottom: 1, flexDirection: "column" }}>
          <text fg={theme.accent} bold>🤖 AGENTES ATIVOS</text>
          {agents.map(agent => {
            const isActive = activeAgentId === agent.id;
            return (
              <box key={agent.id} style={{ flexDirection: "row" }}>
                <text fg={isActive ? theme.accent : theme.fgMuted}>
                  {isActive && isStreaming ? spinner : (isActive ? "●" : "○")}
                </text>
                <text fg={isActive ? theme.fg : theme.fgMuted}> {agent.name.split(' ')[0]} </text>
              </box>
            );
          })}
          <text fg="#222222">──────────────────────────</text>
        </box>

        {/* 3. ARQUIVOS */}
        {files.length > 0 && (
          <box style={{ marginBottom: 1, flexDirection: "column" }}>
            <text fg={theme.accent} bold>📎 ARQUIVOS TOCADOS</text>
            {files.slice(-10).map((file, i) => (
              <box key={i} style={{ flexDirection: "row" }}>
                <text fg={theme.fgMuted}>📄 </text>
                <text fg={theme.fgDim}>{file.split('/').pop()?.slice(0, 24)}</text>
              </box>
            ))}
            <text fg="#222222">──────────────────────────</text>
          </box>
        )}
      </scrollbox>

      {/* 4. DICAS */}
      <box style={{ marginTop: 'auto', flexDirection: "column" }}>
        <text fg={theme.accent} bold dim>💡 DICAS</text>
        <box style={{ flexDirection: "row" }}><text fg={theme.fgMuted}>@ </text><text fg={theme.fgDim}>incluir arquivo</text></box>
        <box style={{ flexDirection: "row" }}><text fg={theme.fgMuted}>! </text><text fg={theme.fgDim}>comando shell</text></box>
        <box style={{ flexDirection: "row" }}><text fg={theme.fgMuted}>Tab </text><text fg={theme.fgDim}>trocar agente</text></box>
        <box style={{ flexDirection: "row" }}><text fg={theme.fgMuted}>C-x b </text><text fg={theme.fgDim}>sidebar</text></box>
      </box>
    </box>
  );
};
