function toComparableText(value) {
  return String(value || "").trim().toLowerCase();
}

function toPhoneDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

function isActiveReservation(reservation = {}) {
  return reservation.status !== "취소" && reservation.status !== "예약취소";
}

export function createDuplicateReservationKey(reservation = {}) {
  return [
    toComparableText(reservation.date),
    toPhoneDigits(reservation.phone)
  ].join("|");
}

export function isSameReservationCandidate(firstReservation = {}, secondReservation = {}) {
  return (
    createDuplicateReservationKey(firstReservation) ===
    createDuplicateReservationKey(secondReservation)
  );
}

export function findDuplicateReservation(reservations = [], nextReservation = {}) {
  const nextKey = createDuplicateReservationKey(nextReservation);

  if (!nextKey.replace(/\|/g, "")) {
    return null;
  }

  return (
    reservations.find(
      (reservation) =>
        isActiveReservation(reservation) &&
        createDuplicateReservationKey(reservation) === nextKey
    ) || null
  );
}

export function hasDuplicateReservation(reservations = [], nextReservation = {}) {
  return Boolean(findDuplicateReservation(reservations, nextReservation));
}
