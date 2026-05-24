const RESERVATION_NOTE_STORAGE_KEY = "daejeon-bread-bus:reservation-notes";

function canUseLocalStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function readReservationNotes() {
  if (!canUseLocalStorage()) {
    return {};
  }

  try {
    const rawValue = window.localStorage.getItem(RESERVATION_NOTE_STORAGE_KEY);
    return rawValue ? JSON.parse(rawValue) : {};
  } catch (error) {
    console.warn("Failed to load reservation notes", error);
    return {};
  }
}

function writeReservationNotes(notes = {}) {
  if (!canUseLocalStorage()) {
    return false;
  }

  try {
    window.localStorage.setItem(
      RESERVATION_NOTE_STORAGE_KEY,
      JSON.stringify(notes)
    );
    return true;
  } catch (error) {
    console.warn("Failed to save reservation notes", error);
    return false;
  }
}

export function loadReservationNotes(fallbackNotes = {}) {
  const savedNotes = readReservationNotes();
  return {
    ...fallbackNotes,
    ...savedNotes
  };
}

export function saveReservationNote({ reservationId, note = "" } = {}) {
  if (!reservationId) {
    return false;
  }

  const notes = readReservationNotes();
  notes[reservationId] = {
    note: String(note || "").trim(),
    updatedAt: new Date().toISOString()
  };

  return writeReservationNotes(notes);
}

export function clearReservationNote(reservationId) {
  if (!reservationId) {
    return false;
  }

  const notes = readReservationNotes();
  delete notes[reservationId];

  return writeReservationNotes(notes);
}

export function getReservationNoteFromStorage(reservationId) {
  if (!reservationId) {
    return "";
  }

  const notes = readReservationNotes();
  return notes[reservationId]?.note || "";
}
