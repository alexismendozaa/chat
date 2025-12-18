import { useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { uploadImage } from '../lib/upload.js';
import './Chat.css';

/* global process */
const API_URL = (() => {
  if (typeof globalThis !== 'undefined' && globalThis.__APP_BACKEND_URL) {
    return globalThis.__APP_BACKEND_URL;
  }
  if (typeof process !== 'undefined' && process?.env?.VITE_BACKEND_URL) {
    return process.env.VITE_BACKEND_URL;
  }
  try {
    return new Function(
      'return (typeof import !== "undefined" && import.meta && import.meta.env && import.meta.env.VITE_BACKEND_URL) ? import.meta.env.VITE_BACKEND_URL : "";'
    )();
  } catch {
    return '';
  }
})();

export default function Chat({ token, username, onLogout }) {
  const socketRef = useRef(null);
  const [roomId, setRoomId] = useState('general');
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [connected, setConnected] = useState(false);
  const [file, setFile] = useState(null);
  const [showRoomSelector, setShowRoomSelector] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Conectar Socket.IO
  useEffect(() => {
    if (!token) return;

    const newSocket = io(API_URL, {
      auth: { token },
    });

    newSocket.on('connect', () => {
      console.log(' Connected to Socket.IO');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log(' Disconnected from Socket.IO');
      setConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      console.error('Connection error:', err.message);
      setConnected(false);
    });

    newSocket.on('message', (msg) => {
      setMessages((prev) => [...prev, msg]);
      // Auto-add sender to DM list without reload (excluding self)
      if (msg.user && msg.user !== username) {
        setActiveUsers((prev) => {
          if (prev.includes(msg.user)) return prev;
          return [...prev, msg.user];
        });
      }
    });

    socketRef.current = newSocket;

    return () => {
      newSocket.close();
      socketRef.current = null;
    };
  }, [token, username]);

  const loadMessages = useCallback(async (room) => {
    try {
      const response = await fetch(`${API_URL}/api/chat/rooms/${room}/messages`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        const mappedMessages = data.map(msg => ({
          id: msg._id,
          roomId: msg.roomId,
          user: msg.username,
          text: msg.text,
          imageUrl: msg.imageUrl,
          createdAt: msg.createdAt,
        }));
        setMessages(mappedMessages);
        
        // Extraer usuarios únicos de todos los mensajes (excluyendo el usuario actual)
        const uniqueUsers = [...new Set(data.map(msg => msg.username))]
          .filter(user => user !== username);
        setActiveUsers(uniqueUsers);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }, [token, username]);

  // Unirse a una sala y cargar mensajes
  useEffect(() => {
    if (!socketRef.current || !roomId) return;

    // Unirse a la sala
    socketRef.current.emit('joinRoom', { roomId });

    const handleJoined = ({ roomId: joinedRoom }) => {
      console.log('Joined room:', joinedRoom);
      // Cargar mensajes previos después de confirmación del servidor
      loadMessages(joinedRoom);
    };

    socketRef.current.on('joined', handleJoined);

    return () => {
      socketRef.current?.off('joined', handleJoined);
    };
  }, [roomId, loadMessages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!socketRef.current || !inputText.trim()) return;

    socketRef.current.emit('message', {
      roomId,
      text: inputText.trim(),
    });

    setInputText('');
  };

  const sendImage = async () => {
    if (!file || !token || !socketRef.current) return;
    try {
      const imageUrl = await uploadImage(file, token);
      socketRef.current.emit('message', { roomId, imageUrl });
      setFile(null);
    } catch (err) {
      console.error('Error uploading image:', err);
      alert('Error al subir la imagen');
    }
  };

  const changeRoom = (newRoom) => {
    setRoomId(newRoom);
    setMessages([]);
    setShowRoomSelector(false);
  };

  const openDirectMessage = (targetUser) => {
    // Crear ID de sala DM ordenado alfabéticamente para consistencia
    const users = [username, targetUser].sort();
    const dmRoomId = `dm-${users[0]}-${users[1]}`;
    setRoomId(dmRoomId);
    setMessages([]);
    setShowRoomSelector(false);
  };

  const isDM = roomId.startsWith('dm-');
  const dmUsername = isDM ? roomId.replace('dm-', '').split('-').find(u => u !== username) : null;

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="header-left">
          <button className="mobile-menu-btn" onClick={() => setShowRoomSelector(!showRoomSelector)}>
            ☰
          </button>
          <h2>{isDM ? `@${dmUsername}` : `#${roomId}`}</h2>
          <span className={`status ${connected ? 'connected' : 'disconnected'}`}>
            {connected ? 'Conectado' : 'Desconectado'}
          </span>
        </div>
        <div className="header-right">
          <span className="username">{username}</span>
          <button onClick={onLogout} className="logout-btn">Salir</button>
        </div>
      </div>

      <div className="chat-sidebar">
        <div className="sidebar-section">
          <h3>Canales</h3>
          <div className="room-list">
            {['general', 'memes'].map((room) => (
              <button
                key={room}
                className={`room-btn ${roomId === room ? 'active' : ''}`}
                onClick={() => changeRoom(room)}
              >
                #{room}
              </button>
            ))}
          </div>
        </div>
        
        <div className="sidebar-section">
          <h3>Mensajes Directos</h3>
          <div className="room-list">
            {activeUsers.length === 0 ? (
              <p className="no-users">No hay usuarios activos</p>
            ) : (
              activeUsers.map((user) => {
                const dmId = `dm-${[username, user].sort().join('-')}`;
                return (
                  <button
                    key={user}
                    className={`room-btn dm-btn ${roomId === dmId ? 'active' : ''}`}
                    onClick={() => openDirectMessage(user)}
                  >
                    @{user}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Selector móvil de salas */}
      {showRoomSelector && (
        <div className="mobile-room-selector" onClick={() => setShowRoomSelector(false)}>
          <div className="mobile-room-list" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-section">
              <h3>Canales</h3>
              {['general', 'memes'].map((room) => (
                <button
                  key={room}
                  className={`mobile-room-btn ${roomId === room ? 'active' : ''}`}
                  onClick={() => changeRoom(room)}
                >
                  #{room}
                </button>
              ))}
            </div>
            
            <div className="mobile-section">
              <h3>Mensajes Directos</h3>
              {activeUsers.length === 0 ? (
                <p className="no-users-mobile">No hay usuarios activos</p>
              ) : (
                activeUsers.map((user) => {
                  const dmId = `dm-${[username, user].sort().join('-')}`;
                  return (
                    <button
                      key={user}
                      className={`mobile-room-btn ${roomId === dmId ? 'active' : ''}`}
                      onClick={() => openDirectMessage(user)}
                    >
                      @{user}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      <div className="chat-main">
        <div className="messages-container">
          {messages.length === 0 ? (
            <div className="no-messages">✨ Ningún mensaje aún. ¡Inicia la conversación!</div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`message ${msg.user === username ? 'own-message' : ''}`}
              >
                <div className="message-header">
                  <span className="message-user">{msg.user}</span>
                  <span className="message-time">
                    {new Date(msg.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                {msg.text && <div className="message-text">{msg.text}</div>}
                {msg.imageUrl && (
                  <img src={msg.imageUrl} alt="uploaded" className="message-image" />
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} className="message-form">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="message-input"
            disabled={!connected}
          />
          <button type="submit" className="send-btn" disabled={!connected || !inputText.trim()}>
            Enviar
          </button>
          <label htmlFor="file-upload" className="file-label" title="Seleccionar imagen">
            📎
            <input
              id="file-upload"
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              style={{ display: 'none' }}
            />
          </label>
          {file && (
            <button
              type="button"
              onClick={sendImage}
              className="send-image-btn"
              disabled={!connected}
            >
              📤 {file.name.substring(0, 10)}...
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
