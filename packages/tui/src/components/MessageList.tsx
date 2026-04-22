import React, { useRef } from 'react';
import { useKeyboard, useTerminalDimensions } from '@opentui/react';
import { type ScrollBoxRenderable } from '@opentui/core';
import { theme } from '../theme';
import { Message } from './Message';
import { SSEMessage } from '../hooks/use-sse';
import { PermissionBox } from './PermissionBox';

interface MessageListProps {
  messages: SSEMessage[];
  userName?: string;
  onResolvePermission?: (id: string, action: 'yes' | 'no' | 'always') => void;
}

export const MessageList: React.FC<MessageListProps> = ({ 
  messages, 
  userName, 
  onResolvePermission 
}) => {
  const scrollboxRef = useRef<ScrollBoxRenderable | null>(null);
  const { height } = useTerminalDimensions();

  useKeyboard((key) => {
    const box = scrollboxRef.current;
    if (!box) return;

    if (key.name === 'pageup')   box.scrollBy(-10);
    if (key.name === 'pagedown') box.scrollBy(10);
    if (key.ctrl && key.name === 'u') box.scrollBy(-Math.floor(height / 2));
    if (key.ctrl && key.name === 'd') box.scrollBy(Math.floor(height / 2));
    if (key.name === 'g' && !key.shift) box.scrollBy(999999);
  });

  return (
    <scrollbox
      ref={scrollboxRef}
      stickyScroll={true}
      stickyStart="bottom"
      scrollbarOptions={{
          thickness: 1,
          color: "#222222"
      }}
      style={{
        flexGrow: 1,
        width: '100%',
        height: '100%', // Força ocupação vertical total
        flexDirection: 'column',
        paddingLeft: 1,
        paddingTop: 1
      }}
    >
      {messages.map((msg) => {
        if (msg.role === 'permission' && msg.permission) {
          return (
            <PermissionBox 
              key={msg.id} 
              request={msg.permission} 
              status={msg.status as any} 
              onResolve={(action) => onResolvePermission?.(msg.id, action)} 
            />
          );
        }
        
        return (
          <Message 
            key={msg.id} 
            role={msg.role as any} 
            content={msg.content} 
            status={msg.status as any} 
            userName={userName}
            toolName={msg.toolName}
            toolInput={msg.toolInput}
            toolOutput={msg.toolOutput}
          />
        );
      })}
    </scrollbox>
  );
};
