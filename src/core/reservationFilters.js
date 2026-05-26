function toSearchText(value) {
  return String(value || "").trim().toLowerCase();
}

function toDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

export function filterReservationsByDate(reservations = [], date = "") {
  if (!date) {
    return reservations;
  }

  return reservations.filter((reservation) => reservation.date === date);
}

export function filterReservationsByStatus(reservations = [], status = "") {
  if (!status) {
    return reservations;
  }

  return reservations.filter((reservation) => reservation.status === status);
}

export function searchReservations(reservations = [], keyword = "") {
  const normalizedKeyword = toSearchText(keyword);
  const digitKeyword = toDigits(keyword);

  if (!normalizedKeyword) {
    return reservations;
  }

  return reservations.filter((reservation) => {
    const searchableValues = [
      reservation.name,
      reservation.phone,
      reservation.date,
      reservation.status
    ];

    const hasTextMatch = searchableValues.some((value) =>
      toSearchText(value).includes(normalizedKeyword)
    );

    const hasPhoneNumberMatch = digitKeyword
      ? toDigits(reservation.phone).includes(digitKeyword)
      : false;

    const hasDateNumberMatch = digitKeyword
      ? toDigits(reservation.date).includes(digitKeyword)
      : false;

    return hasTextMatch || hasPhoneNumberMatch || hasDateNumberMatch;
  });
}

export function filterReservations({
  reservations = [],
  date = "",
  status = "",
  keyword = ""
} = {}) {
  const dateFiltered = filterReservationsByDate(reservations, date);
  const statusFiltered = filterReservationsByStatus(dateFiltered, status);

  return searchReservations(statusFiltered, keyword);
}
