import React, { useEffect, useRef } from 'react';
import { LevelBadge } from './LevelBadge';

interface Message {
  id: string;
  username: string;
  text: string;
  isGift?: boolean;
  level?: number;
  isSystem?: boolean;
  avatar?: string;
}

interface ChatOverlayProps {
  messages: Message[];
  variant?: 'panel' | 'overlay';
  className?: string;
  onLike?: () => void;
}

export function ChatOverlay({ messages, variant = 'panel', className, onLike }: ChatOverlayProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    position: variant === 'overlay' ? 'absolute' : 'relative',
    bottom: variant === 'overlay' ? 0 : undefined,
    left: variant === 'overlay' ? 0 : undefined,
    width: '100%',
    height: variant === 'overlay' ? 'calc(26vh + 80px)' : '100%',
    paddingLeft: '0px',
    paddingRight: '16px',
    paddingTop: '16px',
    paddingBottom: variant === 'overlay' ? '96px' : '16px',
    boxSizing: 'border-box',
  };

  const scrollStyle: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '0px',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
    paddingLeft: '0px',
    marginLeft: '0px',
    alignItems: 'flex-start',
    width: '100%',
  };

  const messageStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '1px',
    padding: '0px 0',
    paddingLeft: '0px',
    marginLeft: '-100px',
    marginTop: '-50px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    justifyContent: 'flex-start',
    width: 'auto',
    alignSelf: 'flex-start',
  };

  const usernameStyle: React.CSSProperties = {
    fontWeight: 'bold',
    color: '#d1d5db',
    fontSize: '14px',
    flexShrink: 0,
    marginLeft: '-95px',
  };

  const textStyle = (isGift?: boolean): React.CSSProperties => ({
    color: isGift ? '#facc15' : 'rgba(255,255,255,0.9)',
    fontWeight: isGift ? 'bold' : 'normal',
    fontSize: '14px',
  });

  return (
    <div style={containerStyle} className={className}>
      <div style={scrollStyle} className="chat-scroll">
        {messages.map((msg) => (
          <div key={msg.id} style={messageStyle}>
            {!msg.isSystem && (
              <LevelBadge level={msg.level || 1} size={70} layout="fixed" />
            )}
            
            <span style={usernameStyle}>{msg.username}</span>
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>:</span>
            <span style={textStyle(msg.isGift)}>{msg.text}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
