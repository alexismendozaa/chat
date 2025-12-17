import { useState, useEffect } from 'react';
import Auth from './components/Auth';
import Chat from './components/Chat';
import './App.css';

function App() {
  const [token, setToken] = useState(null);
  const [username, setUsername] = useState(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUsername = localStorage.getItem('username');
    if (savedToken && savedUsername) {
      setToken(savedToken);
      setUsername(savedUsername);
    }
  }, []);

  const handleLogin = (newToken, newUsername) => {
    setToken(newToken);
    setUsername(newUsername);
    localStorage.setItem('token', newToken);
    localStorage.setItem('username', newUsername);
  };

  const handleLogout = () => {
    setToken(null);
    setUsername(null);
    localStorage.removeItem('token');
    localStorage.removeItem('username');
  };

  if (!token) {
    return <Auth onLogin={handleLogin} />;
  }

  return <Chat token={token} username={username} onLogout={handleLogout} />;
}

export default App;
