import React, { useEffect } from "react";
import NoteItem from "./NoteItem";

export default function NotesModal({
  open,
  selectedDate,
  notes,
  onClose,
  onSaveNote,
  onDeleteNote,
}) {
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="notes-modal-overlay" onClick={onClose}>
      <div
        className="notes-modal-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Notes for Selected Date"
      >
        <div className="notes-modal-header">
          <div>
            <h3 className="notes-modal-title">Notes for Selected Date</h3>
            <p className="notes-modal-subtitle">{selectedDate}</p>
          </div>
          <button type="button" className="notes-modal-close" onClick={onClose} aria-label="Close notes modal">
            x
          </button>
        </div>

        <div className="notes-modal-list">
          {notes.length === 0 ? (
            <div className="notes-empty-state">No notes available for this date</div>
          ) : (
            notes.map((note, idx) => (
              <NoteItem
                key={note.id}
                note={note}
                index={idx}
                onSave={onSaveNote}
                onDelete={onDeleteNote}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
