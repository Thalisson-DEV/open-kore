import React, { useEffect, useRef } from 'react';
import { useRenderer } from '@opentui/react';
import { CodeRenderable } from '@opentui/core';
import { theme } from '../../theme';
import { useTheme } from '../../core/ThemeContext';

interface BashOutputProps {
  content: string;
}

function getCodeHeight(content: string, maxHeight = 20): number {
  if (!content?.trim()) return 0;
  const lines = content.split('\n').length;
  return Math.min(lines, maxHeight);
}

export const BashOutput: React.FC<BashOutputProps> = ({ content }) => {
  const { syntaxStyle } = useTheme();
  const renderer = useRenderer();
  const containerRef = useRef<any>(null);
  const codeRef = useRef<CodeRenderable | null>(null);

  if (!content || content.trim().length === 0) return null;

  const codeHeight = getCodeHeight(content);

  useEffect(() => {
    if (!containerRef.current || !content) return;

    if (codeRef.current) {
      codeRef.current.destroy();
    }

    const codeRenderable = new CodeRenderable(renderer, {
      id: `code-bash-${Math.random()}`,
      width: '100%',
      height: codeHeight,
      content,
      filetype: 'bash',
      syntaxStyle,
      fg: theme.fg,
      bg: theme.bgPanel,
    });

    containerRef.current.add(codeRenderable);
    codeRef.current = codeRenderable;

    return () => {
      codeRenderable.destroy();
    };
  }, [content, codeHeight, renderer, syntaxStyle]);

  return (
    <box style={{ width: '100%', marginTop: 1, marginBottom: 1 }}>
      <box
        ref={containerRef}
        style={{
          width: '100%',
          height: codeHeight,
          flexDirection: 'column',
        }}
      />
    </box>
  );
};
