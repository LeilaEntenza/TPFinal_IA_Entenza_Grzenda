import React, { useState, useRef, useEffect } from "react";
import axios from "axios"; // Add this import
const API_URL = "http://localhost:3001";

const ChatInterface = () => {
    const [messages, setMessages] = useState([
        {
            sender: "bot", text: `
¡Hola! Soy tu asistente para gestionar estudiantes.
Puedo ayudarte a:
- Buscar estudiantes por nombre o apellido
- Agregar nuevos estudiantes
- Mostrar la lista completa de estudiantes

¿Qué necesitás?
` }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage = { sender: "user", text: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setLoading(true);

        try {
            // POST to your backend with the input message
            const res = await axios.post(`${API_URL}/api/chat`, { message: input });
            const botReply = {
                sender: "bot",
                text: res.data.reply// Adjust this to match your backend response shape
            };
            setMessages((prev) => [...prev, botReply]);
        } catch (err) {
            setMessages((prev) => [
                ...prev,
                { sender: "bot", text: "Error: could not reach backend." }
            ]);
        }
        setLoading(false);
    };

    return (
        <div style={styles.container}>
            <div style={styles.history}>
                {messages.map((m, idx) => (
                    <div
                        key={idx}
                        style={{
                            ...styles.message,
                            alignSelf: m.sender === "user" ? "flex-end" : "flex-start",
                            background: m.sender === "user" ? "#3273dc" : "#f1f1f1",
                            color: m.sender === "user" ? "white" : "black"
                        }}
                    >
                        {m.text}
                    </div>
                ))}
                {loading && (
                    <div style={{ ...styles.message, fontStyle: "italic" }}>
                        Bot is typing...
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSend} style={styles.inputBar}>
                <input
                    style={styles.input}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a message..."
                    disabled={loading}
                />
                <button style={styles.button} type="submit" disabled={loading || !input.trim()}>
                    Send
                </button>
            </form>
        </div>
    );
};

const styles = {
    container: {
        width: 350,
        maxWidth: "100%",
        border: "1px solid #ccc",
        borderRadius: 8,
        display: "flex",
        flexDirection: "column",
        height: 500,
        background: "#fff",
        boxShadow: "0 2px 10px rgba(0,0,0,0.06)"
    },
    history: {
        flex: 1,
        padding: 12,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 8
    },
    message: {
        maxWidth: "80%",
        padding: "8px 12px",
        borderRadius: 16,
        marginBottom: 2,
        fontSize: 15,
        wordBreak: "break-word"
    },
    inputBar: {
        borderTop: "1px solid #eee",
        display: "flex",
        padding: 10,
        gap: 8
    },
    input: {
        flex: 1,
        border: "1px solid #ccc",
        borderRadius: 18,
        padding: "8px 14px",
        fontSize: 15,
        outline: "none"
    },
    button: {
        background: "#3273dc",
        color: "white",
        border: "none",
        borderRadius: 18,
        padding: "8px 18px",
        fontSize: 15,
        cursor: "pointer"
    }
};

export default ChatInterface;