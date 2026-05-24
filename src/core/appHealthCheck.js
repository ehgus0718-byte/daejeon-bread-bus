function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function createIssue(code, message, level = "warning") {
  return {
    code,
    message,
    level
  };
}

export function checkReservationsHealth(reservations = []) {
  const issues = [];

  if (!Array.isArray(reservations)) {
    return [
      createIssue(
        "reservations_not_array",
        "예약 데이터가 배열 형식이 아닙니다.",
        "error"
      )
    ];
  }

  reservations.forEach((reservation, index) => {
    if (!isPlainObject(reservation)) {
      issues.push(
        createIssue(
          "reservation_not_object",
          `${index + 1}번째 예약 데이터 형식이 올바르지 않습니다.`,
          "error"
        )
      );
      return;
    }

    if (!reservation.id) {
      issues.push(
        createIssue(
          "reservation_missing_id",
          `${index + 1}번째 예약에 ID가 없습니다.`
        )
      );
    }

    if (!reservation.date) {
      issues.push(
        createIssue(
          "reservation_missing_date",
          `${index + 1}번째 예약에 예약일이 없습니다.`
        )
      );
    }

    if (!reservation.name) {
      issues.push(
        createIssue(
          "reservation_missing_name",
          `${index + 1}번째 예약에 예약자명이 없습니다.`
        )
      );
    }
  });

  return issues;
}

export function checkAdminSettingsHealth({
  capacityOverrides = {},
  priceOverrides = {},
  scheduleStatus = {}
} = {}) {
  const issues = [];

  if (!isPlainObject(capacityOverrides)) {
    issues.push(
      createIssue(
        "capacity_overrides_invalid",
        "정원 설정 데이터 형식이 올바르지 않습니다.",
        "error"
      )
    );
  }

  if (!isPlainObject(priceOverrides)) {
    issues.push(
      createIssue(
        "price_overrides_invalid",
        "가격 설정 데이터 형식이 올바르지 않습니다.",
        "error"
      )
    );
  }

  if (!isPlainObject(scheduleStatus)) {
    issues.push(
      createIssue(
        "schedule_status_invalid",
        "모집 상태 설정 데이터 형식이 올바르지 않습니다.",
        "error"
      )
    );
  }

  return issues;
}

export function createAppHealthReport({
  reservations = [],
  capacityOverrides = {},
  priceOverrides = {},
  scheduleStatus = {}
} = {}) {
  const reservationIssues = checkReservationsHealth(reservations);
  const adminSettingIssues = checkAdminSettingsHealth({
    capacityOverrides,
    priceOverrides,
    scheduleStatus
  });
  const issues = [...reservationIssues, ...adminSettingIssues];

  return {
    healthy: issues.every((issue) => issue.level !== "error"),
    issueCount: issues.length,
    errorCount: issues.filter((issue) => issue.level === "error").length,
    warningCount: issues.filter((issue) => issue.level === "warning").length,
    issues,
    checkedAt: new Date().toISOString()
  };
}
