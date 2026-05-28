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

function isValidMobilePhone(phone = "") {
  return /^010\d{8}$/.test(phone);
}

function createVerificationCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sha256Hex(value: string) {
  const data = new TextEncoder().encode(value);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacSha256Hex(secret: string, message: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message)
  );

  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function sendSolapiSms({ to, code }: { to: string; code: string }) {
  const apiKey = Deno.env.get("SOLAPI_API_KEY") || "";
  const apiSecret = Deno.env.get("SOLAPI_API_SECRET") || "";
  const senderNumber = getPhoneDigits(Deno.env.get("SOLAPI_SENDER_NUMBER") || "");

  if (!apiKey || !apiSecret || !senderNumber) {
    return {
      ok: false,
      message: "SOLAPI 환경변수가 설정되지 않았습니다."
    };
  }

  const date = new Date().toISOString();
  const salt = crypto.randomUUID();
  const signature = await hmacSha256Hex(apiSecret, `${date}${salt}`);
  const authorization = `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`;

  const response = await fetch("https://api.solapi.com/messages/v4/send", {
    method: "POST",
    headers: {
      Authorization: authorization,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: {
        to,
        from: senderNumber,
        text: `[대전빵버스] 인증번호는 ${code} 입니다. 5분 안에 입력해주세요.`
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    console.error("SOLAPI send failed", response.status, errorText);
    return {
      ok: false,
      message: "인증번호 문자 발송에 실패했습니다."
    };
  }

  return {
    ok: true,
    message: "인증번호를 발송했습니다."
  };
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

    if (!isValidMobilePhone(phone)) {
      return jsonResponse({ ok: false, message: "올바른 휴대폰 번호를 입력해주세요." }, 400);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();

    const { data: recentRows, error: recentError } = await supabase
      .from("sms_verifications")
      .select("id")
      .eq("phone", phone)
      .gte("created_at", oneMinuteAgo)
      .limit(1);

    if (recentError) {
      console.error("Recent verification lookup failed", recentError);
      return jsonResponse({ ok: false, message: "인증 요청 확인에 실패했습니다." }, 500);
    }

    if (Array.isArray(recentRows) && recentRows.length > 0) {
      return jsonResponse({ ok: false, message: "인증번호는 1분 후 다시 요청할 수 있습니다." }, 429);
    }

    const code = createVerificationCode();
    const codeHash = await sha256Hex(`${phone}:${code}`);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    const sendResult = await sendSolapiSms({ to: phone, code });

    if (!sendResult.ok) {
      return jsonResponse(sendResult, 500);
    }

    const { error: insertError } = await supabase.from("sms_verifications").insert({
      phone,
      code: codeHash,
      purpose: "reservation",
      expires_at: expiresAt
    });

    if (insertError) {
      console.error("Verification insert failed", insertError);
      return jsonResponse({ ok: false, message: "인증번호 저장에 실패했습니다." }, 500);
    }

    return jsonResponse({ ok: true, message: "인증번호를 발송했습니다." });
  } catch (error) {
    console.error("request-sms-verification error", error);
    return jsonResponse({ ok: false, message: "인증번호 발송 중 오류가 발생했습니다." }, 500);
  }
});
