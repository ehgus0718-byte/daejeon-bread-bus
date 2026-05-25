import {
  clearReservations,
  loadReservations,
  saveReservations
} from "../services/storageIndex.js";

function createRepositoryResult({ ok = true, data = null, error = null } = {}) {
  return {
    ok,
    data,
    error
  };
}

function normalizeReservations(reservations = []) {
  return Array.isArray(reservations) ? reservations : [];
}

export async function listReservations() {
  try {
    const reservations = normalizeReservations(loadReservations());
    return createRepositoryResult({ data: reservations });
  } catch (error) {
    console.warn("Failed to list reservations", error);
    return createRepositoryResult({ ok: false, data: [], error });
  }
}

export async function replaceReservations(reservations = []) {
  try {
    const safeReservations = normalizeReservations(reservations);
    const saved = saveReservations(safeReservations);

    if (!saved) {
      return createRepositoryResult({
        ok: false,
        data: safeReservations,
        error: new Error("예약 저장에 실패했습니다.")
      });
    }

    return createRepositoryResult({ data: safeReservations });
  } catch (error) {
    console.warn("Failed to replace reservations", error);
    return createRepositoryResult({ ok: false, data: [], error });
  }
}

export async function addReservation(reservation = {}) {
  try {
    const currentResult = await listReservations();
    const currentReservations = normalizeReservations(currentResult.data);
    const nextReservations = [reservation, ...currentReservations];
    return replaceReservations(nextReservations);
  } catch (error) {
    console.warn("Failed to add reservation", error);
    return createRepositoryResult({ ok: false, data: null, error });
  }
}

export async function updateReservation(reservationId, patch = {}) {
  if (!reservationId) {
    return createRepositoryResult({
      ok: false,
      data: null,
      error: new Error("예약 ID가 없습니다.")
    });
  }

  try {
    const currentResult = await listReservations();
    const currentReservations = normalizeReservations(currentResult.data);
    const nextReservations = currentReservations.map((reservation) =>
      reservation.id === reservationId
        ? {
            ...reservation,
            ...patch,
            id: reservation.id
          }
        : reservation
    );

    return replaceReservations(nextReservations);
  } catch (error) {
    console.warn("Failed to update reservation", error);
    return createRepositoryResult({ ok: false, data: null, error });
  }
}

export async function clearReservationRepository() {
  try {
    const cleared = clearReservations();

    if (!cleared) {
      return createRepositoryResult({
        ok: false,
        data: [],
        error: new Error("예약 초기화에 실패했습니다.")
      });
    }

    return createRepositoryResult({ data: [] });
  } catch (error) {
    console.warn("Failed to clear reservations", error);
    return createRepositoryResult({ ok: false, data: [], error });
  }
}

export const reservationRepository = {
  list: listReservations,
  replace: replaceReservations,
  add: addReservation,
  update: updateReservation,
  clear: clearReservationRepository
};
