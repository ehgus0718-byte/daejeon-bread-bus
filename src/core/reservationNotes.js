function toSafeNote(value) {
  return String(value || "").trim();
}

export function updateReservationNote({
  reservations = [],
  reservationId,
  note = ""
}) {
  return reservations.map((reservation) => {
    if (reservation.id !== reservationId) {
      return reservation;
    }

    return {
      ...reservation,
      adminNote: toSafeNote(note),
      noteUpdatedAt: new Date().toISOString()
    };
  });
}

export function clearReservationNote({ reservations = [], reservationId }) {
  return reservations.map((reservation) => {
    if (reservation.id !== reservationId) {
      return reservation;
    }

    const { adminNote, noteUpdatedAt, ...restReservation } = reservation;
    return restReservation;
  });
}

export function getReservationNote(reservation = {}) {
  return toSafeNote(reservation.adminNote);
}
