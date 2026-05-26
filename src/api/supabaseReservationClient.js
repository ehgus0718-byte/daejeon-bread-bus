import {
  getSupabaseConfigStatus,
  hasSupabaseConfig,
  supabaseClient
} from "./supabaseClient.js";

const DEFAULT_RESERVATIONS_TABLE = "reservations";
const RESERVATION_SELECT_COLUMNS =
  "id,reservation_date,name,phone,people,amount,status,admin_note";

function getReservationsTableName() {
  return (
    import.meta?.env?.VITE_SUPABASE_RESERVATIONS_TABLE ||
    DEFAULT_RESERVATIONS_TABLE
  );
}

function createSupabaseResult({ ok = true, data = null, error = null, status = 200 } = {}) {
  return { ok, data, error, status };
}

function createMissingConfigResult() {
  const configStatus = getSupabaseConfigStatus();

  return createSupabaseResult({
    ok: false,
    data: null,
    status: 0,
    error: new Error(
      `Supabase 설정이 완료되지 않았습니다. URL: ${configStatus.hasUrl ? "OK" : "MISSING"}, ANON KEY: ${configStatus.hasAnonKey ? "OK" : "MISSING"}`
    )
  });
}

function getReservationId(reservation = {}) {
  return reservation.id || reservation.reservationId || null;
}

function getReservationDate(reservation = {}) {
  return (
    reservation.date ||
    reservation.selectedDate ||
    reservation.reservationDate ||
    reservation.visitDate ||
    null
  );
}

function normalizeReservationPayload(row) {
  if (!row) return null;

  return {
    id: row.id,
    date: row.reservation_date,
    name: row.name || "",
    phone: row.phone || "",
    people: Number(row.people || 1),
    amount: Number(row.amount || 0),
    status: row.status || "결제대기",
    adminNote: row.admin_note || "",
    createdAt: row.created_at || ""
  };
}

function normalizeReservationList(rows = []) {
  return Array.isArray(rows)
    ? rows.map(normalizeReservationPayload).filter(Boolean)
    : [];
}

function buildReservationRow(reservation = {}) {
  const reservationId = getReservationId(reservation);

  return {
    ...(reservationId ? { id: reservationId } : {}),
    reservation_date: getReservationDate(reservation),
    name: reservation.name || "",
    phone: reservation.phone || "",
    people: Number(reservation.people || 1),
    amount: Number(reservation.amount || 0),
    status: reservation.status || "결제대기",
    admin_note: reservation.adminNote || reservation.admin_note || ""
  };
}

function buildReservationPatch(patch = {}) {
  const nextPatch = {};

  if (Object.prototype.hasOwnProperty.call(patch, "date")) {
    nextPatch.reservation_date = patch.date;
  }

  if (Object.prototype.hasOwnProperty.call(patch, "reservation_date")) {
    nextPatch.reservation_date = patch.reservation_date;
  }

  if (Object.prototype.hasOwnProperty.call(patch, "name")) {
    nextPatch.name = patch.name || "";
  }

  if (Object.prototype.hasOwnProperty.call(patch, "phone")) {
    nextPatch.phone = patch.phone || "";
  }

  if (Object.prototype.hasOwnProperty.call(patch, "people")) {
    nextPatch.people = Number(patch.people || 1);
  }

  if (Object.prototype.hasOwnProperty.call(patch, "amount")) {
    nextPatch.amount = Number(patch.amount || 0);
  }

  if (Object.prototype.hasOwnProperty.call(patch, "status")) {
    nextPatch.status = patch.status || "결제대기";
  }

  if (Object.prototype.hasOwnProperty.call(patch, "adminNote")) {
    nextPatch.admin_note = patch.adminNote || "";
  }

  if (Object.prototype.hasOwnProperty.call(patch, "admin_note")) {
    nextPatch.admin_note = patch.admin_note || "";
  }

  return nextPatch;
}

function ensureSupabaseClient() {
  if (!hasSupabaseConfig() || !supabaseClient) {
    return createMissingConfigResult();
  }

  return null;
}

export async function fetchSupabaseReservations() {
  const configError = ensureSupabaseClient();
  if (configError) return configError;

  const { data, error, status } = await supabaseClient
    .from(getReservationsTableName())
    .select(RESERVATION_SELECT_COLUMNS)
    .order("reservation_date", { ascending: false });

  if (error) {
    return createSupabaseResult({ ok: false, data: [], error, status });
  }

  return createSupabaseResult({ data: normalizeReservationList(data), status });
}

export async function createSupabaseReservation(reservation = {}) {
  const configError = ensureSupabaseClient();
  if (configError) return configError;

  const { data, error, status } = await supabaseClient
    .from(getReservationsTableName())
    .insert(buildReservationRow(reservation))
    .select(RESERVATION_SELECT_COLUMNS)
    .single();

  if (error) {
    return createSupabaseResult({ ok: false, data: null, error, status });
  }

  return createSupabaseResult({ data: normalizeReservationPayload(data), status });
}

export async function patchSupabaseReservation(reservationId, patch = {}) {
  const configError = ensureSupabaseClient();
  if (configError) return configError;

  if (!reservationId) {
    return createSupabaseResult({
      ok: false,
      data: null,
      status: 0,
      error: new Error("예약 ID가 없습니다.")
    });
  }

  const nextPatch = buildReservationPatch(patch);

  if (Object.keys(nextPatch).length === 0) {
    return createSupabaseResult({ data: null, status: 200 });
  }

  const { data, error, status } = await supabaseClient
    .from(getReservationsTableName())
    .update(nextPatch)
    .eq("id", reservationId)
    .select(RESERVATION_SELECT_COLUMNS)
    .single();

  if (error) {
    return createSupabaseResult({ ok: false, data: null, error, status });
  }

  return createSupabaseResult({ data: normalizeReservationPayload(data), status });
}

export async function deleteSupabaseReservation(reservationId) {
  const configError = ensureSupabaseClient();
  if (configError) return configError;

  if (!reservationId) {
    return createSupabaseResult({
      ok: false,
      data: null,
      status: 0,
      error: new Error("예약 ID가 없습니다.")
    });
  }

  const { error, status } = await supabaseClient
    .from(getReservationsTableName())
    .delete()
    .eq("id", reservationId);

  if (error) {
    return createSupabaseResult({ ok: false, data: null, error, status });
  }

  return createSupabaseResult({ data: null, status });
}

export const supabaseReservationClient = {
  list: fetchSupabaseReservations,
  create: createSupabaseReservation,
  update: patchSupabaseReservation,
  delete: deleteSupabaseReservation
};
