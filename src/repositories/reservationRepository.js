import {
  reservationApiClient,
  supabaseReservationClient
} from "../api/index.js";
import {
  clearReservations,
  loadReservations,
  saveReservations
} from "../services/storageIndex.js";
import {
  shouldUseReservationApi,
  shouldUseSupabaseReservations
} from "./reservationRepositoryMode.js";

function createRepositoryResult({ ok = true, data = null, error = null } = {}) {
  return { ok, data, error };
}

function normalizeReservations(reservations = []) {
  return Array.isArray(reservations) ? reservations : [];
}

function normalizeRemoteReservations(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.reservations)) return data.reservations;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function normalizeRemoteReservation(data) {
  if (!data) return null;
  if (data.reservation) return data.reservation;
  if (data.data && !Array.isArray(data.data)) return data.data;
  return data;
}

function getReservationId(reservation = {}) {
  return reservation?.id || reservation?.reservationId || null;
}

function mergeCreatedReservation({ reservations = [], createdReservation = null }) {
  const safeReservations = normalizeReservations(reservations);
  const createdId = getReservationId(createdReservation);

  if (!createdReservation || !createdId) return safeReservations;

  const alreadyIncluded = safeReservations.some(
    (reservation) => getReservationId(reservation) === createdId
  );

  return alreadyIncluded ? safeReservations : [createdReservation, ...safeReservations];
}

function createMissingReservationIdResult() {
  return createRepositoryResult({
    ok: false,
    data: null,
    error: new Error("예약 ID가 없습니다.")
  });
}

function getRemoteClient() {
  if (shouldUseSupabaseReservations()) return supabaseReservationClient;
  if (shouldUseReservationApi()) return reservationApiClient;
  return null;
}

function getRemoteModeName() {
  return shouldUseSupabaseReservations() ? "Supabase" : "API";
}

async function listLocalReservations() {
  return createRepositoryResult({ data: normalizeReservations(loadReservations()) });
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
  return replaceLocalReservations([
    reservation,
    ...normalizeReservations(currentResult.data)
  ]);
}

async function updateLocalReservation(reservationId, patch = {}) {
  if (!reservationId) return createMissingReservationIdResult();

  const currentResult = await listLocalReservations();
  const nextReservations = normalizeReservations(currentResult.data).map((reservation) =>
    reservation.id === reservationId
      ? { ...reservation, ...patch, id: reservation.id }
      : reservation
  );

  return replaceLocalReservations(nextReservations);
}

async function removeLocalReservation(reservationId) {
  if (!reservationId) return createMissingReservationIdResult();

  const currentResult = await listLocalReservations();
  const nextReservations = normalizeReservations(currentResult.data).filter(
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

async function listRemoteReservations(client) {
  const result = await client.list();

  if (!result.ok) {
    return createRepositoryResult({ ok: false, data: [], error: result.error });
  }

  return createRepositoryResult({ data: normalizeRemoteReservations(result.data) });
}

async function addRemoteReservation(client, reservation = {}) {
  const result = await client.create(reservation);

  if (!result.ok) {
    return createRepositoryResult({ ok: false, data: null, error: result.error });
  }

  const createdReservation = normalizeRemoteReservation(result.data) || reservation;
  const listResult = await listRemoteReservations(client);

  if (listResult.ok) {
    return createRepositoryResult({
      data: mergeCreatedReservation({
        reservations: listResult.data,
        createdReservation
      })
    });
  }

  return createRepositoryResult({ data: createdReservation ? [createdReservation] : [] });
}

async function updateRemoteReservation(client, reservationId, patch = {}) {
  if (!reservationId) return createMissingReservationIdResult();

  const result = await client.update(reservationId, patch);

  if (!result.ok) {
    return createRepositoryResult({ ok: false, data: null, error: result.error });
  }

  const listResult = await listRemoteReservations(client);
  if (listResult.ok) return listResult;

  const updatedReservation = normalizeRemoteReservation(result.data);
  return createRepositoryResult({ data: updatedReservation ? [updatedReservation] : [] });
}

async function removeRemoteReservation(client, reservationId) {
  if (!reservationId) return createMissingReservationIdResult();

  const result = await client.delete(reservationId);

  if (!result.ok) {
    return createRepositoryResult({ ok: false, data: null, error: result.error });
  }

  const listResult = await listRemoteReservations(client);
  if (listResult.ok) return listResult;

  return createRepositoryResult({ data: [] });
}

export async function listReservations() {
  try {
    const remoteClient = getRemoteClient();
    if (remoteClient) return listRemoteReservations(remoteClient);
    return listLocalReservations();
  } catch (error) {
    console.warn("Failed to list reservations", error);
    return createRepositoryResult({ ok: false, data: [], error });
  }
}

export async function replaceReservations(reservations = []) {
  try {
    if (getRemoteClient()) {
      return createRepositoryResult({
        ok: false,
        data: normalizeReservations(reservations),
        error: new Error(`${getRemoteModeName()} 모드에서는 예약 전체 교체를 지원하지 않습니다.`)
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
    const remoteClient = getRemoteClient();
    if (remoteClient) return addRemoteReservation(remoteClient, reservation);
    return addLocalReservation(reservation);
  } catch (error) {
    console.warn("Failed to add reservation", error);
    return createRepositoryResult({ ok: false, data: null, error });
  }
}

export async function updateReservation(reservationId, patch = {}) {
  try {
    const remoteClient = getRemoteClient();
    if (remoteClient) return updateRemoteReservation(remoteClient, reservationId, patch);
    return updateLocalReservation(reservationId, patch);
  } catch (error) {
    console.warn("Failed to update reservation", error);
    return createRepositoryResult({ ok: false, data: null, error });
  }
}

export async function removeReservation(reservationId) {
  try {
    const remoteClient = getRemoteClient();
    if (remoteClient) return removeRemoteReservation(remoteClient, reservationId);
    return removeLocalReservation(reservationId);
  } catch (error) {
    console.warn("Failed to remove reservation", error);
    return createRepositoryResult({ ok: false, data: null, error });
  }
}

export async function clearReservationRepository() {
  try {
    if (getRemoteClient()) {
      return createRepositoryResult({
        ok: false,
        data: [],
        error: new Error(`${getRemoteModeName()} 모드에서는 예약 전체 초기화를 지원하지 않습니다.`)
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
