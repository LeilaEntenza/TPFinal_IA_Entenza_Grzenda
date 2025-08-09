import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { marked } from "marked";
import DOMPurify from "dompurify"; // <--- Add this import
const API_URL = "http://localhost:3001";

const ChatInterface = () => {
    const [messages, setMessages] = useState([
        {
            sender: "bot",
            text: marked("¡Hola! Soy tu asistente legal. ¿En qué puedo ayudarte?")
        }
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
                text: marked(res.data.reply) // <-- Parse reply with marked!
            };
            setMessages((prev) => [...prev, botReply]);
        } catch (err) {
            setMessages((prev) => [
                ...prev,
                { sender: "bot", text: marked("Error: could not reach backend.") }
            ]);
        }
        setLoading(false);
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <span style={{ fontWeight: 600, fontSize: 18, letterSpacing: 1 }}>Asistente Legal</span>
            </div>
            <div style={styles.history}>
                {messages.map((m, idx) => (
                    <div
                        key={idx}
                        style={{
                            ...styles.message,
                            alignSelf: m.sender === "user" ? "flex-end" : "flex-start",
                            background: m.sender === "user"
                                ? "linear-gradient(90deg, #7c3aed 60%, #a78bfa 100%)" // violeta Messenger
                                : "linear-gradient(90deg, #f5f3ff 60%, #ede9fe 100%)", // violeta claro
                            color: m.sender === "user" ? "white" : "#222",
                            borderTopRightRadius: m.sender === "user" ? 4 : 16,
                            borderTopLeftRadius: m.sender === "user" ? 16 : 4,
                            boxShadow: m.sender === "user"
                                ? "0 2px 8px rgba(50,115,220,0.08)"
                                : "0 2px 8px rgba(180,180,180,0.08)"
                        }}
                        // Only use dangerouslySetInnerHTML for bot messages
                        {...(m.sender === "bot"
                            ? { dangerouslySetInnerHTML: { __html: DOMPurify.sanitize(m.text) } }
                            : { children: m.text })}
                    />
                ))}
                {loading && (
                    <div style={{ ...styles.message, fontStyle: "italic", background: "#f5f7fa", color: "#888" }}>
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
                    placeholder="Escribe tu mensaje..."
                    disabled={loading}
                />
                <button style={styles.button} type="submit" disabled={loading || !input.trim()}>
                    Enviar
                </button>
            </form>
        </div>
    );
};

const styles = {
    container: {
        width: 350,
        maxWidth: "100%",
        border: "1.5px solid #e0e6ef",
        borderRadius: 16,
        display: "flex",
        flexDirection: "column",
        height: 500,
        background: "linear-gradient(120deg, #f5f3ff 60%, #ede9fe 100%)", // violeta claro
        boxShadow: "0 4px 24px rgba(111, 53, 255, 0.10), 0 1.5px 4px rgba(0,0,0,0.04)",
        fontFamily: "'Segoe UI', 'Roboto', 'Arial', sans-serif"
    },
    header: {
        padding: "14px 18px 10px 18px",
        borderBottom: "1.5px solid #e0e6ef",
        background: "linear-gradient(90deg, #7c3aed 10%, #a78bfa 90%)", // violeta Messenger
        color: "white",
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        display: "flex",
        alignItems: "center",
        marginBottom: 2,
        fontFamily: "'Segoe UI', 'Roboto', 'Arial', sans-serif"
    },
    history: {
        flex: 1,
        padding: 16,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        background: "transparent",
        fontFamily: "'Segoe UI', 'Roboto', 'Arial', sans-serif"
    },
    message: {
        maxWidth: "80%",
        padding: "10px 16px",
        borderRadius: 16,
        marginBottom: 2,
        fontSize: 15.5,
        wordBreak: "break-word",
        transition: "background 0.2s",
        fontFamily: "'Segoe UI', 'Roboto', 'Arial', sans-serif"
    },
    inputBar: {
        borderTop: "1.5px solid #e0e6ef",
        display: "flex",
        padding: 12,
        gap: 10,
        background: "#f5f3ff", // violeta claro
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
        fontFamily: "'Segoe UI', 'Roboto', 'Arial', sans-serif"
    },
    input: {
        flex: 1,
        border: "1.5px solid #d1d9e6",
        borderRadius: 18,
        padding: "10px 16px",
        fontSize: 15.5,
        outline: "none",
        background: "#fff",
        boxShadow: "0 1px 2px rgba(111,53,255,0.03)",
        fontFamily: "'Segoe UI', 'Roboto', 'Arial', sans-serif"
    },
    button: {
        background: "linear-gradient(90deg, #7c3aed 60%, #a78bfa 100%)", // violeta Messenger
        color: "white",
        border: "none",
        borderRadius: 18,
        padding: "10px 22px",
        fontSize: 15.5,
        cursor: "pointer",
        fontWeight: 500,
        boxShadow: "0 1px 4px rgba(111,53,255,0.07)",
        fontFamily: "'Segoe UI', 'Roboto', 'Arial', sans-serif"
    }
};

export default ChatInterface;