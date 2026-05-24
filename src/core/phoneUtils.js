export function getPhoneDigits(phone = "") {
  return String(phone || "").replace(/\D/g, "");
}

export function formatKoreanPhoneNumber(phone = "") {
  const digits = getPhoneDigits(phone);

  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }

  if (digits.length === 10 && digits.startsWith("02")) {
    return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  return phone;
}

export function isValidKoreanPhoneNumber(phone = "") {
  const digits = getPhoneDigits(phone);

  if (digits.startsWith("02")) {
    return digits.length === 9 || digits.length === 10;
  }

  return digits.length === 10 || digits.length === 11;
}

export function normalizePhoneNumber(phone = "") {
  return formatKoreanPhoneNumber(phone).trim();
}
