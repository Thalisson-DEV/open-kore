import React from 'react';
import { theme } from '../theme';
import { useSpinner } from '../hooks/use-spinner';
import { DiffView } from './tools/DiffView';
import { BashOutput } from './tools/BashOutput';

interface ToolBlockProps {
  toolName: string;
  toolInput: any;
  toolOutput: any;
  status: 'streaming' | 'done' | 'error' | 'canceled';
}

export const ToolBlock: React.FC<ToolBlockProps> = ({ 
  toolName, toolInput, toolOutput, status 
}) => {
  const isPending = status === 'streaming';
  const spinner = useSpinner(isPending);
  
  // Extrai o recurso de forma abrangente
  const resource = 
    toolInput?.path || 
    toolInput?.file_path || 
    toolInput?.directory || 
    toolInput?.command || 
    toolInput?.pattern ||
    toolInput?.glob ||
    (toolInput?.include_pattern && `in ${toolInput.include_pattern}`) ||
    (typeof toolInput === 'string' ? toolInput : '');
  
  const formattedName = toolName ? toolName.charAt(0).toUpperCase() + toolName.slice(1) : '';

  const hasDiff = toolName === 'write' || toolName === 'replace' || toolName === 'edit';
  const isBash = toolName === 'bash' || toolName === 'run_shell_command';

  return (
    <box style={{ flexDirection: "column", marginLeft: 2, marginBottom: 1 }}>
      <box style={{ flexDirection: "row" }}>
        <text fg={isPending ? "#EBCB8B" : (status === 'error' || status === 'canceled' ? theme.error : theme.accent)}>
          {isPending ? spinner : (status === 'error' || status === 'canceled' ? "✗" : "✓")} 
        </text>
        <text fg={isPending ? "#EBCB8B" : (status === 'error' || status === 'canceled' ? theme.error : theme.accent)} bold> {formattedName} </text>
        {resource && (
          <text fg={theme.fgDim}> · {resource}</text>
        )}
      </box>
      
      {status === 'error' && toolOutput && (
        <box style={{ flexDirection: "column", marginTop: 0, paddingX: 1 }}>
           <text fg={theme.error}>Erro: {toolOutput.error || (typeof toolOutput === 'string' ? toolOutput : JSON.stringify(toolOutput))}</text>
        </box>
      )}

      {!isPending && status === 'done' && (
        <>
          {hasDiff && toolOutput?.diff && <DiffView patch={toolOutput.diff} />}
          {isBash && toolOutput?.output && <BashOutput content={toolOutput.output} />}
        </>
      )}
    </box>
  );
};
