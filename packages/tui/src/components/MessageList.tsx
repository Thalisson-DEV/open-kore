import React, { useRef, useEffect, useState } from 'react';
import { useKeyboard, useTerminalDimensions } from '@opentui/react';
import { type ScrollBoxRenderable } from '@opentui/core';
import { theme } from '../theme';
import { Message } from './Message';
import { SSEMessage } from '../hooks/use-sse';
import { PermissionBox } from './PermissionBox';
import { useScrollControl } from '../hooks/useScrollControl';

interface MessageListProps {
  messages: SSEMessage[];
  userName?: string;
  isInputFocused?: boolean;
  onResolvePermission?: (id: string, action: 'yes' | 'no' | 'always') => void;
  onOpenDialog?: () => void;
}

export const MessageList: React.FC<MessageListProps> = ({ 
  messages, 
  userName, 
  isInputFocused = true,
  onResolvePermission,
  onOpenDialog
}) => {
  const scrollboxRef = useRef<ScrollBoxRenderable | null>(null);
  const idleTimer = useRef<any>(null);
  const { height } = useTerminalDimensions();
  const [isScrolledUp, setIsScrolledUp] = useState(false);

  const SCROLLBAR_TRACK_COLOR   = '#1e1e1e';
  const SCROLLBAR_THUMB_COLOR   = '#405140';
  const SCROLLBAR_THUMB_ACTIVE  = '#7a9e7a';

  useEffect(() => {
    const box = scrollboxRef.current;
    if (!box) return;

    const bar = box.verticalScrollBar;
    if (!bar) return;

    bar.onChange = (position) => {
      bar.trackOptions = {
        ...bar.trackOptions,
        foregroundColor: SCROLLBAR_THUMB_ACTIVE,
      };

      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => {
        bar.trackOptions = {
          ...bar.trackOptions,
          foregroundColor: SCROLLBAR_THUMB_COLOR,
        };
      }, 800);

      const atBottom = position >= box.scrollHeight - box.height - 3;
      setIsScrolledUp(!atBottom);
    };
  }, []);

  useScrollControl({
    scrollboxRef,
    isInputFocused,
    terminalHeight: height,
  });

  return (
    <scrollbox
      ref={scrollboxRef}
      stickyScroll={true}
      stickyStart="bottom"
      viewportCulling={false}
      scrollY={true}
      scrollX={false}
      verticalScrollbarOptions={{
        showArrows: false,
        trackOptions: {
          backgroundColor: SCROLLBAR_TRACK_COLOR,
          foregroundColor: SCROLLBAR_THUMB_COLOR,
        },
      }}
      style={{
        flexGrow: 1,
        width: '100%',
        flexDirection: 'column',
        paddingLeft: 1,
        paddingTop: 1,
        position: 'relative'
      }}
    >
      <box style={{ flexDirection: 'column', flexShrink: 0, width: '100%', paddingBottom: 1 }}>
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
              onActionClick={onOpenDialog}
            />
          );
        })}
        {/* Espaçador final para garantir que a última mensagem não fique colada no input */}
        <box style={{ height: 2, width: '100%' }} />
      </box>

      {isScrolledUp && (
        <box
          style={{
            position: 'absolute',
            bottom: 1,
            right: 2,
            paddingX: 1,
            backgroundColor: '#405140',
            borderStyle: 'rounded',
            borderColor: '#7a9e7a',
            zIndex: 10
          }}
        >
          <text fg="#7a9e7a">↓ rolar para o fim</text>
        </box>
      )}
    </scrollbox>
  );
};
