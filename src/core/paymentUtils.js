import { RESERVATION_STATUS } from "./statusConstants.js";

function toSafeNumber(value, fallbackValue = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallbackValue;
}

export function calculateReservationAmount({ people = 1, price = 0 } = {}) {
  const safePeople = Math.max(1, toSafeNumber(people, 1));
  const safePrice = Math.max(0, toSafeNumber(price, 0));

  return safePeople * safePrice;
}

export function isPaymentPending(status = "") {
  return status === RESERVATION_STATUS.PAYMENT_PENDING;
}

export function isPaymentCompleted(status = "") {
  return status === RESERVATION_STATUS.PAYMENT_COMPLETED;
}

export function isReservationConfirmed(status = "") {
  return (
    status === RESERVATION_STATUS.CONFIRMED ||
    status === RESERVATION_STATUS.PAYMENT_COMPLETED
  );
}

export function isReservationCanceled(status = "") {
  return status === RESERVATION_STATUS.CANCELED;
}

export function getPaymentLabel(status = "") {
  if (isPaymentCompleted(status)) {
    return "결제완료";
  }

  if (isPaymentPending(status)) {
    return "결제대기";
  }

  if (isReservationCanceled(status)) {
    return "예약취소";
  }

  if (isReservationConfirmed(status)) {
    return "예약확정";
  }

  return status || "상태미정";
}
