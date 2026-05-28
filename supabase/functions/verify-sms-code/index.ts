import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
}

function getPhoneDigits(value = "") {
  return String(value || "").replace(/\D/g, "");
}

function getCodeDigits(value = "") {
  return String(value || "").replace(/\D/g, "").slice(0, 6);
}

async function sha256Hex(value: string) {
  const data = new TextEncoder().encode(value);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ ok: false, message: "지원하지 않는 요청입니다." }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse({ ok: false, message: "Supabase 서버 설정이 없습니다." }, 500);
    }

    const body = await request.json().catch(() => ({}));
    const phone = getPhoneDigits(body.phone || "");
    const code = getCodeDigits(body.code || "");

    if (!/^010\d{8}$/.test(phone)) {
      return jsonResponse({ ok: false, message: "올바른 휴대폰 번호를 입력해주세요." }, 400);
    }

    if (!/^\d{6}$/.test(code)) {
      return jsonResponse({ ok: false, message: "인증번호 6자리를 입력해주세요." }, 400);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const now = new Date().toISOString();

    const { data: rows, error: lookupError } = await supabase
      .from("sms_verifications")
      .select("id, code, attempts, expires_at, verified")
      .eq("phone", phone)
      .eq("purpose", "reservation")
      .eq("verified", false)
      .gt("expires_at", now)
      .order("created_at", { ascending: false })
      .limit(1);

    if (lookupError) {
      console.error("Verification lookup failed", lookupError);
      return jsonResponse({ ok: false, message: "인증번호 확인에 실패했습니다." }, 500);
    }

    const target = Array.isArray(rows) ? rows[0] : null;

    if (!target) {
      return jsonResponse({ ok: false, message: "유효한 인증번호가 없습니다. 다시 발송해주세요." }, 400);
    }

    if (Number(target.attempts || 0) >= 5) {
      return jsonResponse({ ok: false, message: "인증 시도 횟수를 초과했습니다. 다시 발송해주세요." }, 429);
    }

    const inputHash = await sha256Hex(`${phone}:${code}`);

    if (inputHash !== target.code) {
      await supabase
        .from("sms_verifications")
        .update({ attempts: Number(target.attempts || 0) + 1 })
        .eq("id", target.id);

      return jsonResponse({ ok: false, message: "인증번호가 일치하지 않습니다." }, 400);
    }

    const { error: updateError } = await supabase
      .from("sms_verifications")
      .update({
        verified: true,
        verified_at: new Date().toISOString()
      })
      .eq("id", target.id);

    if (updateError) {
      console.error("Verification update failed", updateError);
      return jsonResponse({ ok: false, message: "인증 상태 저장에 실패했습니다." }, 500);
    }

    return jsonResponse({ ok: true, message: "휴대폰 인증이 완료되었습니다." });
  } catch (error) {
    console.error("verify-sms-code error", error);
    return jsonResponse({ ok: false, message: "인증번호 확인 중 오류가 발생했습니다." }, 500);
  }
});
