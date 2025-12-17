import React, { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import { io } from "socket.io-client";
import { uploadImage } from "./lib/upload.js";

function App() {
  const [roomId, setRoomId] = useState("general");
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [file, setFile] = useState(null);

  const socket = useMemo(() => io("/", { transports: ["websocket"], auth: { token } }), [token]);

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
        const r = await fetch(`/api/chat/rooms/${roomId}/messages`, {
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
      <h2>Realtime Chat (MVP)</h2>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <Login onLogin={doLogin} />
        <input value={roomId} onChange={(e) => setRoomId(e.target.value)} placeholder="roomId" />
      </div>

      <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, minHeight: 280 }}>
        {messages
          .filter((m) => m.roomId === roomId)
          .map((m, idx) => (
            <div key={m.id || m._id || m.createdAt || m.ts || `${m.roomId}-${m.user}-${idx}`} style={{ marginBottom: 6 }}>
              <b>{m.user}:</b> {m.text}
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

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    setLoading(true);
    try {
      await onLogin(username, password);
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" />
      <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" type="password" />
      <button onClick={submit} disabled={loading}>{loading ? "…" : "Login"}</button>
      {error && <span style={{ color: "crimson" }}>{error}</span>}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
