import {
  loadReservations,
  saveReservations
} from "./reservationStorage.js";
import {
  loadAdminSettings,
  saveAdminSettings
} from "./adminSettingsStorage.js";

export function loadAppPersistence({
  fallbackReservations = [],
  fallbackAdminSettings = {}
} = {}) {
  return {
    reservations: loadReservations(fallbackReservations),
    adminSettings: loadAdminSettings(fallbackAdminSettings)
  };
}

export function saveAppReservations(reservations = []) {
  return saveReservations(reservations);
}

export function saveAppAdminSettings(settings = {}) {
  return saveAdminSettings(settings);
}

export function saveAppPersistence({
  reservations = [],
  adminSettings = {}
} = {}) {
  const reservationsSaved = saveAppReservations(reservations);
  const adminSettingsSaved = saveAppAdminSettings(adminSettings);

  return reservationsSaved && adminSettingsSaved;
}
