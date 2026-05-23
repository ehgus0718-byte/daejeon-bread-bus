function toSearchText(value) {
  return String(value || "").trim().toLowerCase();
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

    return searchableValues.some((value) =>
      toSearchText(value).includes(normalizedKeyword)
    );
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
