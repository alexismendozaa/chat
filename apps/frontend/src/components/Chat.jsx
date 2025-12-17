import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { uploadImage } from '../lib/upload.js';
import './Chat.css';

const API_URL = import.meta.env.VITE_BACKEND_URL || '';

export default function Chat({ token, username, onLogout }) {
  const [socket, setSocket] = useState(null);
  const [roomId, setRoomId] = useState('general');
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [connected, setConnected] = useState(false);
  const [file, setFile] = useState(null);
  const [showRoomSelector, setShowRoomSelector] = useState(false);
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
      console.log('✅ Connected to Socket.IO');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from Socket.IO');
      setConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      console.error('Connection error:', err.message);
      setConnected(false);
    });

    newSocket.on('message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [token]);

  // Unirse a una sala y cargar mensajes
  useEffect(() => {
    if (!socket || !roomId) return;

    // Unirse a la sala
    socket.emit('joinRoom', { roomId });

    socket.on('joined', ({ roomId: joinedRoom }) => {
      console.log('Joined room:', joinedRoom);
    });

    // Cargar mensajes previos
    loadMessages(roomId);

    return () => {
      socket.off('joined');
    };
  }, [socket, roomId]);

  const loadMessages = async (room) => {
    try {
      const response = await fetch(`${API_URL}/api/chat/rooms/${room}/messages`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data.map(msg => ({
          id: msg._id,
          roomId: msg.roomId,
          user: msg.username,
          text: msg.text,
          imageUrl: msg.imageUrl,
          createdAt: msg.createdAt,
        })));
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!socket || !inputText.trim()) return;

    socket.emit('message', {
      roomId,
      text: inputText.trim(),
    });

    setInputText('');
  };

  const sendImage = async () => {
    if (!file || !token || !socket) return;
    try {
      const imageUrl = await uploadImage(file, token);
      socket.emit('message', { roomId, imageUrl });
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

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="header-left">
          <button className="mobile-menu-btn" onClick={() => setShowRoomSelector(!showRoomSelector)}>
            ☰
          </button>
          <h2>#{roomId}</h2>
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
        <h3>Salas</h3>
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

      {/* Selector móvil de salas */}
      {showRoomSelector && (
        <div className="mobile-room-selector" onClick={() => setShowRoomSelector(false)}>
          <div className="mobile-room-list" onClick={(e) => e.stopPropagation()}>
            <h3>Selecciona una sala</h3>
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
