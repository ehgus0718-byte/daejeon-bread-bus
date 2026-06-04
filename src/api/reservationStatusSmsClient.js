import { supabaseClient } from "./supabaseClient.js";

const SMS_TARGET_STATUSES = new Set(["예약접수", "결제완료", "예약확정", "예약취소"]);

function createResult({ ok = true, data = null, error = null, skipped = false } = {}) {
  return { ok, data, error, skipped };
}

function getReservationId(reservation = {}) {
  return reservation?.id || reservation?.reservationId || null;
}

function getReservationDate(reservation = {}) {
  return reservation?.date || reservation?.selectedDate || reservation?.reservationDate || "";
}

function getReservationPeople(reservation = {}) {
  const explicitPeople = Number(reservation?.people);
  if (Number.isFinite(explicitPeople) && explicitPeople > 0) return explicitPeople;

  const adultCount = Number(reservation?.adultCount || 0);
  const childCount = Number(reservation?.childCount || 0);
  const infantCount = Number(reservation?.infantCount || 0);
  const totalPeople = adultCount + childCount + infantCount;

  return Number.isFinite(totalPeople) && totalPeople > 0 ? totalPeople : 0;
}

function normalizePhone(value = "") {
  return String(value || "").replace(/\D/g, "");
}

export function shouldSendReservationStatusSms(status = "") {
  return SMS_TARGET_STATUSES.has(String(status || "").trim());
}

export async function sendReservationStatusSms({ reservation = {}, status = "" } = {}) {
  const nextStatus = String(status || reservation?.status || "").trim();

  if (!shouldSendReservationStatusSms(nextStatus)) {
    return createResult({ skipped: true, data: { reason: "unsupported_status" } });
  }

  if (!supabaseClient) {
    return createResult({
      ok: false,
      error: new Error("Supabase 설정을 찾지 못해 문자를 발송하지 못했습니다.")
    });
  }

  const reservationId = getReservationId(reservation);
  const name = reservation?.name || reservation?.customerName || reservation?.reservationName || "";
  const phone = normalizePhone(reservation?.phone || reservation?.contact || reservation?.mobile || "");
  const date = getReservationDate(reservation);
  const people = getReservationPeople(reservation);
  const amount = Number(reservation?.totalAmount || reservation?.amount || reservation?.price || 0) || 0;
  const normalizedReservation = {
    ...reservation,
    id: reservationId,
    reservationId,
    name,
    phone,
    date,
    selectedDate: date,
    people,
    status: nextStatus,
    totalAmount: amount
  };

  const payload = {
    reservationId,
    id: reservationId,
    name,
    phone,
    contact: phone,
    mobile: phone,
    date,
    selectedDate: date,
    reservationDate: date,
    people,
    status: nextStatus,
    totalAmount: amount,
    amount,
    reservation: normalizedReservation
  };

  const { data, error } = await supabaseClient.functions.invoke(
    "send-reservation-status-sms",
    { body: payload }
  );

  if (error) {
    console.warn("Reservation status SMS failed", error);
    return createResult({ ok: false, error });
  }

  return createResult({ data });
}
