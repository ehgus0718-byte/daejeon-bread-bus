import { supabaseClient, hasSupabaseConfig } from "./supabaseClient.js";

function getPhoneDigits(value = "") {
  return String(value || "").replace(/\D/g, "");
}

export function isSmsVerificationEnabled() {
  return import.meta.env.VITE_ENABLE_SMS_VERIFICATION === "true";
}

export async function requestSmsVerification(phone = "") {
  if (!isSmsVerificationEnabled()) {
    return {
      ok: false,
      message: "휴대폰 인증 기능이 아직 활성화되지 않았습니다."
    };
  }

  if (!hasSupabaseConfig() || !supabaseClient) {
    return {
      ok: false,
      message: "인증 서버 설정을 찾지 못했습니다. 관리자에게 문의해주세요."
    };
  }

  const phoneDigits = getPhoneDigits(phone);

  const { data, error } = await supabaseClient.functions.invoke(
    "request-sms-verification",
    {
      body: { phone: phoneDigits }
    }
  );

  if (error) {
    return {
      ok: false,
      message: error.message || "인증번호 발송에 실패했습니다."
    };
  }

  return {
    ok: Boolean(data?.ok),
    message: data?.message || "인증번호를 발송했습니다."
  };
}

export async function verifySmsCode({ phone = "", code = "" }) {
  if (!isSmsVerificationEnabled()) {
    return {
      ok: false,
      message: "휴대폰 인증 기능이 아직 활성화되지 않았습니다."
    };
  }

  if (!hasSupabaseConfig() || !supabaseClient) {
    return {
      ok: false,
      message: "인증 서버 설정을 찾지 못했습니다. 관리자에게 문의해주세요."
    };
  }

  const phoneDigits = getPhoneDigits(phone);
  const safeCode = String(code || "").replace(/\D/g, "").slice(0, 6);

  const { data, error } = await supabaseClient.functions.invoke("verify-sms-code", {
    body: { phone: phoneDigits, code: safeCode }
  });

  if (error) {
    return {
      ok: false,
      message: error.message || "인증번호 확인에 실패했습니다."
    };
  }

  return {
    ok: Boolean(data?.ok),
    message: data?.message || "휴대폰 인증이 완료되었습니다."
  };
}
