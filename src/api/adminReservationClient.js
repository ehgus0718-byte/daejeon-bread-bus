import { supabaseClient } from "./supabaseClient.js";

const ADMIN_FUNCTION_NAME = "admin-reservations";

function createAdminResult({ ok = true, data = null, error = null } = {}) {
  return { ok, data, error };
}

function getErrorFromInvoke(error, data) {
  if (error) return error;
  if (!data || data.ok !== true) {
    return new Error(data && data.message ? data.message : "관리자 요청에 실패했습니다.");
  }
  return null;
}

async function invokeAdminFunction(accessCode, payload = {}) {
  if (!supabaseClient) {
    return createAdminResult({
      ok: false,
      error: new Error("Supabase 설정이 완료되지 않았습니다.")
    });
  }

  if (!accessCode) {
    return createAdminResult({
      ok: false,
      error: new Error("관리자 인증 코드가 없습니다.")
    });
  }

  const { data, error } = await supabaseClient.functions.invoke(ADMIN_FUNCTION_NAME, {
    body: { accessCode, ...payload }
  });

  const resolvedError = getErrorFromInvoke(error, data);

  if (resolvedError) {
    return createAdminResult({ ok: false, data: data || null, error: resolvedError });
  }

  return createAdminResult({ ok: true, data });
}

export async function verifyAdminAccess(accessCode) {
  const result = await invokeAdminFunction(accessCode, { action: "list", limit: 1 });
  return result.ok ? createAdminResult({ ok: true }) : result;
}

export async function listAdminReservations(accessCode, options = {}) {
  const limit = Number(options.limit || 0);
  const result = await invokeAdminFunction(accessCode, { action: "list", limit });

  if (!result.ok) {
    return createAdminResult({ ok: false, data: [], error: result.error });
  }

  const reservations = Array.isArray(result.data.reservations)
    ? result.data.reservations
    : [];

  return createAdminResult({ ok: true, data: reservations });
}

export async function updateAdminReservation(accessCode, reservationId, patch = {}) {
  if (!reservationId) {
    return createAdminResult({ ok: false, data: [], error: new Error("예약 ID가 없습니다.") });
  }

  const payload = { action: "update", id: reservationId };

  if (Object.prototype.hasOwnProperty.call(patch, "status")) {
    payload.status = patch.status;
  }

  if (Object.prototype.hasOwnProperty.call(patch, "adminNote")) {
    payload.adminNote = patch.adminNote;
  }

  const result = await invokeAdminFunction(accessCode, payload);

  if (!result.ok) {
    return createAdminResult({ ok: false, data: [], error: result.error });
  }

  const updated = result.data.reservation;
  return createAdminResult({ ok: true, data: updated ? [updated] : [] });
}

export async function removeAdminReservation(accessCode, reservationId) {
  if (!reservationId) {
    return createAdminResult({ ok: false, data: [], error: new Error("예약 ID가 없습니다.") });
  }

  const result = await invokeAdminFunction(accessCode, { action: "remove", id: reservationId });

  if (!result.ok) {
    return createAdminResult({ ok: false, data: [], error: result.error });
  }

  return createAdminResult({ ok: true, data: [] });
}

export const adminReservationClient = {
  verify: verifyAdminAccess,
  list: listAdminReservations,
  update: updateAdminReservation,
  remove: removeAdminReservation
};
