import React from "react";
import ChatInterface from "./components/ChatInterface.jsx";


function App() {
  return (
    <div
      style={{
        maxWidth: 600,
        margin: "auto",
        fontFamily: "'Segoe UI', 'Roboto', 'Arial', sans-serif"
      }}
    >
      <h1>Chat</h1>
      <ChatInterface />
    </div>
  );

}

export default App;