import React from "react";

const VideoTile = ({ id, name, isLocal, isPinned, captions, onTogglePin }) => {
  return (
    <div style={{ border: "1px solid #ccc", padding: "10px", margin: "5px", position: "relative" }}>
      <video style={{ width: "100%", height: "200px", background: "#000" }} />
      <div>{name}</div>
      {captions && <div>{captions}</div>}
      <button onClick={() => onTogglePin(id)} style={{ position: "absolute", top: "5px", right: "5px" }}>
        {isPinned ? "Unpin" : "Pin"}
      </button>
    </div>
  );
};

export default VideoTile;