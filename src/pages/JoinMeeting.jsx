import React, {useState} from "react";
import { useNavigate } from "react-router-dom";
import { useDarkMode } from "../context/DarkModeContext";
import { useToast } from "../components/ToastProvider";

export default function JoinMeeting(){
  const { darkMode } = useDarkMode();
  const [room, setRoom] = useState("");
  const nav = useNavigate();
  const toast = useToast();

  const cardBg = darkMode ? "#16213e" : "#fff";
  const textColor = darkMode ? "#e4e4e7" : "#1E1E2F";

  function join(){
    if (!room) return toast.warning("Please enter a room ID or meeting link.");
    
    // Extract room ID from full URL or just room ID
    let roomId = room;
    
    // If it's a full URL, extract the room ID
    if (room.includes("/meeting/")) {
      roomId = room.split("/meeting/")[1]?.split("?")[0]?.split("/")[0];
    }
    
    if (!roomId) return toast.error("Please enter a valid meeting room ID.");
    
    nav(`/meeting/${roomId}`);
  }

  return (
    <div className="container" style={{ paddingTop: "5.75rem", paddingBottom: "2rem" }}>
      <div style={{maxWidth:560, margin:"0 auto", background: cardBg}} className="card">
        <h2 style={{ color: textColor }}>Join Meeting</h2>
        <p style={{ color: darkMode ? "#a8b0c5" : "#606074", marginBottom: "1rem" }}>
          Paste a meeting link or enter a room ID to join quickly from any device.
        </p>
        <input 
          className="input mt-1" 
          placeholder="Enter room id or link" 
          value={room} 
          onChange={e=>setRoom(e.target.value)}
          style={{ background: darkMode ? "#0f0f23" : "#fff", color: textColor, borderColor: darkMode ? "#333" : "#ddd" }}
        />
        <div className="mt-2">
          <button className="btn" onClick={join} style={{ width: "100%" }}>Join</button>
        </div>
      </div>
    </div>
  );
}
