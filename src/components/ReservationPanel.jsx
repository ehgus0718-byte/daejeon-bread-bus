import React, { useEffect, useRef, useState } from "react";
import { formatCurrency, formatSeatCount } from "../core/formatters.js";
import SectionTitle from "./SectionTitle.jsx";
import {
  isSmsVerificationEnabled,
  requestSmsVerification,
  verifySmsCode
} from "../api/smsVerificationClient.js";

const SMS_VERIFICATION_ENABLED = isSmsVerificationEnabled();

const SUPABASE_URL = "https://mnwimnwdilerkktizzqn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ud2ltbndkaWxlcmtrdGl6enFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxNzM2MjMsImV4cCI6MjA2Mzc0OTYyM30.pFCnb6G3BuFiQ72H-eCbMaEJFVy0KJHD-IFsTqCqGgg";
const NICEPAY_SIGN_URL    = `${SUPABASE_URL}/functions/v1/nicepay-sign`;
const NICEPAY_APPROVE_URL = `${SUPABASE_URL}/functions/v1/nicepay-approve`;
const NICEPAY_RETURN_URL  = `${SUPABASE_URL}/functions/v1/nicepay-return`;
const RESERVATIONS_URL    = `${SUPABASE_URL}/rest/v1/reservations`;

const STATUS_PENDING = encodeURIComponent("결제대기");

function toSafeNumber(value, fallbackValue = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallbackValue;
}
function toCount(value, fallbackValue = 0) {
  return Math.max(0, Math.floor(toSafeNumber(value, fallbackValue)));
}
function getPhoneDigits(value = "") {
  return String(value || "").replace(/\D/g, "");
}

