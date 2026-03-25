import React from "react";

const RecordingModal = ({
  isOpen,
  mode = "start",
  onClose,
  onStartRecording,
  onDownload,
  onShare,
}) => {
  if (!isOpen) return null;

  if (mode === "saved") {
    return (
      <div className="modal-backdrop">
        <div className="recording-modal">
          <h3>Recording Saved</h3>
          <p className="recording-description">
            Your recording has been successfully saved. You can now download or share it.
          </p>
          <div className="recording-actions">
            <button type="button" className="recording-start" onClick={onDownload}>
              Download Recording
            </button>
            <button type="button" className="recording-share" onClick={onShare}>
              Share
            </button>
            <button type="button" className="recording-cancel" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-backdrop">
      <div className="recording-modal">
        <h3>Start Screen Recording</h3>
        <p className="recording-description">
          You&apos;re about to start recording your screen. This allows you to capture your activity for sharing,
          meetings, or presentations.
        </p>
        <p className="recording-description">
          When you continue, you&apos;ll be able to choose exactly what you want to record, such as your entire screen,
          a specific window, or a browser tab.
        </p>

        <div className="recording-instructions">
          <h4>How it works:</h4>
          <ol>
            <li>Click Start Recording</li>
            <li>Select what you want to record in the next step</li>
            <li>Confirm your selection to begin recording</li>
          </ol>
        </div>

        <div className="recording-privacy-note">
          Your recording will only begin after you choose what to record and confirm. You are always in control and
          can stop recording at any time.
        </div>

        <div className="recording-actions">
          <button type="button" className="recording-cancel" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="recording-start" onClick={onStartRecording}>
            Start Recording
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecordingModal;
