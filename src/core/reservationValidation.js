function getPhoneDigits(value = "") {
  return String(value || "").replace(/[^0-9]/g, "");
}

function hasRepeatedTail(digits = "") {
  const tail = digits.slice(3);
  return tail.length > 0 && /^(\d)\1+$/.test(tail);
}

function hasSimpleSequentialTail(digits = "") {
  const tail = digits.slice(3);
  if (tail.length !== 8) return false;

  const ascending = "01234567890123456789";
  const descending = "98765432109876543210";

  return ascending.includes(tail) || descending.includes(tail);
}

function isValidMobilePhoneNumber(value = "") {
  const digits = getPhoneDigits(value);

  if (!digits.startsWith("010")) return false;
  if (digits.length !== 11) return false;
  if (hasRepeatedTail(digits)) return false;
  if (hasSimpleSequentialTail(digits)) return false;

  return true;
}

function isValidReservationName(value = "") {
  const name = String(value || "").trim();

  if (name.length < 2) return false;
  if (name.length > 20) return false;
  if (!/[가-힣a-zA-Z]/.test(name)) return false;

  return true;
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

  if (!isValidReservationName(form.name)) {
    return {
      valid: false,
      message: "예약자명은 한글 또는 영문 2~20자로 입력해주세요."
    };
  }

  if (!form.phone?.trim()) {
    return {
      valid: false,
      message: "연락 가능한 휴대폰 번호를 입력해주세요."
    };
  }

  if (!isValidMobilePhoneNumber(form.phone)) {
    return {
      valid: false,
      message: "연락처는 실제 연락 가능한 휴대폰 번호로 입력해주세요."
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
