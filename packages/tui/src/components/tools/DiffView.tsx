import React, { useEffect, useRef } from 'react';
import { useRenderer } from '@opentui/react';
import { DiffRenderable } from '@opentui/core';
import { theme } from '../../theme';
import { useTheme } from '../../core/ThemeContext';

interface DiffViewProps {
  patch: string;
}

function getDiffHeight(diffString: string, maxHeight = 30): number {
  if (!diffString?.trim()) return 0;
  const lines = diffString.split('\n').length;
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

export const DiffView: React.FC<DiffViewProps> = ({ patch }) => {
  const { syntaxStyle } = useTheme();
  const renderer = useRenderer();
  const containerRef = useRef<any>(null);
  const diffRef = useRef<DiffRenderable | null>(null);

  if (!patch || patch.trim().length === 0) return null;

  const diffHeight = getDiffHeight(patch);

  useEffect(() => {
    if (!containerRef.current || !patch) return;

    const finalDiff = fixDiffHeader(patch);

    if (diffRef.current) {
      diffRef.current.destroy();
    }

    const diffRenderable = new DiffRenderable(renderer, {
      id: `diff-view-${Math.random()}`,
      width: '100%',
      height: diffHeight,
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
  }, [patch, diffHeight, renderer, syntaxStyle]);

  return (
    <box style={{ width: '100%', marginTop: 1, marginBottom: 1 }}>
      <box
        ref={containerRef}
        style={{
          width: '100%',
          height: diffHeight,
          flexDirection: 'column',
        }}
      />
    </box>
  );
};
