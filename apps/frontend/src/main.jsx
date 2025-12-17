import React, { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import { io } from "socket.io-client";
import { uploadImage } from "./lib/upload.js";
import { login, register } from "./auth.js";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

function Auth({ onAuth }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("login");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    try {
      setError("");
      setLoading(true);
      if (mode === "register") {
        await register(username, password);
      }
      const token = await login(username, password);
      localStorage.setItem("token", token);
      onAuth(token);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 360, margin: "80px auto", textAlign: "center", fontFamily: "system-ui" }}>
      <h2>{mode === "login" ? "Login" : "Register"}</h2>

      <div style={{ marginBottom: 12 }}>
        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ width: "100%", padding: 8, marginBottom: 8, boxSizing: "border-box" }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", padding: 8, boxSizing: "border-box" }}
        />
      </div>

      {error && <p style={{ color: "crimson", marginBottom: 12 }}>{error}</p>}

      <button
        onClick={submit}
        disabled={loading}
        style={{ width: "100%", padding: 8, marginBottom: 12 }}
      >
        {loading ? "…" : mode === "login" ? "Login" : "Register"}
      </button>

      <p style={{ marginTop: 10 }}>
        {mode === "login" ? "No account? " : "Already have an account? "}
        <button
          onClick={() => setMode(mode === "login" ? "register" : "login")}
          style={{ background: "none", border: "none", color: "blue", cursor: "pointer", textDecoration: "underline" }}
        >
          {mode === "login" ? "Register" : "Login"}
        </button>
      </p>
    </div>
  );
}

function Chat({ token, onLogout }) {
  const [roomId, setRoomId] = useState("general");
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const [file, setFile] = useState(null);

  const socket = useMemo(
    () => io(BACKEND_URL, { transports: ["websocket"], auth: { token } }),
    [token]
  );

  useEffect(() => {
    socket.on("connect", () => console.log("socket:", socket.id));
    socket.on("message", (m) => setMessages((prev) => [...prev, m]));
    socket.on("joined", (x) => console.log("joined", x));
    return () => socket.disconnect();
  }, [socket]);

  useEffect(() => {
    // Load history from API, then join the room for realtime
    const loadHistory = async () => {
      if (!token) return;
      try {
        const r = await fetch(`${BACKEND_URL}/api/chat/rooms/${roomId}/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await r.json();
        // Expecting an array of messages
        if (Array.isArray(data)) setMessages(data);
        else if (Array.isArray(data?.items)) setMessages(data.items);
      } catch (err) {
        console.error("history load failed", err);
      }
    };

    loadHistory().finally(() => {
      socket.emit("joinRoom", { roomId });
    });
  }, [roomId, socket]);

  const send = () => {
    if (!text.trim()) return;
    socket.emit("message", { roomId, text });
    setText("");
  };

  const sendImage = async () => {
    if (!file || !token) return;
    try {
      const imageUrl = await uploadImage(file, token);
      socket.emit("message", { roomId, imageUrl });
      setFile(null);
    } catch (err) {
      console.error("image upload failed", err);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    onLogout();
  };

  async function doLogin(username, password) {
    const r = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || "login failed");
    localStorage.setItem("token", data.token);
    setToken(data.token);
    return data.token;
  }

  return (
    <div style={{ maxWidth: 720, margin: "30px auto", fontFamily: "system-ui" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>Realtime Chat (MVP)</h2>
        <button onClick={logout}>Logout</button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input value={roomId} onChange={(e) => setRoomId(e.target.value)} placeholder="roomId" />
      </div>

      <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, minHeight: 280 }}>
        {messages
          .filter((m) => m.roomId === roomId)
          .map((m, idx) => (
            <div key={m.id || m._id || m.createdAt || m.ts || `${m.roomId}-${m.user}-${idx}`} style={{ marginBottom: 6 }}>
              <b>{m.user}:</b> {m.text}
              {m.imageUrl && (
                <div style={{ marginTop: 4 }}>
                  <img src={m.imageUrl} alt="chat" style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 4 }} />
                </div>
              )}
            </div>
          ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input
          style={{ flex: 1 }}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a message..."
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button onClick={send}>Send</button>
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <button onClick={sendImage} disabled={!file || !token}>Send Image</button>
      </div>
    </div>
  );
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem("token"));

  if (!token) {
    return <Auth onAuth={setToken} />;
  }

  return (
    <Chat token={token} onLogout={() => setToken(null)} />
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
