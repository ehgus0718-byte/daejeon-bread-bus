function parseDate(value = "") {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function isValidDateString(value = "") {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    return false;
  }

  return Boolean(parseDate(value));
}

export function isPastDate(value = "", today = new Date()) {
  const targetDate = parseDate(value);

  if (!targetDate) {
    return false;
  }

  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);

  return targetDate.getTime() < todayStart.getTime();
}

export function isFutureOrToday(value = "", today = new Date()) {
  return isValidDateString(value) && !isPastDate(value, today);
}

export function validateReservationDate(value = "", today = new Date()) {
  if (!value) {
    return {
      valid: false,
      message: "예약 날짜를 선택해주세요."
    };
  }

  if (!isValidDateString(value)) {
    return {
      valid: false,
      message: "예약 날짜 형식이 올바르지 않습니다."
    };
  }

  if (isPastDate(value, today)) {
    return {
      valid: false,
      message: "지난 날짜는 예약할 수 없습니다."
    };
  }

  return {
    valid: true,
    message: ""
  };
}
