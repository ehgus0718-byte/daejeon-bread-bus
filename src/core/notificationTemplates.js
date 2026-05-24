function formatAmount(amount = 0) {
  const numberValue = Number(amount);
  const safeAmount = Number.isFinite(numberValue) ? numberValue : 0;
  return `${safeAmount.toLocaleString("ko-KR")}원`;
}

function formatReservationSummary(reservation = {}) {
  const date = reservation.date || "예약일 미정";
  const name = reservation.name || "예약자";
  const people = Number(reservation.people || 1);
  const amount = formatAmount(reservation.amount || 0);

  return `${name}님 / ${date} / ${people}명 / ${amount}`;
}

export function createReservationReceivedMessage(reservation = {}) {
  return `[대전빵셔틀 빵버스] 예약이 접수되었습니다. ${formatReservationSummary(
    reservation
  )}`;
}

export function createPaymentPendingMessage(reservation = {}) {
  return `[대전빵셔틀 빵버스] 결제 대기 중입니다. ${formatReservationSummary(
    reservation
  )} 결제 완료 후 예약이 확정됩니다.`;
}

export function createReservationConfirmedMessage(reservation = {}) {
  return `[대전빵셔틀 빵버스] 예약이 확정되었습니다. ${formatReservationSummary(
    reservation
  )}`;
}

export function createReservationCanceledMessage(reservation = {}) {
  return `[대전빵셔틀 빵버스] 예약이 취소되었습니다. ${formatReservationSummary(
    reservation
  )}`;
}

export function createReservationStatusMessage({ reservation = {}, status = "" } = {}) {
  switch (status) {
    case "결제대기":
      return createPaymentPendingMessage(reservation);
    case "예약확정":
    case "결제완료":
      return createReservationConfirmedMessage(reservation);
    case "예약취소":
      return createReservationCanceledMessage(reservation);
    default:
      return createReservationReceivedMessage(reservation);
  }
}
