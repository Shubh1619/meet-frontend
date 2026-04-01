import React, { useMemo, useState } from "react";

function isMeaningfulNote(value) {
  const text = (value || "").trim();
  return text.length > 0 && !/^[.\s]+$/.test(text);
}

export default function NoteItem({ note, index, onSave, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(note.note_text || note.content || "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const isValid = useMemo(() => isMeaningfulNote(draft), [draft]);

  const handleSave = async () => {
    if (!isValid) {
      setError("Note cannot be empty or meaningless");
      return;
    }

    setIsSaving(true);
    setError("");
    try {
      await onSave(note.id, draft.trim());
      setIsEditing(false);
    } catch (err) {
      setError(err?.message || "Failed to update note");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm("Delete this note?");
    if (!confirmed) return;
    await onDelete(note.id);
  };

  const handleCancel = () => {
    setDraft(note.note_text || note.content || "");
    setError("");
    setIsEditing(false);
  };

  return (
    <div className="note-item-card">
      <div className="note-item-row">
        <span className="note-item-serial">#{index + 1}</span>
      </div>

      <textarea
        className={`note-item-textarea ${error ? "has-error" : ""}`}
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          if (error) setError("");
        }}
        readOnly={!isEditing}
      />

      {error && <p className="note-item-error">{error}</p>}

      <div className="note-item-actions">
        {!isEditing ? (
          <button type="button" className="btn-note btn-note-edit" onClick={() => setIsEditing(true)}>
            Edit
          </button>
        ) : (
          <>
            <button
              type="button"
              className="btn-note btn-note-save"
              disabled={!isValid || isSaving}
              onClick={handleSave}
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
            <button type="button" className="btn-note btn-note-cancel" onClick={handleCancel}>
              Cancel
            </button>
          </>
        )}

        <button type="button" className="btn-note btn-note-delete" onClick={handleDelete}>
          Delete
        </button>
      </div>
    </div>
  );
}