function loadNicepayScript() {
  return new Promise((resolve, reject) => {
    if (document.getElementById("nicepay-script")) { resolve(); return; }
    const s = document.createElement("script");
    s.id = "nicepay-script";
    s.src = "https://pg-web.nicepay.co.kr/v3/common/js/nicepay-pgweb.js";
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

function isMobileDevice() {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

function safeRemoveChild(parent, child) {
  try {
    if (parent && child && parent.contains(child)) parent.removeChild(child);
  } catch {}
}

async function createPendingReservation({ reservationDate, name, phone, people, amount }) {
  if (!reservationDate || !name || people < 1) return null;

  const DB_HEADERS = {
    "Content-Type": "application/json",
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
  };

  try {
    const insertResp = await fetch(RESERVATIONS_URL, {
      method: "POST",
      headers: { ...DB_HEADERS, "Prefer": "return=minimal" },
      body: JSON.stringify({
        reservation_date: reservationDate,
        name: name || "고객",
        phone: phone || "",
        people: people || 1,
        amount: amount || 0,
        status: "결제대기",
      }),
    });

    if (!insertResp.ok) {
      const errText = await insertResp.text().catch(() => "");
      console.warn("pending INSERT 실패:", insertResp.status, errText);
      return null;
    }

    const safePhone = encodeURIComponent(phone || "");
    const selectResp = await fetch(
      `${RESERVATIONS_URL}?reservation_date=eq.${reservationDate}&phone=eq.${safePhone}&status=eq.${STATUS_PENDING}&order=created_at.desc&limit=1&select=id`,
      { headers: DB_HEADERS }
    );

    if (!selectResp.ok) return null;

    const rows = await selectResp.json();
    if (!Array.isArray(rows) || rows.length === 0) return null;

    return rows[0].id;
  } catch (e) {
    console.warn("createPendingReservation 예외:", e);
    return null;
  }
}

function PassengerCounter({ label, description, priceLabel, value = 0, onDecrease, onIncrease, disableDecrease = false, disableIncrease = false }) {
  return (
    <div className="grid gap-3 border-stone-100 md:border-r md:pr-6 last:border-r-0 last:pr-0">
      <div>
        <div className="text-sm font-black text-stone-700">{label}</div>
        {description ? <div className="mt-1 text-xs font-bold text-stone-400">{description}</div> : null}
        <div className="mt-3 text-base font-black text-stone-950">{priceLabel}</div>
      </div>
      <div className="grid max-w-[170px] grid-cols-[36px_1fr_36px] border border-stone-200 bg-white text-sm font-black text-stone-800">
        <button type="button" onClick={onDecrease} disabled={disableDecrease} className="border-r border-stone-200 py-3 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:text-stone-300" aria-label={`${label} 감소`}>-</button>
        <div className="flex items-center justify-center px-4 py-3">{value}</div>
        <button type="button" onClick={onIncrease} disabled={disableIncrease} className="border-l border-stone-200 py-3 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:text-stone-300" aria-label={`${label} 증가`}>+</button>
      </div>
    </div>
  );
}

const COOLDOWN_SECONDS = 60;

function SmsVerificationBox({ phone = "", onVerifiedChange }) {
  const [code, setCode] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [message, setMessage] = useState("휴대폰 번호 입력 후 인증번호를 받아주세요.");
  const [isVerified, setIsVerified] = useState(false);
  const [hasSent, setHasSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef(null);
  const inputRef = useRef(null);

  const phoneDigits = getPhoneDigits(phone);
  const isOnCooldown = cooldown > 0;
  const canRequest = phoneDigits.length === 11 && phoneDigits.startsWith("010") && !isSending && !isOnCooldown;
  const canVerify = code.replace(/\D/g, "").length === 6 && !isChecking && !isVerified;

  useEffect(() => {
    setCode(""); setIsVerified(false); setHasSent(false); setCooldown(0);
    setMessage("휴대폰 번호 입력 후 인증번호를 받아주세요.");
    onVerifiedChange?.(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }, [phoneDigits, onVerifiedChange]);

  useEffect(() => { return () => { if (timerRef.current) clearInterval(timerRef.current); }; }, []);

  function startCooldown() {
    setCooldown(COOLDOWN_SECONDS);
    timerRef.current = setInterval(() => {
      setCooldown((prev) => { if (prev <= 1) { clearInterval(timerRef.current); return 0; } return prev - 1; });
    }, 1000);
  }

  async function handleRequestCode() {
    if (!canRequest) {
      if (phoneDigits.length !== 11 || !phoneDigits.startsWith("010")) setMessage("010으로 시작하는 휴대폰 번호 11자리를 입력해주세요.");
      return;
    }
    setIsSending(true); setMessage("인증번호를 발송하는 중입니다...");
    try {
      const result = await requestSmsVerification(phoneDigits);
      if (result.ok) { setHasSent(true); startCooldown(); setMessage("인증번호를 발송했습니다. 문자를 확인해주세요."); }
      else setMessage(result.message || "인증번호 발송에 실패했습니다.");
    } catch { setMessage("인증번호 발송 중 오류가 발생했습니다."); }
    finally { setIsSending(false); }
  }

  async function handleVerifyCode() {
    const safeCode = code.replace(/\D/g, "").slice(0, 6);
    if (safeCode.length !== 6) { setMessage("인증번호 6자리를 입력해주세요."); return; }
    setIsChecking(true); setMessage("인증번호를 확인하는 중입니다...");
    try {
      const result = await verifySmsCode({ phone: phoneDigits, code: safeCode });
      if (result.ok) { setIsVerified(true); onVerifiedChange?.(true); if (timerRef.current) clearInterval(timerRef.current); setCooldown(0); }
      setMessage(result.message || (result.ok ? "휴대폰 인증이 완료되었습니다." : "인증번호 확인에 실패했습니다."));
    } catch { setMessage("인증번호 확인 중 오류가 발생했습니다."); }
    finally { setIsChecking(false); }
  }

  function handleCodeChange(e) {
    const d = e.target.value.replace(/\D/g, "").slice(0, 6);
    setCode(d);
    if (inputRef.current && inputRef.current.value !== d) inputRef.current.value = d;
  }

  function getSendButtonContent() {
    if (isVerified) return { label: "✓ 인증 완료", cls: "rounded-2xl px-4 py-3 text-xs font-black text-white bg-green-500 cursor-default whitespace-nowrap" };
    if (isSending) return { label: "발송 중...", cls: "rounded-2xl px-4 py-3 text-xs font-black text-white bg-stone-300 cursor-not-allowed whitespace-nowrap" };
    if (isOnCooldown) return {
      label: (<span className="flex items-center gap-1 whitespace-nowrap"><span className="tabular-nums font-black">{cooldown}초</span><span className="text-[10px]">후 재요청</span></span>),
      cls: "rounded-2xl px-4 py-3 text-xs font-black text-orange-700 bg-orange-100 border-2 border-orange-300 cursor-not-allowed min-w-[90px] text-center"
    };
    if (!canRequest) return { label: "인증번호 받기", cls: "rounded-2xl px-4 py-3 text-xs font-black text-white bg-stone-300 cursor-not-allowed whitespace-nowrap" };
    return { label: hasSent ? "재요청" : "인증번호 받기", cls: "rounded-2xl px-4 py-3 text-xs font-black text-white bg-orange-500 transition hover:bg-orange-600 whitespace-nowrap" };
  }

  const sendBtn = getSendButtonContent();

  return (
    <div className="md:col-span-2 rounded-3xl border border-orange-100 bg-orange-50/60 p-5">
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-black text-orange-700">휴대폰 인증</p>
            <p className="mt-1 text-xs font-bold leading-5 text-stone-500">실제 연락 가능한 번호인지 확인한 뒤 예약이 가능합니다.</p>
          </div>
          <button type="button" onClick={handleRequestCode} disabled={!canRequest || isVerified || isOnCooldown} className={sendBtn.cls}>{sendBtn.label}</button>
        </div>
        {isOnCooldown && (
          <div className="w-full rounded-full bg-orange-100 h-1.5 overflow-hidden">
            <div className="h-full bg-orange-400 transition-all duration-1000" style={{ width: `${(cooldown / COOLDOWN_SECONDS) * 100}%` }} />
          </div>
        )}
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <input ref={inputRef} type="tel" inputMode="numeric" pattern="[0-9]*" value={code}
            onChange={handleCodeChange} placeholder="인증번호 6자리" disabled={isVerified}
            autoComplete="one-time-code"
            className="rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm font-bold outline-none transition focus:border-orange-400 disabled:text-stone-400" />
          <button type="button" onClick={handleVerifyCode} disabled={!canVerify}
            className="rounded-2xl bg-stone-900 px-5 py-3 text-xs font-black text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300 whitespace-nowrap">
            {isChecking ? "확인 중..." : isVerified ? "✓ 완료" : "인증 확인"}
          </button>
        </div>
      </div>
      <p className={`mt-3 text-xs font-black ${isVerified ? "text-green-600" : isOnCooldown ? "text-orange-600" : "text-stone-500"}`}>{message}</p>
    </div>
  );
}

export default function ReservationPanel({
  selectedDate, remainingSeats = 0, price = 0, form = {},
  onChange, onSubmit, notice, reservationSuccessNotice = "",
  isSubmitting = false, onOpenPrivacyPolicy
}) {
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [paymentNotice, setPaymentNotice] = useState("");
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);

  useEffect(() => {
    if (reservationSuccessNotice) { setPrivacyConsent(false); setIsPaymentProcessing(false); }
  }, [reservationSuccessNotice]);

  useEffect(() => { loadNicepayScript().catch(() => {}); }, []);

  const safeRemainingSeats = Math.max(0, toSafeNumber(remainingSeats, 0));
  const adultCount  = toCount(form.adultCount, 1);
  const childCount  = toCount(form.childCount, 0);
  const infantCount = toCount(form.infantCount, 0);
  const selectedPeople = adultCount + childCount + infantCount;
  const safePrice   = Math.max(0, toSafeNumber(price, 0));
  const childPrice  = Math.max(0, safePrice - 10000);
  const totalAmount = adultCount * safePrice + childCount * childPrice;
  const hasAvailableSeats       = safeRemainingSeats > 0;
  const hasValidPeopleSelection = selectedPeople >= 1 && selectedPeople <= safeRemainingSeats;
  const hasRequiredPhoneVerification = !SMS_VERIFICATION_ENABLED || isPhoneVerified;
  const canSubmit = hasAvailableSeats && hasValidPeopleSelection && hasRequiredPhoneVerification && privacyConsent && !isSubmitting && !isPaymentProcessing;

  function updatePassengerCount(key, nextValue) {
    const a = key === "adultCount"  ? nextValue : adultCount;
    const c = key === "childCount"  ? nextValue : childCount;
    const i = key === "infantCount" ? nextValue : infantCount;
    if (a + c + i > safeRemainingSeats) return;
    onChange?.(key, nextValue);
    onChange?.("people", a + c + i);
  }

  async function handlePayment() {
    if (!canSubmit) return;
    setPaymentNotice("");
    setIsPaymentProcessing(true);

    try { await loadNicepayScript(); }
    catch { setPaymentNotice("결제 모듈 로드에 실패했습니다. 새로고침 후 다시 시도해주세요."); setIsPaymentProcessing(false); return; }

    const amt    = String(totalAmount);
    const mobile = isMobileDevice();
    const phone  = getPhoneDigits(form.phone || "");

    const reservationId = await createPendingReservation({
      reservationDate: selectedDate,
      name: form.name || "고객",
      phone,
      people: selectedPeople,
      amount: totalAmount,
    });

    const moid = reservationId || `BUS${Date.now().toString().slice(-10)}${phone.slice(-4)}`.slice(0, 40);

    // ✅ ReqReserved에 항상 날짜와 전화번호 포함 (nicepay-sign fallback INSERT용)
    const reqReserved = JSON.stringify({
      reservationId: reservationId || "",
      date: selectedDate,
      buyerTel: phone,
      buyerName: form.name || "고객",
      people: selectedPeople,
    });

    let signParams;
    try {
      const resp = await fetch(NICEPAY_SIGN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Amt: amt,
          Moid: moid,
          GoodsName: `대전빵버스 ${selectedDate} (${selectedPeople}명)`,
          BuyerName: form.name || "고객",
          BuyerTel: phone,
          ReturnURL: NICEPAY_RETURN_URL,
          ReqReserved: reqReserved,
        }),
      });
      signParams = await resp.json();
      if (!signParams.ok) throw new Error(signParams.message || "서명 생성 실패");
    } catch {
      setPaymentNotice("결제 준비 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      setIsPaymentProcessing(false); return;
    }

    let hiddenIframe = null;
    if (!mobile) {
      hiddenIframe = document.createElement("iframe");
      hiddenIframe.name = "nicepay-iframe";
      hiddenIframe.style.cssText = "display:none;width:0;height:0;border:none;position:absolute;";
      document.body.appendChild(hiddenIframe);
    }

    const form_el = document.createElement("form");
    form_el.name = "nicepayForm";
    form_el.method = "post";
    form_el.acceptCharset = "euc-kr";
    form_el.style.display = "none";
    if (mobile) {
      form_el.action = NICEPAY_RETURN_URL;
    } else {
      form_el.action = NICEPAY_RETURN_URL;
      form_el.target = "nicepay-iframe";
    }

    const fields = {
      PayMethod: "CARD",
      GoodsName: signParams.GoodsName,
      Amt: signParams.Amt,
      MID: signParams.MID,
      Moid: moid,
      BuyerName: signParams.BuyerName,
      BuyerTel: signParams.BuyerTel,
      EdiDate: signParams.EdiDate,
      SignData: signParams.SignData,
      CharSet: "utf-8",
      GoodsCl: "1",
      TransType: "0",
      ReturnURL: signParams.ReturnURL,
      ReqReserved: reqReserved,
    };
    Object.entries(fields).forEach(([k, v]) => {
      const input = document.createElement("input");
      input.type = "hidden"; input.name = k; input.value = v;
      form_el.appendChild(input);
    });
    document.body.appendChild(form_el);

    window.nicepaySubmit = function () {
      window.deleteLayer?.();
      const authData = {};
      new FormData(form_el).forEach((v, k) => { authData[k] = v; });
      delete window.nicepaySubmit;
      delete window.nicepayClose;
      setPaymentNotice("결제 승인 처리 중입니다...");

      Promise.resolve().then(async () => {
        try {
          const approveResp = await fetch(NICEPAY_APPROVE_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...authData, expectedAmt: amt, reservationId }),
          });
          const result = await approveResp.json();
          safeRemoveChild(document.body, hiddenIframe);
          safeRemoveChild(document.body, form_el);

          if (result.ok) {
            setPaymentNotice("");
            setIsPaymentProcessing(false);
            onSubmit?.({ paymentTID: result.TID, paymentAmt: result.Amt, reservationId })
              .catch((e) => console.error("onSubmit 오류:", e));
          } else {
            setPaymentNotice(`결제 실패: ${result.message || "알 수 없는 오류"}`);
            setIsPaymentProcessing(false);
          }
        } catch {
          safeRemoveChild(document.body, hiddenIframe);
          safeRemoveChild(document.body, form_el);
          setPaymentNotice("결제 승인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
          setIsPaymentProcessing(false);
        }
      });
    };

    window.nicepayClose = function () {
      window.deleteLayer?.();
      safeRemoveChild(document.body, form_el);
      safeRemoveChild(document.body, hiddenIframe);
      delete window.nicepaySubmit;
      delete window.nicepayClose;
      setPaymentNotice("결제가 취소되었습니다.");
      setIsPaymentProcessing(false);
    };

    try { window.goPay(form_el); }
    catch {
      setPaymentNotice("결제창 호출에 실패했습니다. 팝업 차단을 해제해주세요.");
      safeRemoveChild(document.body, form_el);
      safeRemoveChild(document.body, hiddenIframe);
      setIsPaymentProcessing(false);
    }
  }

  return (
    <section className="rounded-[2rem] border border-orange-100 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <SectionTitle eyebrow="Reservation" title="예약 정보 입력"
          description="선택한 날짜의 잔여 좌석과 결제 예정금액을 확인하고 예약 정보를 입력합니다." />
        <div className="rounded-full bg-orange-50 px-4 py-2 text-xs font-black text-orange-700">결제 완료 후 즉시 예약 확정</div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl bg-stone-50 p-5"><p className="text-xs font-black text-stone-500">선택 날짜</p><p className="mt-2 text-2xl font-black text-stone-900">{selectedDate || "날짜 선택 대기"}</p></div>
        <div className="rounded-3xl bg-stone-50 p-5"><p className="text-xs font-black text-stone-500">잔여 좌석</p><p className="mt-2 text-2xl font-black text-stone-900">{formatSeatCount(safeRemainingSeats)}</p></div>
        <div className="rounded-3xl bg-stone-50 p-5"><p className="text-xs font-black text-stone-500">총 결제 예정금액</p><p className="mt-2 text-2xl font-black text-orange-600">{formatCurrency(totalAmount)}</p></div>
      </div>

      <div className="mt-5 rounded-3xl border border-orange-100 bg-orange-50/70 p-5 text-sm font-bold leading-6 text-stone-700">
        <p className="font-black text-orange-700">💳 나이스페이 결제 안내</p>
        <p className="mt-2">신용카드·체크카드·카카오페이·네이버페이·토스페이 등으로 결제하실 수 있습니다.</p>
        <p className="mt-1 text-xs font-black text-stone-500">결제 완료 즉시 예약이 확정되며, 예약확정 문자가 자동 발송됩니다.</p>
      </div>

      <div className="mt-4 grid gap-3 rounded-3xl border border-stone-100 bg-stone-50 p-5 text-sm font-bold leading-6 text-stone-700 md:grid-cols-2">
        <div className="rounded-2xl bg-white p-4"><p className="font-black text-stone-950">예약 전 확인</p><p className="mt-2 text-xs font-bold text-stone-500">실제 연락 가능한 휴대폰 번호로만 예약해 주세요.</p></div>
        <div className="rounded-2xl bg-white p-4"><p className="font-black text-stone-950">인원 기준</p><p className="mt-2 text-xs font-bold text-stone-500">아동과 유아 기준은 현장 운영 기준에 따라 확인될 수 있습니다.</p></div>
        <div className="rounded-2xl bg-white p-4"><p className="font-black text-stone-950">취소/변경 문의</p><p className="mt-2 text-xs font-bold text-stone-500">예약 변경이나 취소는 관리자 확인 후 안내됩니다.</p></div>
        <div className="rounded-2xl bg-white p-4"><p className="font-black text-stone-950">좌석 안내</p><p className="mt-2 text-xs font-bold text-stone-500">잔여 좌석을 초과한 예약은 접수되지 않습니다.</p></div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-black text-stone-700">예약자명</span>
          <input type="text" value={form.name || ""} onChange={(e) => onChange?.("name", e.target.value)}
            placeholder="예약자명을 입력해주세요" autoComplete="name"
            className="rounded-2xl border border-stone-200 px-4 py-4 font-bold outline-none transition focus:border-orange-400" />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-sm font-black text-stone-700">연락처</span>
          <input type="tel" inputMode="tel" autoComplete="tel" value={form.phone || ""}
            onChange={(e) => onChange?.("phone", e.target.value)} placeholder="휴대폰 번호를 입력해주세요"
            className="rounded-2xl border border-stone-200 px-4 py-4 font-bold outline-none transition focus:border-orange-400" />
        </label>
        {SMS_VERIFICATION_ENABLED ? <SmsVerificationBox phone={form.phone} onVerifiedChange={setIsPhoneVerified} /> : null}
      </div>

      <div className="mt-6 rounded-3xl border border-stone-200 bg-stone-50 p-5">
        <div className="grid gap-6 md:grid-cols-3">
          <PassengerCounter label="성인" description="만 12세 이상" priceLabel={formatCurrency(safePrice)} value={adultCount}
            onDecrease={() => updatePassengerCount("adultCount", Math.max(0, adultCount - 1))}
            onIncrease={() => updatePassengerCount("adultCount", adultCount + 1)}
            disableDecrease={adultCount <= 0} disableIncrease={selectedPeople >= safeRemainingSeats} />
          <PassengerCounter label="아동" description="만 12세 미만" priceLabel={formatCurrency(childPrice)} value={childCount}
            onDecrease={() => updatePassengerCount("childCount", Math.max(0, childCount - 1))}
            onIncrease={() => updatePassengerCount("childCount", childCount + 1)}
            disableDecrease={childCount <= 0} disableIncrease={selectedPeople >= safeRemainingSeats} />
          <PassengerCounter label="유아" description="만 24개월 미만" priceLabel="0원" value={infantCount}
            onDecrease={() => updatePassengerCount("infantCount", Math.max(0, infantCount - 1))}
            onIncrease={() => updatePassengerCount("infantCount", infantCount + 1)}
            disableDecrease={infantCount <= 0} disableIncrease={selectedPeople >= safeRemainingSeats} />
        </div>

        <div className="mt-5 flex items-start gap-3 border-t border-stone-200 pt-4">
          <input type="checkbox" id="privacy-consent" checked={privacyConsent}
            onChange={(e) => setPrivacyConsent(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-orange-500 cursor-pointer" />
          <label htmlFor="privacy-consent" className="text-sm font-bold leading-6 text-stone-700 cursor-pointer">
            <button type="button" onClick={() => onOpenPrivacyPolicy?.()}
              className="font-black text-orange-700 underline decoration-orange-300 underline-offset-4">개인정보 수집·이용</button>
            에 동의합니다. <span className="text-xs font-black text-red-500">(필수)</span>
          </label>
        </div>

        <div className="mt-4 flex flex-col gap-4 border-t border-stone-200 pt-5 md:flex-row md:items-center md:justify-between">
          <div className="text-sm font-black text-stone-700">
            총 인원 {selectedPeople}명 · 총 금액
            <span className="ml-3 text-2xl text-stone-950">{formatCurrency(totalAmount)}</span>
          </div>
          <button type="button" onClick={handlePayment} disabled={!canSubmit}
            className="rounded-2xl bg-orange-500 px-10 py-4 text-sm font-black text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-stone-300">
            {isPaymentProcessing ? "결제 처리 중..."
              : isSubmitting ? "예약 접수 중..."
              : !hasAvailableSeats ? "잔여 좌석 없음"
              : SMS_VERIFICATION_ENABLED && !isPhoneVerified ? "휴대폰 인증 후 결제"
              : !privacyConsent ? "개인정보 동의 후 결제"
              : "💳 결제하기"}
          </button>
        </div>

        {!hasValidPeopleSelection ? (
          <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-xs font-black text-red-600">예약 인원은 최소 1명 이상이며 잔여 좌석을 초과할 수 없습니다.</div>
        ) : null}

        {SMS_VERIFICATION_ENABLED && !Boolean(reservationSuccessNotice) ? (
          <div className={`mt-4 rounded-2xl px-4 py-3 text-xs font-black ${isPhoneVerified ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700"}`}>
            {isPhoneVerified ? "휴대폰 인증이 완료되었습니다." : "휴대폰 인증을 완료해야 예약 접수가 가능합니다."}
          </div>
        ) : null}
      </div>

      {paymentNotice ? (
        <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-4 text-sm font-black text-red-700">{paymentNotice}</div>
      ) : null}
      {notice ? (
        <div className="mt-5 rounded-2xl border border-orange-100 bg-orange-50 px-4 py-4 text-sm font-black text-orange-700">{notice}</div>
      ) : null}
      {reservationSuccessNotice ? (
        <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 px-4 py-4 text-sm font-black text-green-700">{reservationSuccessNotice}</div>
      ) : null}
    </section>
  );
}
