import React, {useState} from "react";
import ActionButton from "../components/ActionButton";

export default function ScheduleMeeting(){
  const [title,setTitle]=useState(""); const [date,setDate]=useState(""); const [start,setStart]=useState(""); const [end,setEnd]=useState("");

  function submit(e){
    e.preventDefault();
    // TODO: schedule via API
    alert("Meeting scheduled (placeholder)");
  }

  return (
    <div className="container">
      <div className="card" style={{maxWidth:720, margin:"0 auto"}}>
        <h2>Schedule Meeting</h2>
        <form onSubmit={submit}>
          <label className="small-muted">Title</label>
          <input className="input mt-1" value={title} onChange={e=>setTitle(e.target.value)} />
          <div style={{display:"flex", gap:8, marginTop:8}}>
            <div style={{flex:1}}>
              <label className="small-muted">Date</label>
              <input className="input mt-1" type="date" value={date} onChange={e=>setDate(e.target.value)} />
            </div>
            <div style={{flex:1}}>
              <label className="small-muted">Start</label>
              <input className="input mt-1" type="time" value={start} onChange={e=>setStart(e.target.value)} />
            </div>
            <div style={{flex:1}}>
              <label className="small-muted">End</label>
              <input className="input mt-1" type="time" value={end} onChange={e=>setEnd(e.target.value)} />
            </div>
          </div>

          <div className="mt-2" style={{display:"flex", gap:8}}>
            <ActionButton type="submit">Schedule</ActionButton>
            <ActionButton variant="ghost">Cancel</ActionButton>
          </div>
        </form>
      </div>
    </div>
  );
}
