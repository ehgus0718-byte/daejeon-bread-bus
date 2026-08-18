export const RESERVATION_STATUS = {
  RECEIVED: "예약접수",
  PAYMENT_PENDING: "결제대기",
  PAYMENT_COMPLETED: "결제완료",
  CONFIRMED: "예약확정",
  CANCELED: "예약취소",
  PAYMENT_FAILED: "결제실패",
  BOARDED: "탑승완료"
};

export const SCHEDULE_STATUS = {
  OPEN: "open",
  CLOSED: "closed"
};

export const RESERVATION_STATUS_OPTIONS = [
  RESERVATION_STATUS.RECEIVED,
  RESERVATION_STATUS.PAYMENT_PENDING,
  RESERVATION_STATUS.PAYMENT_COMPLETED,
  RESERVATION_STATUS.CONFIRMED,
  RESERVATION_STATUS.CANCELED,
  RESERVATION_STATUS.PAYMENT_FAILED,
  RESERVATION_STATUS.BOARDED
];

// ── 매출 집계 기준 (2026-08-18) ────────────────────────────────────────────
// 관리자 화면의 "실결제 금액"은 나이스페이 승인이 실제로 끝난 건만 더한다.
//  - 결제대기: 결제창을 열었다가 마무리하지 않고 나간 흔적. 입금된 돈이 아니다.
//  - 예약접수: 결제 전 단계.
//  - 예약취소 / 결제실패: 종료 상태. 좌석에서도 빠지고 매출에도 잡히지 않는다.
//    (reservation_daily_counts RPC의 제외 목록과 같은 기준)
const PAID_STATUS_SET = new Set([
  RESERVATION_STATUS.PAYMENT_COMPLETED,
  RESERVATION_STATUS.CONFIRMED,
  RESERVATION_STATUS.BOARDED
]);

const CLOSED_STATUS_SET = new Set([
  RESERVATION_STATUS.CANCELED,
  RESERVATION_STATUS.PAYMENT_FAILED
]);

// DB에는 옛 '취소' 값이 남아 있을 수 있어 '예약취소'로 맞춰 읽는다.
export function normalizeReservationStatusValue(status = "") {
  const safeStatus = String(status || "").trim();
  if (safeStatus === "취소") return RESERVATION_STATUS.CANCELED;
  return safeStatus;
}

export function isPaidReservationStatus(status = "") {
  return PAID_STATUS_SET.has(normalizeReservationStatusValue(status));
}

export function isPendingPaymentStatus(status = "") {
  return normalizeReservationStatusValue(status) === RESERVATION_STATUS.PAYMENT_PENDING;
}

export function isClosedReservationStatus(status = "") {
  return CLOSED_STATUS_SET.has(normalizeReservationStatusValue(status));
}

export const SCHEDULE_STATUS_OPTIONS = [
  {
    value: SCHEDULE_STATUS.OPEN,
    label: "예약가능"
  },
  {
    value: SCHEDULE_STATUS.CLOSED,
    label: "예약마감"
  }
];
