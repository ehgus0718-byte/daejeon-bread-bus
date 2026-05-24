function toSafeNumber(value, fallbackValue = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallbackValue;
}

export function formatCurrency(value = 0) {
  const amount = Math.max(0, toSafeNumber(value, 0));
  return `${amount.toLocaleString("ko-KR")}원`;
}

export function formatPeopleCount(value = 0) {
  const people = Math.max(0, toSafeNumber(value, 0));
  return `${people.toLocaleString("ko-KR")}명`;
}

export function formatSeatCount(value = 0) {
  const seats = Math.max(0, toSafeNumber(value, 0));
  return `${seats.toLocaleString("ko-KR")}석`;
}

export function formatPercent(value = 0, digits = 0) {
  const rate = Math.max(0, Math.min(1, toSafeNumber(value, 0)));
  return `${(rate * 100).toFixed(digits)}%`;
}

export function formatDateLabel(value = "") {
  if (!value) {
    return "날짜 미정";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short"
  });
}
