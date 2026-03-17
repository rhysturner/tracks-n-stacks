import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

export default function LiveChat({ streamId, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [viewerCount, setViewerCount] = useState(0);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.emit('join_stream', { streamId });

    socket.on('chat_message', (msg) => {
      setMessages((prev) => [...prev.slice(-199), msg]);
    });

    socket.on('viewer_count', ({ count }) => {
      setViewerCount(count);
    });

    return () => {
      socket.emit('leave_stream', { streamId });
      socket.disconnect();
    };
  }, [streamId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || !currentUser) return;

    socketRef.current?.emit('chat_message', {
      streamId,
      message: trimmed,
      username: currentUser.username,
      avatarUrl: currentUser.avatarUrl,
    });

    setInput('');
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.headerTitle}>Live Chat</span>
        <span style={styles.viewerCount}>👁 {viewerCount}</span>
      </div>

      <div style={styles.messages}>
        {messages.map((msg) => (
          <div key={msg.id} style={styles.message}>
            <span style={styles.msgUsername}>{msg.username}</span>
            <span style={styles.msgText}>{msg.message}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {currentUser ? (
        <form onSubmit={sendMessage} style={styles.inputRow}>
          <input
            style={styles.input}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Say something..."
            maxLength={200}
          />
          <button type="submit" style={styles.sendButton} disabled={!input.trim()}>
            Send
          </button>
        </form>
      ) : (
        <div style={styles.loginPrompt}>Login to chat</div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: '#1a1a2e',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid #2a2a4a',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    borderBottom: '1px solid #2a2a4a',
    background: '#16213e',
  },
  headerTitle: {
    color: '#fff',
    fontWeight: 700,
    fontSize: '0.95rem',
  },
  viewerCount: {
    color: '#888',
    fontSize: '0.85rem',
  },
  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    minHeight: 0,
  },
  message: {
    fontSize: '0.85rem',
    lineHeight: '1.4',
    wordBreak: 'break-word',
  },
  msgUsername: {
    color: '#7c3aed',
    fontWeight: 700,
    marginRight: '6px',
  },
  msgText: {
    color: '#ddd',
  },
  inputRow: {
    display: 'flex',
    padding: '12px',
    gap: '8px',
    borderTop: '1px solid #2a2a4a',
  },
  input: {
    flex: 1,
    background: '#0f0f0f',
    border: '1px solid #2a2a4a',
    borderRadius: '8px',
    color: '#fff',
    padding: '8px 12px',
    fontSize: '0.85rem',
    outline: 'none',
  },
  sendButton: {
    background: '#7c3aed',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 16px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: 600,
  },
  loginPrompt: {
    padding: '12px 16px',
    color: '#888',
    fontSize: '0.85rem',
    textAlign: 'center',
    borderTop: '1px solid #2a2a4a',
  },
};
