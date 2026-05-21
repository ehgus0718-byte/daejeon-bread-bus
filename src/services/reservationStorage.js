const STORAGE_KEY = "daejeon-bread-bus-reservations";

function isBrowserStorageAvailable() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

export function loadReservations(fallbackReservations = []) {
  if (!isBrowserStorageAvailable()) {
    return fallbackReservations;
  }

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);

    if (!rawValue) {
      return fallbackReservations;
    }

    const parsedValue = JSON.parse(rawValue);

    if (!Array.isArray(parsedValue)) {
      return fallbackReservations;
    }

    return parsedValue;
  } catch (error) {
    console.error("예약 데이터를 불러오는 중 오류가 발생했습니다.", error);
    return fallbackReservations;
  }
}

export function saveReservations(reservations = []) {
  if (!isBrowserStorageAvailable()) {
    return false;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(reservations));
    return true;
  } catch (error) {
    console.error("예약 데이터를 저장하는 중 오류가 발생했습니다.", error);
    return false;
  }
}

export function clearReservations() {
  if (!isBrowserStorageAvailable()) {
    return false;
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error("예약 데이터를 초기화하는 중 오류가 발생했습니다.", error);
    return false;
  }
}
