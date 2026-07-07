const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

function getPhoneDigits(value = "") {
  return String(value || "").replace(/\D/g, "");
}

function getStatusMessage(status = "", payload: Record<string, unknown> = {}) {
  const name = String(payload.name || "").trim();
  const date = String(payload.date || "").trim();
  const boardingTime = String(payload.boardingTime || "10:00").trim() || "10:00";

  const prefix = "[대전빵버스]";
  const nameLine = name ? `예약자: ${name}` : "";
  const dateLine = date ? `투어일: ${date}` : "";
  const boardingLine = `탑승: 대전역 동광장 ${boardingTime}`;
  const contactLine = "문의: 010-4560-6701";

  // 관리자 알림 - 신규 예약 접수 시
  if (status === "예약접수") {
    return [
      prefix,
      "신규 예약이 접수되었습니다.",
      "",
      nameLine,
      dateLine,
      "",
      contactLine
    ].filter((line) => line !== "").join("\n");
  }

  // 고객 알림 - 카드 결제 완료 즉시 확정
  if (status === "결제완료") {
    return [
      prefix,
      "예약이 확정되었습니다!",
      "",
      nameLine,
      dateLine,
      boardingLine,
      "",
      "즐거운 빵 여행 되세요 :)",
      contactLine
    ].filter((line) => line !== "").join("\n");
  }

  if (status === "예약확정") {
    return [
      prefix,
      "예약이 확정되었습니다!",
      "",
      nameLine,
      dateLine,
      boardingLine,
      "",
      "즐거운 빵 여행 되세요 :)",
      contactLine
    ].filter((line) => line !== "").join("\n");
  }

  if (status === "예약취소" || status === "취소") {
    return [
      prefix,
      "예약이 취소 처리되었습니다.",
      "",
      nameLine,
      dateLine,
      "",
      "문의사항은 고객센터로 연락해주세요.",
      contactLine
    ].filter((line) => line !== "").join("\n");
  }

  return "";
}

async function sendSolapiSms({ to, text }: { to: string; text: string }) {
  const apiKey = Deno.env.get("SOLAPI_API_KEY") || "";
  const apiSecret = Deno.env.get("SOLAPI_API_SECRET") || "";
  const sender = Deno.env.get("SOLAPI_SENDER_NUMBER") || Deno.env.get("SOLAPI_SENDER") || "";

  if (!apiKey || !apiSecret || !sender) throw new Error("SOLAPI 설정이 없습니다.");

  const date = new Date().toISOString();
  const salt = crypto.randomUUID().replace(/-/g, "");
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(apiSecret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(date + salt));
  const signature = Array.from(new Uint8Array(signatureBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");

  const response = await fetch("https://api.solapi.com/messages/v4/send", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}` },
    body: JSON.stringify({ message: { to, from: sender, text } })
  });

  const responseText = await response.text();
  if (!response.ok) { console.error("SOLAPI status sms failed", response.status, responseText); throw new Error(`SOLAPI 발송 실패: ${response.status}`); }
  return responseText;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ ok: false, message: "지원하지 않는 요청입니다." }, 405);

  try {
    const body = await request.json().catch(() => ({}));
    const phone = getPhoneDigits(body.phone || "");
    const status = String(body.status || "").trim();

    if (!/^010\d{8}$/.test(phone)) return jsonResponse({ ok: false, message: "올바른 휴대폰 번호가 아닙니다." }, 400);

    const text = getStatusMessage(status, body);
    if (!text) return jsonResponse({ ok: true, skipped: true, message: "문자 발송 대상 상태가 아닙니다." });

    const solapiResponse = await sendSolapiSms({ to: phone, text });
    return jsonResponse({ ok: true, message: "상태 안내 문자를 발송했습니다.", solapiResponse });
  } catch (error) {
    console.error("send-reservation-status-sms error", error);
    return jsonResponse({ ok: false, message: "상태 안내 문자 발송 중 오류가 발생했습니다.", debug: error instanceof Error ? error.message : String(error) }, 500);
  }
});
