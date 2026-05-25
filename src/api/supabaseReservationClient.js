import {
  getSupabaseConfigStatus,
  hasSupabaseConfig,
  supabaseClient
} from "./supabaseClient.js";

const DEFAULT_RESERVATIONS_TABLE = "reservations";

function getReservationsTableName() {
  return (
    import.meta?.env?.VITE_SUPABASE_RESERVATIONS_TABLE ||
    DEFAULT_RESERVATIONS_TABLE
  );
}

function createSupabaseResult({ ok = true, data = null, error = null, status = 200 } = {}) {
  return {
    ok,
    data,
    error,
    status
  };
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
  if (!row) {
    return null;
  }

  const payload =
    row.payload && typeof row.payload === "object" ? row.payload : row;

  return {
    ...payload,
    id: payload.id || row.id,
    status: payload.status || row.status,
    date: payload.date || row.reservation_date || payload.selectedDate
  };
}

function normalizeReservationList(rows = []) {
  return Array.isArray(rows)
    ? rows.map(normalizeReservationPayload).filter(Boolean)
    : [];
}

function buildReservationRow(reservation = {}) {
  const id = getReservationId(reservation);
  const status = reservation.status || "결제대기";
  const reservationDate = getReservationDate(reservation);

  return {
    ...(id ? { id } : {}),
    reservation_date: reservationDate,
    status,
    payload: {
      ...reservation,
      ...(id ? { id } : {}),
      status,
      ...(reservationDate ? { date: reservationDate } : {})
    }
  };
}

function ensureSupabaseClient() {
  if (!hasSupabaseConfig() || !supabaseClient) {
    return createMissingConfigResult();
  }

  return null;
}

export async function fetchSupabaseReservations() {
  const configError = ensureSupabaseClient();

  if (configError) {
    return configError;
  }

  const { data, error, status } = await supabaseClient
    .from(getReservationsTableName())
    .select("id,reservation_date,status,payload,created_at,updated_at")
    .order("created_at", { ascending: false });

  if (error) {
    return createSupabaseResult({
      ok: false,
      data: [],
      error,
      status
    });
  }

  return createSupabaseResult({
    data: normalizeReservationList(data),
    status
  });
}

export async function createSupabaseReservation(reservation = {}) {
  const configError = ensureSupabaseClient();

  if (configError) {
    return configError;
  }

  const row = buildReservationRow(reservation);
  const { data, error, status } = await supabaseClient
    .from(getReservationsTableName())
    .insert(row)
    .select("id,reservation_date,status,payload,created_at,updated_at")
    .single();

  if (error) {
    return createSupabaseResult({
      ok: false,
      data: null,
      error,
      status
    });
  }

  return createSupabaseResult({
    data: normalizeReservationPayload(data),
    status
  });
}

export async function patchSupabaseReservation(reservationId, patch = {}) {
  const configError = ensureSupabaseClient();

  if (configError) {
    return configError;
  }

  if (!reservationId) {
    return createSupabaseResult({
      ok: false,
      data: null,
      status: 0,
      error: new Error("예약 ID가 없습니다.")
    });
  }

  const { data: currentRow, error: currentError, status: currentStatus } =
    await supabaseClient
      .from(getReservationsTableName())
      .select("id,reservation_date,status,payload,created_at,updated_at")
      .eq("id", reservationId)
      .single();

  if (currentError) {
    return createSupabaseResult({
      ok: false,
      data: null,
      error: currentError,
      status: currentStatus
    });
  }

  const currentReservation = normalizeReservationPayload(currentRow) || {};
  const nextReservation = {
    ...currentReservation,
    ...patch,
    id: reservationId
  };
  const nextRow = buildReservationRow(nextReservation);

  const { data, error, status } = await supabaseClient
    .from(getReservationsTableName())
    .update(nextRow)
    .eq("id", reservationId)
    .select("id,reservation_date,status,payload,created_at,updated_at")
    .single();

  if (error) {
    return createSupabaseResult({
      ok: false,
      data: null,
      error,
      status
    });
  }

  return createSupabaseResult({
    data: normalizeReservationPayload(data),
    status
  });
}

export async function deleteSupabaseReservation(reservationId) {
  const configError = ensureSupabaseClient();

  if (configError) {
    return configError;
  }

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
    return createSupabaseResult({
      ok: false,
      data: null,
      error,
      status
    });
  }

  return createSupabaseResult({
    data: null,
    status
  });
}

export const supabaseReservationClient = {
  list: fetchSupabaseReservations,
  create: createSupabaseReservation,
  update: patchSupabaseReservation,
  delete: deleteSupabaseReservation
};
