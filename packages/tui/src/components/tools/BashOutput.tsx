import React from 'react';
import { theme } from '../../theme';
import { useTheme } from '../../core/ThemeContext';

interface BashOutputProps {
  content: string;
}

export const BashOutput: React.FC<BashOutputProps> = ({ content }) => {
  const { syntaxStyle } = useTheme();
  if (!content || content.trim().length === 0) return null;

  return (
    <box style={{ width: '100%', marginTop: 1, marginBottom: 1 }}>
      <code
        content={content}
        filetype="bash"
        syntaxStyle={syntaxStyle}
        style={{
          width: '100%',
          fg: theme.fg,
          backgroundColor: theme.bgPanel,
        }}
      />
    </box>
  );
};
