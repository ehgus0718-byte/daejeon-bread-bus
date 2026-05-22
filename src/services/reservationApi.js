import {
  loadReservations,
  saveReservations
} from "./reservationStorage.js";
import {
  loadAdminSettings,
  saveAdminSettings
} from "./adminSettingsStorage.js";

function createSuccess(data) {
  return {
    ok: true,
    data,
    error: null
  };
}

function createFailure(error) {
  return {
    ok: false,
    data: null,
    error
  };
}

export async function fetchReservations(fallbackReservations = []) {
  try {
    const reservations = loadReservations(fallbackReservations);
    return createSuccess(reservations);
  } catch (error) {
    console.error("예약 목록 API 처리 중 오류가 발생했습니다.", error);
    return createFailure("예약 목록을 불러오지 못했습니다.");
  }
}

export async function persistReservations(reservations = []) {
  try {
    const saved = saveReservations(reservations);

    if (!saved) {
      return createFailure("예약 목록을 저장하지 못했습니다.");
    }

    return createSuccess(reservations);
  } catch (error) {
    console.error("예약 저장 API 처리 중 오류가 발생했습니다.", error);
    return createFailure("예약 목록 저장 중 오류가 발생했습니다.");
  }
}

export async function fetchAdminSettings(fallbackSettings = {}) {
  try {
    const settings = loadAdminSettings(fallbackSettings);
    return createSuccess(settings);
  } catch (error) {
    console.error("관리자 설정 API 처리 중 오류가 발생했습니다.", error);
    return createFailure("관리자 설정을 불러오지 못했습니다.");
  }
}

export async function persistAdminSettings(settings = {}) {
  try {
    const saved = saveAdminSettings(settings);

    if (!saved) {
      return createFailure("관리자 설정을 저장하지 못했습니다.");
    }

    return createSuccess(settings);
  } catch (error) {
    console.error("관리자 설정 저장 API 처리 중 오류가 발생했습니다.", error);
    return createFailure("관리자 설정 저장 중 오류가 발생했습니다.");
  }
}
