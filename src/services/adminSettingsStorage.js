const STORAGE_KEY = "daejeon-bread-bus-admin-settings";

function isBrowserStorageAvailable() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function loadAdminSettings(fallbackSettings = {}) {
  if (!isBrowserStorageAvailable()) {
    return fallbackSettings;
  }

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);

    if (!rawValue) {
      return fallbackSettings;
    }

    const parsedValue = JSON.parse(rawValue);

    if (!isPlainObject(parsedValue)) {
      return fallbackSettings;
    }

    return {
      ...fallbackSettings,
      ...parsedValue,
      capacityOverrides: isPlainObject(parsedValue.capacityOverrides)
        ? parsedValue.capacityOverrides
        : fallbackSettings.capacityOverrides,
      priceOverrides: isPlainObject(parsedValue.priceOverrides)
        ? parsedValue.priceOverrides
        : fallbackSettings.priceOverrides,
      scheduleStatus: isPlainObject(parsedValue.scheduleStatus)
        ? parsedValue.scheduleStatus
        : fallbackSettings.scheduleStatus
    };
  } catch (error) {
    console.error("관리자 설정을 불러오는 중 오류가 발생했습니다.", error);
    return fallbackSettings;
  }
}

export function saveAdminSettings(settings = {}) {
  if (!isBrowserStorageAvailable()) {
    return false;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    return true;
  } catch (error) {
    console.error("관리자 설정을 저장하는 중 오류가 발생했습니다.", error);
    return false;
  }
}

export function clearAdminSettings() {
  if (!isBrowserStorageAvailable()) {
    return false;
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error("관리자 설정을 초기화하는 중 오류가 발생했습니다.", error);
    return false;
  }
}
