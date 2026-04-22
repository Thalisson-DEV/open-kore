import React from 'react';
import { theme } from '../../theme';
import { useTheme } from '../../core/ThemeContext';

interface DiffViewProps {
  patch: string;
}

export const DiffView: React.FC<DiffViewProps> = ({ patch }) => {
  const { syntaxStyle } = useTheme();
  if (!patch || patch.trim().length === 0) return null;

  return (
    <box style={{ width: '100%', marginTop: 1, marginBottom: 1 }}>
      <diff
        diff={patch}
        syntaxStyle={syntaxStyle}
        showLineNumbers={true}
        addedBg={theme.diffAdd}
        removedBg={theme.diffRem}
        style={{
          width: '100%',
        }}
      />
    </box>
  );
};
