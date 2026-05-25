import { reservationApiClient } from "../api/index.js";
import {
  clearReservations,
  loadReservations,
  saveReservations
} from "../services/storageIndex.js";
import { shouldUseReservationApi } from "./reservationRepositoryMode.js";

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

function normalizeApiReservations(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.reservations)) {
    return data.reservations;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
}

function normalizeApiReservation(data) {
  if (!data) {
    return null;
  }

  if (data.reservation) {
    return data.reservation;
  }

  if (data.data && !Array.isArray(data.data)) {
    return data.data;
  }

  return data;
}

function createMissingReservationIdResult() {
  return createRepositoryResult({
    ok: false,
    data: null,
    error: new Error("예약 ID가 없습니다.")
  });
}

async function listLocalReservations() {
  const reservations = normalizeReservations(loadReservations());
  return createRepositoryResult({ data: reservations });
}

async function replaceLocalReservations(reservations = []) {
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
}

async function addLocalReservation(reservation = {}) {
  const currentResult = await listLocalReservations();
  const currentReservations = normalizeReservations(currentResult.data);
  const nextReservations = [reservation, ...currentReservations];
  return replaceLocalReservations(nextReservations);
}

async function updateLocalReservation(reservationId, patch = {}) {
  if (!reservationId) {
    return createMissingReservationIdResult();
  }

  const currentResult = await listLocalReservations();
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

  return replaceLocalReservations(nextReservations);
}

async function removeLocalReservation(reservationId) {
  if (!reservationId) {
    return createMissingReservationIdResult();
  }

  const currentResult = await listLocalReservations();
  const currentReservations = normalizeReservations(currentResult.data);
  const nextReservations = currentReservations.filter(
    (reservation) => reservation.id !== reservationId
  );

  return replaceLocalReservations(nextReservations);
}

async function clearLocalReservations() {
  const cleared = clearReservations();

  if (!cleared) {
    return createRepositoryResult({
      ok: false,
      data: [],
      error: new Error("예약 초기화에 실패했습니다.")
    });
  }

  return createRepositoryResult({ data: [] });
}

async function listApiReservations() {
  const result = await reservationApiClient.list();

  if (!result.ok) {
    return createRepositoryResult({
      ok: false,
      data: [],
      error: result.error
    });
  }

  return createRepositoryResult({
    data: normalizeApiReservations(result.data)
  });
}

async function addApiReservation(reservation = {}) {
  const result = await reservationApiClient.create(reservation);

  if (!result.ok) {
    return createRepositoryResult({
      ok: false,
      data: null,
      error: result.error
    });
  }

  const createdReservation = normalizeApiReservation(result.data);
  const listResult = await listApiReservations();

  if (listResult.ok && listResult.data.length > 0) {
    return listResult;
  }

  return createRepositoryResult({
    data: createdReservation ? [createdReservation] : []
  });
}

async function updateApiReservation(reservationId, patch = {}) {
  if (!reservationId) {
    return createMissingReservationIdResult();
  }

  const result = await reservationApiClient.update(reservationId, patch);

  if (!result.ok) {
    return createRepositoryResult({
      ok: false,
      data: null,
      error: result.error
    });
  }

  const listResult = await listApiReservations();

  if (listResult.ok) {
    return listResult;
  }

  const updatedReservation = normalizeApiReservation(result.data);

  return createRepositoryResult({
    data: updatedReservation ? [updatedReservation] : []
  });
}

async function removeApiReservation(reservationId) {
  if (!reservationId) {
    return createMissingReservationIdResult();
  }

  const result = await reservationApiClient.delete(reservationId);

  if (!result.ok) {
    return createRepositoryResult({
      ok: false,
      data: null,
      error: result.error
    });
  }

  const listResult = await listApiReservations();

  if (listResult.ok) {
    return listResult;
  }

  return createRepositoryResult({ data: [] });
}

export async function listReservations() {
  try {
    if (shouldUseReservationApi()) {
      return listApiReservations();
    }

    return listLocalReservations();
  } catch (error) {
    console.warn("Failed to list reservations", error);
    return createRepositoryResult({ ok: false, data: [], error });
  }
}

export async function replaceReservations(reservations = []) {
  try {
    if (shouldUseReservationApi()) {
      return createRepositoryResult({
        ok: false,
        data: normalizeReservations(reservations),
        error: new Error("API 모드에서는 예약 전체 교체를 지원하지 않습니다.")
      });
    }

    return replaceLocalReservations(reservations);
  } catch (error) {
    console.warn("Failed to replace reservations", error);
    return createRepositoryResult({ ok: false, data: [], error });
  }
}

export async function addReservation(reservation = {}) {
  try {
    if (shouldUseReservationApi()) {
      return addApiReservation(reservation);
    }

    return addLocalReservation(reservation);
  } catch (error) {
    console.warn("Failed to add reservation", error);
    return createRepositoryResult({ ok: false, data: null, error });
  }
}

export async function updateReservation(reservationId, patch = {}) {
  try {
    if (shouldUseReservationApi()) {
      return updateApiReservation(reservationId, patch);
    }

    return updateLocalReservation(reservationId, patch);
  } catch (error) {
    console.warn("Failed to update reservation", error);
    return createRepositoryResult({ ok: false, data: null, error });
  }
}

export async function removeReservation(reservationId) {
  try {
    if (shouldUseReservationApi()) {
      return removeApiReservation(reservationId);
    }

    return removeLocalReservation(reservationId);
  } catch (error) {
    console.warn("Failed to remove reservation", error);
    return createRepositoryResult({ ok: false, data: null, error });
  }
}

export async function clearReservationRepository() {
  try {
    if (shouldUseReservationApi()) {
      return createRepositoryResult({
        ok: false,
        data: [],
        error: new Error("API 모드에서는 예약 전체 초기화를 지원하지 않습니다.")
      });
    }

    return clearLocalReservations();
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
  remove: removeReservation,
  delete: removeReservation,
  clear: clearReservationRepository
};
