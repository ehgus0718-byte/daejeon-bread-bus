function getPhoneDigits(value = "") {
  return String(value || "").replace(/[^0-9]/g, "");
}

function isValidPhoneNumber(value = "") {
  const digits = getPhoneDigits(value);
  return digits.startsWith("0") && digits.length >= 10 && digits.length <= 11;
}

export function validateReservationForm({
  selectedDate,
  scheduleStatus,
  form = {},
  remainingSeats = 0
}) {
  if (!selectedDate) {
    return {
      valid: false,
      message: "예약 날짜를 선택해주세요."
    };
  }

  if (scheduleStatus !== "open") {
    return {
      valid: false,
      message: "선택한 날짜는 예약마감 상태입니다."
    };
  }

  if (!form.name?.trim()) {
    return {
      valid: false,
      message: "예약자명을 입력해주세요."
    };
  }

  if (!form.phone?.trim()) {
    return {
      valid: false,
      message: "연락처를 입력해주세요."
    };
  }

  if (!isValidPhoneNumber(form.phone)) {
    return {
      valid: false,
      message: "연락처는 0으로 시작하는 10~11자리 번호로 입력해주세요."
    };
  }

  if (Number(form.people || 0) < 1) {
    return {
      valid: false,
      message: "예약 인원을 선택해주세요."
    };
  }

  if (Number(form.people || 0) > Number(remainingSeats || 0)) {
    return {
      valid: false,
      message: "잔여 좌석이 부족합니다."
    };
  }

  return {
    valid: true,
    message: ""
  };
}
