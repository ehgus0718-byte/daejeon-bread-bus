export const DEFAULT_DATE_SETTINGS = {
  "2026-05-30": {
    capacity: 15,
    price: 30000,
    status: "open"
  },
  "2026-06-06": {
    capacity: 15,
    price: 30000,
    status: "open"
  }
};

export const RESERVATION_STATUS = {
  PENDING: "결제대기",
  PAID: "결제완료",
  CONFIRMED: "예약확정",
  COMPLETED: "탑승완료",
  CANCELED: "취소",
  CANCELED_ALT: "예약취소"
};

export function getDateSetting(dateSettings, date) {
  return dateSettings?.[date] || null;
}

export function getCapacity(dateSettings, date, fallback = 15) {
  const setting = getDateSetting(dateSettings, date);
  return Number(setting?.capacity || fallback);
}

export function getPrice(dateSettings, date, fallback = 0) {
  const setting = getDateSetting(dateSettings, date);
  return Number(setting?.price || fallback);
}

export function getStatus(dateSettings, date) {
  const setting = getDateSetting(dateSettings, date);
  return setting?.status || "closed";
}

export function isOpenSchedule(dateSettings, date) {
  return getStatus(dateSettings, date) === "open";
}

export function countReservedPeople(reservations = [], date) {
  return reservations
    .filter((item) => {
      const isSameDate = item.date === date;
      const isCanceled = [
        RESERVATION_STATUS.CANCELED,
        RESERVATION_STATUS.CANCELED_ALT
      ].includes(item.status);

      return isSameDate && !isCanceled;
    })
    .reduce((sum, item) => sum + Number(item.people || 0), 0);
}

export function getRemainingSeats({
  reservations = [],
  dateSettings = {},
  date,
  fallbackCapacity = 15
}) {
  if (!isOpenSchedule(dateSettings, date)) {
    return 0;
  }

  const capacity = getCapacity(dateSettings, date, fallbackCapacity);
  const reserved = countReservedPeople(reservations, date);

  return Math.max(0, capacity - reserved);
}
