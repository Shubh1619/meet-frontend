import React from "react";
import { useParams } from "react-router-dom";

export default function MeetingRoom(){
  const { roomId } = useParams();

  return (
    <div className="container">
      <div className="card">
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
          <div>
            <h3 style={{margin:0}}>Room: {roomId}</h3>
            <div className="small-muted">Participants: 1 (you)</div>
          </div>
          <div style={{display:"flex", gap:8}}>
            <button className="btn ghost">Mute</button>
            <button className="btn ghost">Camera</button>
            <button className="btn" style={{background:"var(--color-danger)"}}>Leave</button>
          </div>
        </div>

        <div className="mt-2 video-stage card">
          <div style={{textAlign:"center"}}>
            <div style={{fontWeight:600}}>Video Stage</div>
            <div className="small-muted mt-1">(placeholder for WebRTC / Jitsi / Mux embedded room)</div>
          </div>
        </div>
      </div>
    </div>
  );
}
