function getNoteText(noteValue) {
  if (!noteValue) {
    return "";
  }

  if (typeof noteValue === "string") {
    return noteValue.trim();
  }

  return String(noteValue.note || "").trim();
}

function getNoteUpdatedAt(noteValue) {
  if (!noteValue || typeof noteValue === "string") {
    return "";
  }

  return noteValue.updatedAt || "";
}

export function mergeReservationNotes({ reservations = [], notes = {} } = {}) {
  return reservations.map((reservation) => {
    const noteValue = notes[reservation.id];
    const adminNote = getNoteText(noteValue);
    const noteUpdatedAt = getNoteUpdatedAt(noteValue);

    if (!adminNote) {
      return reservation;
    }

    return {
      ...reservation,
      adminNote,
      noteUpdatedAt
    };
  });
}

export function hasReservationNote(reservation = {}) {
  return Boolean(String(reservation.adminNote || "").trim());
}

export function filterReservationsWithNotes(reservations = []) {
  return reservations.filter(hasReservationNote);
}
