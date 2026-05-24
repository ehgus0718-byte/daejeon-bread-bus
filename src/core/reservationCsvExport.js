function escapeCsvValue(value) {
  const text = String(value ?? "");

  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

export const RESERVATION_CSV_HEADERS = [
  "예약ID",
  "예약일",
  "예약자명",
  "연락처",
  "인원",
  "금액",
  "상태",
  "생성일"
];

export function reservationToCsvRow(reservation = {}) {
  return [
    reservation.id,
    reservation.date,
    reservation.name,
    reservation.phone,
    reservation.people,
    reservation.amount,
    reservation.status,
    reservation.createdAt
  ].map(escapeCsvValue);
}

export function reservationsToCsv(reservations = []) {
  const rows = [
    RESERVATION_CSV_HEADERS.map(escapeCsvValue),
    ...reservations.map(reservationToCsvRow)
  ];

  return rows.map((row) => row.join(",")).join("\n");
}

export function createReservationCsvFilename(prefix = "daejeon-bread-bus-reservations") {
  const today = new Date().toISOString().slice(0, 10);
  return `${prefix}-${today}.csv`;
}
