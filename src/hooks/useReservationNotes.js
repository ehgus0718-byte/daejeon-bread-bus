import { useMemo, useState } from "react";
import { mergeReservationNotes } from "../core/reservationNoteMerger.js";
import {
  clearReservationNote,
  loadReservationNotes,
  saveReservationNote
} from "../services/storageIndex.js";

export function useReservationNotes(reservations = []) {
  const [notes, setNotes] = useState(() => loadReservationNotes());

  const reservationsWithNotes = useMemo(
    () => mergeReservationNotes({ reservations, notes }),
    [notes, reservations]
  );

  function handleSaveNote(reservationId, note = "") {
    if (!reservationId) {
      return false;
    }

    const saved = saveReservationNote({ reservationId, note });

    if (saved) {
      setNotes(loadReservationNotes());
    }

    return saved;
  }

  function handleClearNote(reservationId) {
    if (!reservationId) {
      return false;
    }

    const cleared = clearReservationNote(reservationId);

    if (cleared) {
      setNotes(loadReservationNotes());
    }

    return cleared;
  }

  return {
    notes,
    reservationsWithNotes,
    saveNote: handleSaveNote,
    clearNote: handleClearNote,
    reloadNotes: () => setNotes(loadReservationNotes())
  };
}
