import React, { useState, useEffect, useRef } from 'react';
import { useKeyboard, useRenderer } from '@opentui/react';
import { DiffRenderable } from '@opentui/core';
import { theme } from '../theme';
import { useTheme } from '../core/ThemeContext';

export interface PermissionRequest {
  id: string;
  tool: string;
  path?: string;
  input: any;
  diff?: string;
}

interface PermissionBoxProps {
  request: PermissionRequest;
  status: 'pending' | 'yes' | 'no' | 'always';
  onResolve?: (action: 'yes' | 'no' | 'always') => void;
}

function getDiffHeight(diffString: string, maxHeight = 20): number {
  if (!diffString?.trim()) return 0;
  const lines = diffString.split('\n').length;
  // +2 para margem (header do hunk + linha vazia final)
  return Math.min(lines + 2, maxHeight);
}

function fixDiffHeader(diffString: string): string {
  if (diffString.includes('@@')) return diffString;

  const lines = diffString.split('\n');
  let removed = 0;
  let added = 0;
  let neutral = 0;

  for (const line of lines) {
    if (line.startsWith('-')) removed++;
    else if (line.startsWith('+')) added++;
    else neutral++;
  }

  const oldCount = removed + neutral;
  const newCount = added + neutral;

  return `--- a/file\n+++ b/file\n@@ -1,${oldCount} +1,${newCount} @@\n${diffString}`;
}

function DiffBlock({ diffString, height, syntaxStyle }: { diffString: string, height: number, syntaxStyle: string }) {
  const renderer = useRenderer();
  const containerRef = useRef<any>(null);
  const diffRef = useRef<DiffRenderable | null>(null);

  useEffect(() => {
    if (!containerRef.current || !diffString) return;

    const finalDiff = fixDiffHeader(diffString);

    if (diffRef.current) {
      diffRef.current.destroy();
    }

    const diffRenderable = new DiffRenderable(renderer, {
      id: `diff-${Math.random()}`,
      width: '100%',
      height,
      diff: finalDiff,
      view: 'unified',
      addedBg: theme.diffAdd,
      removedBg: theme.diffRem,
      showLineNumbers: true,
      syntaxStyle,
    });

    containerRef.current.add(diffRenderable);
    diffRef.current = diffRenderable;

    return () => {
      diffRenderable.destroy();
    };
  }, [diffString, height, renderer, syntaxStyle]);

  return (
    <box
      ref={containerRef}
      style={{
        width: '100%',
        height,
        flexDirection: 'column',
      }}
    />
  );
}

export const PermissionBox: React.FC<PermissionBoxProps> = ({ request, status, onResolve }) => {
  const { syntaxStyle } = useTheme();
  const isPending = status === 'pending';
  const [focusedIndex, setFocusedIndex] = useState(0); 
  const options: ('yes' | 'no' | 'always')[] = ['yes', 'no', 'always'];
  const diffHeight = getDiffHeight(request.diff ?? '');

  useKeyboard((key) => {
    if (!isPending || !onResolve) return;

    if (key.name === 'left' || (key.shift && key.name === 'tab')) {
      setFocusedIndex(prev => (prev > 0 ? prev - 1 : options.length - 1));
    } else if (key.name === 'right' || key.name === 'tab') {
      setFocusedIndex(prev => (prev < options.length - 1 ? prev + 1 : 0));
    } else if (key.name === 'return') {
      onResolve(options[focusedIndex]);
    } else if (key.name === 'escape') {
      onResolve('no');
    } else if (key.name === 'y') {
      onResolve('yes');
    } else if (key.name === 'n') {
      onResolve('no');
    } else if (key.name === 'a') {
      onResolve('always');
    }
  });

  const resource = 
    request.path || 
    request.input?.path || 
    request.input?.file_path || 
    request.input?.filePath || 
    request.input?.directory || 
    request.input?.command || 
    request.input?.pattern ||
    request.input?.glob ||
    'recurso desconhecido';

  const getOptionLabel = (opt: 'yes' | 'no' | 'always', index: number) => {
    const isFocused = focusedIndex === index && isPending;
    const isSelected = status === opt;
    const labels = { yes: 'PERMITIR', no: 'RECUSAR', always: 'SEMPRE' };
    const key = opt === 'yes' ? 'Y' : opt === 'no' ? 'N' : 'A';

    const textColor = isFocused ? theme.accent : (isSelected ? theme.accent : theme.fgDim);
    const finalTextColor = (!isPending && !isSelected) ? "#222222" : textColor;

    return (
      <box key={opt} style={{ marginRight: 3 }}>
        <text fg={finalTextColor} bold={isFocused || isSelected}>
          {isFocused ? '› ' : '  '}
          {`[${key}] ${labels[opt]}`}
        </text>
      </box>
    );
  };

  return (
    <box style={{ flexDirection: "column", marginY: 1, paddingLeft: 2, width: "100%", flexShrink: 0 }}>
      <box style={{ flexDirection: 'row', marginBottom: 0 }}>
        <text fg={isPending ? theme.accent : "#333333"} bold>🛡️ PERMISSÃO REQUERIDA: </text>
        <text fg={isPending ? theme.fg : "#333333"} bold>{request.tool.toUpperCase()}</text>
      </box>

      <box style={{ marginBottom: 0, flexDirection: 'row' }}>
        <text fg={theme.fgMuted}>Alvo: </text>
        <text fg={isPending ? theme.fgDim : "#333333"}>{resource}</text>
      </box>

      {isPending && (
        <box style={{ flexDirection: 'column', marginTop: 1 }}>
          {request.diff && request.diff.trim().length > 1 ? (
            <box style={{ borderLeft: 2, borderColor: theme.accent, paddingLeft: 1 }}>
              <DiffBlock 
                diffString={request.diff} 
                height={diffHeight} 
                syntaxStyle={syntaxStyle} 
              />
            </box>
          ) : (
            <box style={{ marginY: 1 }}>
               <text fg={theme.fgMuted} italic> (Sem pré-visualização de alterações) </text>
            </box>
          )}
        </box>
      )}

      <box style={{ flexDirection: "row", marginTop: 1, alignItems: 'center' }}>
        {options.map((opt, i) => getOptionLabel(opt, i))}
        {!isPending && (
           <box style={{ marginLeft: 1 }}>
             <text fg="#222222" italic> [Ação: {status.toUpperCase()}]</text>
           </box>
        )}
      </box>
    </box>
  );
};


