function toSafePassword(value = "") {
  return String(value || "").trim();
}

export function validateAdminPassword({ password = "", accessCode = "" } = {}) {
  const safePassword = toSafePassword(password);
  const safeAccessCode = toSafePassword(accessCode);

  if (!safePassword) {
    return {
      valid: false,
      message: "관리자 비밀번호를 입력해주세요."
    };
  }

  if (safePassword !== safeAccessCode) {
    return {
      valid: false,
      message: "관리자 비밀번호가 올바르지 않습니다."
    };
  }

  return {
    valid: true,
    message: ""
  };
}
