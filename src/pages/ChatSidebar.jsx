import React from "react";

const ChatSidebar = ({ isOpen, messages, onClose, msgInput, setMsgInput, sendMessage }) => {
  if (!isOpen) return null;

  return (
    <aside className="chat-sidebar">
      <div className="chat-sidebar-header">
        <div>
          <h3>Chat</h3>
          <p>{messages.length} message(s)</p>
        </div>
        <button type="button" className="chat-sidebar-close" onClick={onClose}>Close</button>
      </div>
      <div className="chat-sidebar-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`chat-message${msg.own ? " is-own" : ""}`}>
            <div className="chat-message-author">{msg.from}</div>
            <div className="chat-message-text">{msg.text}</div>
            <div className="chat-message-time">{msg.time}</div>
          </div>
        ))}
        {messages.length === 0 && <div className="chat-empty-state">No messages yet.</div>}
      </div>
      <div className="chat-sidebar-input">
        <input
          type="text"
          value={msgInput}
          onChange={(e) => setMsgInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder="Type a message"
        />
        <button type="button" onClick={sendMessage}>Send</button>
      </div>
    </aside>
  );
};

export default ChatSidebar;
