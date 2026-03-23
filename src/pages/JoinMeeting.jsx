import React, {useState} from "react";
import { useNavigate } from "react-router-dom";
import { useDarkMode } from "../context/DarkModeContext";

export default function JoinMeeting(){
  const { darkMode } = useDarkMode();
  const [room, setRoom] = useState("");
  const nav = useNavigate();

  const cardBg = darkMode ? "#16213e" : "#fff";
  const textColor = darkMode ? "#e4e4e7" : "#1E1E2F";

  function join(){
    if (!room) return alert("Enter a room id");
    
    // Extract room ID from full URL or just room ID
    let roomId = room;
    
    // If it's a full URL, extract the room ID
    if (room.includes("/meeting/")) {
      roomId = room.split("/meeting/")[1]?.split("?")[0]?.split("/")[0];
    }
    
    if (!roomId) return alert("Invalid room ID");
    
    nav(`/meeting/${roomId}`);
  }

  return (
    <div className="container">
      <div style={{maxWidth:560, margin:"0 auto", background: cardBg}} className="card">
        <h2 style={{ color: textColor }}>Join Meeting</h2>
        <input 
          className="input mt-1" 
          placeholder="Enter room id or link" 
          value={room} 
          onChange={e=>setRoom(e.target.value)}
          style={{ background: darkMode ? "#0f0f23" : "#fff", color: textColor, borderColor: darkMode ? "#333" : "#ddd" }}
        />
        <div className="mt-2">
          <button className="btn" onClick={join}>Join</button>
        </div>
      </div>
    </div>
  );
}
