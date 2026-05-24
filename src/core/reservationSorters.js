function toComparableDate(value) {
  const time = new Date(value || 0).getTime();
  return Number.isFinite(time) ? time : 0;
}

function toComparableNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function toComparableText(value) {
  return String(value || "").trim();
}

export function sortReservationsByNewest(reservations = []) {
  return [...reservations].sort(
    (a, b) => toComparableDate(b.createdAt) - toComparableDate(a.createdAt)
  );
}

export function sortReservationsByOldest(reservations = []) {
  return [...reservations].sort(
    (a, b) => toComparableDate(a.createdAt) - toComparableDate(b.createdAt)
  );
}

export function sortReservationsByDate(reservations = []) {
  return [...reservations].sort((a, b) =>
    toComparableText(a.date).localeCompare(toComparableText(b.date))
  );
}

export function sortReservationsByPeople(reservations = []) {
  return [...reservations].sort(
    (a, b) => toComparableNumber(b.people) - toComparableNumber(a.people)
  );
}

export function sortReservationsByAmount(reservations = []) {
  return [...reservations].sort(
    (a, b) => toComparableNumber(b.amount) - toComparableNumber(a.amount)
  );
}

export function sortReservations(reservations = [], sortKey = "newest") {
  switch (sortKey) {
    case "oldest":
      return sortReservationsByOldest(reservations);
    case "date":
      return sortReservationsByDate(reservations);
    case "people":
      return sortReservationsByPeople(reservations);
    case "amount":
      return sortReservationsByAmount(reservations);
    case "newest":
    default:
      return sortReservationsByNewest(reservations);
  }
}
