export function updateReservationStatus({
  reservations = [],
  reservationId,
  nextStatus
}) {
  return reservations.map((reservation) => {
    if (reservation.id !== reservationId) {
      return reservation;
    }

    return {
      ...reservation,
      status: nextStatus
    };
  });
}
