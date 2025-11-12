import React from "react";
import { useNavigate } from "react-router-dom";

export default function InstantMeeting(){
  const nav = useNavigate();

  function createInstant(){
    // create a random room id
    const id = "inst-" + Math.random().toString(36).slice(2,9);
    nav(`/meeting/${id}`);
  }

  return (
    <div className="container">
      <div className="card" style={{textAlign:"center"}}>
        <h2>Instant Meeting</h2>
        <p className="small-muted">Create a meeting and share the link instantly.</p>
        <div className="mt-2">
          <button className="btn" onClick={createInstant}>Create Instant Meeting</button>
        </div>
      </div>
    </div>
  );
}
