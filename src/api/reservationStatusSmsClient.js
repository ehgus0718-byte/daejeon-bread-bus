import { supabaseClient } from "./supabaseClient.js";

const SMS_TARGET_STATUSES = new Set(["결제완료", "예약확정", "예약취소"]);

function createResult({ ok = true, data = null, error = null, skipped = false } = {}) {
  return { ok, data, error, skipped };
}

function getReservationId(reservation = {}) {
  return reservation?.id || reservation?.reservationId || null;
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
  const payload = {
    reservationId,
    status: nextStatus,
    reservation: {
      ...reservation,
      id: reservationId,
      status: nextStatus
    }
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
