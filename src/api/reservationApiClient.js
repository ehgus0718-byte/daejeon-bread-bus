const DEFAULT_API_BASE_URL = "";

function getApiBaseUrl() {
  return import.meta?.env?.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;
}

function createApiResult({ ok = true, data = null, error = null, status = 200 } = {}) {
  return {
    ok,
    data,
    error,
    status
  };
}

function normalizeApiBaseUrl(baseUrl) {
  return String(baseUrl || "").trim().replace(/\/+$/, "");
}

function normalizeApiPath(path) {
  const safePath = String(path || "").trim();

  if (!safePath) {
    return "";
  }

  return safePath.startsWith("/") ? safePath : `/${safePath}`;
}

function buildReservationApiUrl(path) {
  const baseUrl = normalizeApiBaseUrl(getApiBaseUrl());

  if (!baseUrl) {
    return "";
  }

  return `${baseUrl}${normalizeApiPath(path)}`;
}

async function parseJsonResponse(response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    console.warn("Failed to parse reservation API response", error);
    return null;
  }
}

async function requestReservationApi(path, options = {}) {
  const requestUrl = buildReservationApiUrl(path);

  if (!requestUrl) {
    return createApiResult({
      ok: false,
      status: 0,
      error: new Error("예약 API 주소가 설정되지 않았습니다.")
    });
  }

  try {
    const response = await fetch(requestUrl, {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      },
      ...options
    });
    const data = await parseJsonResponse(response);

    if (!response.ok) {
      return createApiResult({
        ok: false,
        data,
        status: response.status,
        error: new Error(data?.message || "예약 API 요청에 실패했습니다.")
      });
    }

    return createApiResult({
      data,
      status: response.status
    });
  } catch (error) {
    console.warn("Reservation API request failed", error);
    return createApiResult({
      ok: false,
      status: 0,
      error
    });
  }
}

export function fetchReservations() {
  return requestReservationApi("/reservations");
}

export function createReservation(reservation = {}) {
  return requestReservationApi("/reservations", {
    method: "POST",
    body: JSON.stringify(reservation)
  });
}

export function patchReservation(reservationId, patch = {}) {
  return requestReservationApi(`/reservations/${reservationId}`, {
    method: "PATCH",
    body: JSON.stringify(patch)
  });
}

export function deleteReservation(reservationId) {
  return requestReservationApi(`/reservations/${reservationId}`, {
    method: "DELETE"
  });
}

export const reservationApiClient = {
  list: fetchReservations,
  create: createReservation,
  update: patchReservation,
  delete: deleteReservation
};
