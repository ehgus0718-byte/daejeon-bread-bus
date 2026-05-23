export function validateAdminPassword({ password = "", accessCode = "" } = {}) {
  if (!password) {
    return {
      valid: false,
      message: "관리자 비밀번호를 입력해주세요."
    };
  }

  if (password !== accessCode) {
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
