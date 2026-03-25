import React, { useState } from "react";

const RecordingModal = ({ isOpen, onClose, onSelectOption, onStartRecording }) => {
  const [selectedOption, setSelectedOption] = useState("screen");

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="recording-modal">
        <h3>Start Recording</h3>
        <div className="recording-options">
          <label className={`recording-option${selectedOption === "screen" ? " is-selected" : ""}`}>
            <input
              type="radio"
              value="screen"
              checked={selectedOption === "screen"}
              onChange={(e) => setSelectedOption(e.target.value)}
            />
            Record Screen
          </label>
          <label className={`recording-option${selectedOption === "camera" ? " is-selected" : ""}`}>
            <input
              type="radio"
              value="camera"
              checked={selectedOption === "camera"}
              onChange={(e) => setSelectedOption(e.target.value)}
            />
            Record Camera
          </label>
        </div>
        <div className="recording-actions">
          <button type="button" className="recording-cancel" onClick={onClose}>Cancel</button>
          <button type="button" className="recording-start" onClick={() => { onSelectOption(selectedOption); onStartRecording(); onClose(); }}>Start</button>
        </div>
      </div>
    </div>
  );
};

export default RecordingModal;
