import React from "react";

const ChatSidebar = ({ isOpen, messages, onClose, msgInput, setMsgInput, sendMessage }) => {
  if (!isOpen) return null;

  return (
    <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: "300px", background: "#fff", borderLeft: "1px solid #ccc", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "10px", borderBottom: "1px solid #ccc", display: "flex", justifyContent: "space-between" }}>
        <h3>Chat</h3>
        <button onClick={onClose}>X</button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "10px" }}>
        {messages.map((msg, idx) => (
          <div key={idx}>{msg.text}</div>
        ))}
      </div>
      <div style={{ padding: "10px", borderTop: "1px solid #ccc" }}>
        <input
          type="text"
          value={msgInput}
          onChange={(e) => setMsgInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
          style={{ width: "100%" }}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default ChatSidebar;