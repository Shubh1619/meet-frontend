import React, {useState} from "react";
import { useNavigate } from "react-router-dom";

export default function JoinMeeting(){
  const [room, setRoom] = useState("");
  const nav = useNavigate();

  function join(){
    if (!room) return alert("Enter a room id");
    nav(`/meeting/${room}`);
  }

  return (
    <div className="container">
      <div style={{maxWidth:560, margin:"0 auto"}} className="card">
        <h2>Join Meeting</h2>
        <input className="input mt-1" placeholder="Enter room id or link" value={room} onChange={e=>setRoom(e.target.value)} />
        <div className="mt-2">
          <button className="btn" onClick={join}>Join</button>
        </div>
      </div>
    </div>
  );
}
