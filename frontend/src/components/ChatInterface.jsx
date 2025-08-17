import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { marked } from "marked";
import DOMPurify from "dompurify";

const API_URL = "http://localhost:3001";

const ChatInterface = () => {
    const [messages, setMessages] = useState([
        {
            sender: "bot",
            text: marked("¡Hola! Soy tu asistente legal. ¿En qué puedo ayudarte?"),
            thoughts: "Iniciando conversación con el usuario"
        }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [showThoughts, setShowThoughts] = useState(true);
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
            const res = await axios.post(`${API_URL}/api/chat`, { message: input });
            const botReply = {
                sender: "bot",
                text: marked(res.data.reply || "No se recibió respuesta"),
                thoughts: res.data.thoughts || "No hay pensamientos disponibles",
                fullResponse: res.data.fullResponse || ""
            };
            setMessages((prev) => [...prev, botReply]);
        } catch (err) {
            console.error("Error:", err);
            setMessages((prev) => [
                ...prev,
                { 
                    sender: "bot", 
                    text: marked("❌ Error: No se pudo conectar con el backend."),
                    thoughts: "Error de conexión con el servidor"
                }
            ]);
        }
        setLoading(false);
    };

    const toggleThoughts = () => {
        setShowThoughts(!showThoughts);
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <span style={{ fontWeight: 600, fontSize: 18, letterSpacing: 1 }}>🧠 Asistente Legal IA</span>
                <button 
                    onClick={toggleThoughts}
                    style={styles.toggleButton}
                    title={showThoughts ? "Ocultar pensamientos" : "Mostrar pensamientos"}
                >
                    {showThoughts ? "🧠" : "💭"}
                </button>
            </div>
            
            <div style={styles.history}>
                {messages.map((m, idx) => (
                    <div key={idx} style={styles.messageContainer}>
                        {/* Mensaje principal */}
                        <div
                            style={{
                                ...styles.message,
                                alignSelf: m.sender === "user" ? "flex-end" : "flex-start",
                                background: m.sender === "user"
                                    ? "linear-gradient(90deg, #7c3aed 60%, #a78bfa 100%)"
                                    : "linear-gradient(90deg, #f5f3ff 60%, #ede9fe 100%)",
                                color: m.sender === "user" ? "white" : "#222",
                                borderTopRightRadius: m.sender === "user" ? 4 : 16,
                                borderTopLeftRadius: m.sender === "user" ? 16 : 4,
                                boxShadow: m.sender === "user"
                                    ? "0 2px 8px rgba(50,115,220,0.08)"
                                    : "0 2px 8px rgba(180,180,180,0.08)"
                            }}
                            {...(m.sender === "bot"
                                ? { dangerouslySetInnerHTML: { __html: DOMPurify.sanitize(m.text) } }
                                : { children: m.text })}
                        />
                        
                        {/* Pensamientos del bot */}
                        {m.sender === "bot" && m.thoughts && showThoughts && (
                            <div style={styles.thoughtsContainer}>
                                <div style={styles.thoughtsHeader}>
                                    💭 Proceso de pensamiento:
                                </div>
                                <div style={styles.thoughts}>
                                    {m.thoughts}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                
                {loading && (
                    <div style={styles.loadingContainer}>
                        <div style={styles.loadingMessage}>
                            🤔 El bot está pensando...
                        </div>
                        <div style={styles.loadingDots}>
                            <span style={styles.dot}>.</span>
                            <span style={styles.dot}>.</span>
                            <span style={styles.dot}>.</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            
            <form onSubmit={handleSend} style={styles.inputBar}>
                <input
                    style={styles.input}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Escribe tu pregunta legal..."
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
        width: 400,
        maxWidth: "100%",
        border: "1.5px solid #e0e6ef",
        borderRadius: 16,
        display: "flex",
        flexDirection: "column",
        height: 600,
        background: "linear-gradient(120deg, #f5f3ff 60%, #ede9fe 100%)",
        boxShadow: "0 4px 24px rgba(111, 53, 255, 0.10), 0 1.5px 4px rgba(0,0,0,0.04)",
        fontFamily: "'Segoe UI', 'Roboto', 'Arial', sans-serif"
    },
    header: {
        padding: "14px 18px 10px 18px",
        borderBottom: "1.5px solid #e0e6ef",
        background: "linear-gradient(90deg, #7c3aed 10%, #a78bfa 90%)",
        color: "white",
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 2,
        fontFamily: "'Segoe UI', 'Roboto', 'Arial', sans-serif"
    },
    toggleButton: {
        background: "rgba(255,255,255,0.2)",
        border: "none",
        borderRadius: "50%",
        width: 32,
        height: 32,
        cursor: "pointer",
        fontSize: 16,
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
    },
    history: {
        flex: 1,
        padding: 16,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        background: "transparent"
    },
    messageContainer: {
        display: "flex",
        flexDirection: "column",
        gap: 8
    },
    message: {
        maxWidth: "85%",
        padding: "12px 16px",
        borderRadius: 16,
        fontSize: 15.5,
        wordBreak: "break-word",
        transition: "background 0.2s",
        lineHeight: 1.4
    },
    thoughtsContainer: {
        maxWidth: "85%",
        alignSelf: "flex-start",
        background: "rgba(139, 92, 246, 0.1)",
        border: "1px solid rgba(139, 92, 246, 0.2)",
        borderRadius: 12,
        padding: 12,
        marginLeft: 8
    },
    thoughtsHeader: {
        fontSize: 12,
        fontWeight: 600,
        color: "#7c3aed",
        marginBottom: 6,
        textTransform: "uppercase",
        letterSpacing: 0.5
    },
    thoughts: {
        fontSize: 13,
        color: "#6b7280",
        lineHeight: 1.4,
        fontStyle: "italic"
    },
    loadingContainer: {
        alignSelf: "center",
        textAlign: "center",
        padding: "20px"
    },
    loadingMessage: {
        fontSize: 14,
        color: "#6b7280",
        marginBottom: 8
    },
    loadingDots: {
        display: "flex",
        justifyContent: "center",
        gap: 4
    },
    dot: {
        fontSize: 20,
        color: "#7c3aed",
        animation: "bounce 1.4s infinite ease-in-out both"
    },
    inputBar: {
        borderTop: "1.5px solid #e0e6ef",
        display: "flex",
        padding: 12,
        gap: 10,
        background: "#f5f3ff",
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16
    },
    input: {
        flex: 1,
        border: "1.5px solid #d1d9e6",
        borderRadius: 18,
        padding: "10px 16px",
        fontSize: 15.5,
        outline: "none",
        background: "#fff",
        boxShadow: "0 1px 2px rgba(111,53,255,0.03)"
    },
    button: {
        background: "linear-gradient(90deg, #7c3aed 60%, #a78bfa 100%)",
        color: "white",
        border: "none",
        borderRadius: 18,
        padding: "10px 22px",
        fontSize: 15.5,
        cursor: "pointer",
        fontWeight: 500,
        boxShadow: "0 1px 4px rgba(111,53,255,0.07)"
    }
};

export default ChatInterface;