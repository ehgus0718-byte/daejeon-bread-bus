import React, { useEffect, useMemo, useState } from "react";
import TwoMonthCalendar from "./components/TwoMonthCalendar.jsx";
import ReservationPanel from "./components/ReservationPanel.jsx";
import AdminLogin from "./components/AdminLogin.jsx";
import AdminDashboard from "./components/AdminDashboard.jsx";
import CustomerScheduleSection from "./components/CustomerScheduleSection.jsx";
import { buildDateSettings } from "./core/dateSettingsBuilder.js";
import {
  updateCapacityOverride,
  updatePriceOverride,
  updateScheduleStatus
} from "./core/adminSettingsUpdater.js";
import { createReservation } from "./core/reservationFactory.js";
import { getRemainingSeats } from "./core/reservationSchema.js";
import { updateReservationStatus } from "./core/reservationStatusUpdater.js";
import { validateReservationForm } from "./core/reservationValidation.js";
import {
  INITIAL_ADMIN_SETTINGS,
  INITIAL_RESERVATIONS
} from "./data/initialData.js";
import { DEFAULT_RESERVATION_FORM } from "./data/formDefaults.js";
import {
  loadAdminSettings,
  saveAdminSettings
} from "./services/storageIndex.js";
import { loadSiteSettings, saveSiteSettings } from "./api/siteSettingsClient.js";
import {
  sendReservationStatusSms,
  shouldSendReservationStatusSms
} from "./api/reservationStatusSmsClient.js";
import { supabaseClient } from "./api/supabaseClient.js";
import { adminReservationClient } from "./api/adminReservationClient.js";
import { reservationRepository } from "./repositories/index.js";
import {
  getReservationRepositoryMode,
  REPOSITORY_MODE
} from "./repositories/reservationRepositoryMode.js";

const ADMIN_SESSION_KEY = "daejeon-bread-bus-admin-authed";
const ADMIN_ACCESS_STORAGE_KEY = "daejeon-bread-bus-admin-access";
const ADMIN_QUICK_REFRESH_LIMIT = 100;
const RESERVATION_REPOSITORY_MODE = getReservationRepositoryMode();
const USES_REMOTE_RESERVATION_STORAGE =
  RESERVATION_REPOSITORY_MODE !== REPOSITORY_MODE.LOCAL;
const RESERVATION_RECEIVED_NOTICE =
  "결제가 완료되어 예약이 확정되었습니다. 예약 확정 문자를 확인해주세요. 문의: 010-4560-6701";

const SUPABASE_URL = "https://mnwimnwdilerkktizzqn.supabase.co";
const NICEPAY_APPROVE_URL = `${SUPABASE_URL}/functions/v1/nicepay-approve`;

function getErrorMessage(error) {
  return error?.message || String(error || "알 수 없는 오류");
}

function getInitialReservations() {
  return USES_REMOTE_RESERVATION_STORAGE ? [] : INITIAL_RESERVATIONS;
}

async function fetchReservationCounts() {
  if (!supabaseClient) return [];
  try {
    const { data, error } = await supabaseClient.rpc("reservation_daily_counts");
    if (error) { console.warn("Reservation counts load failed", error); return []; }
    return (Array.isArray(data) ? data : []).map((row) => ({
      id: `count-${row.reservation_date}`,
      date: row.reservation_date,
      people: Number(row.reserved_people || 0),
      status: "결제대기"
    }));
  } catch (error) {
    console.warn("Reservation counts load failed", error);
    return [];
  }
}

function getInitialSelectedDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const date = today.getDate();
  if (year === 2026 && (month === 5 || month === 6)) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(date).padStart(2, "0")}`;
  }
  return "2026-06-01";
}

function getInitialAdminAccessCode() {
  if (typeof window === "undefined") return "";
  try { return window.sessionStorage.getItem(ADMIN_ACCESS_STORAGE_KEY) || ""; }
  catch (error) { console.warn("Admin access read failed", error); return ""; }
}

function getInitialAdminAuthState() {
  return Boolean(getInitialAdminAccessCode());
}

function saveAdminSession(accessCode) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
    window.sessionStorage.setItem(ADMIN_ACCESS_STORAGE_KEY, accessCode || "");
  } catch (error) { console.warn("Admin session save failed", error); }
}

function clearAdminSession() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
    window.sessionStorage.removeItem(ADMIN_ACCESS_STORAGE_KEY);
  } catch (error) { console.warn("Admin session clear failed", error); }
}

function toSafeAdminNote(note = "") { return String(note || "").trim(); }
function getReservationId(reservation = {}) { return reservation?.id || reservation?.reservationId || null; }
function normalizeReservationArray(r = []) { return Array.isArray(r) ? r.filter(Boolean) : []; }

function mergeReservationsById(currentReservations = [], incomingReservations = []) {
  const currentList = normalizeReservationArray(currentReservations);
  const incomingList = normalizeReservationArray(incomingReservations);
  if (incomingList.length === 0) return currentList;
  const incomingIds = new Set(incomingList.map(getReservationId).filter(Boolean));
  const remainingCurrent = currentList.filter((r) => {
    const id = getReservationId(r);
    return !id || !incomingIds.has(id);
  });
  return [...incomingList, ...remainingCurrent];
}

function updateReservationAdminNote({ reservations = [], reservationId, note = "" }) {
  const safeNote = toSafeAdminNote(note);
  return reservations.map((r) => {
    if (r.id !== reservationId) return r;
    return { ...r, adminNote: safeNote, noteUpdatedAt: new Date().toISOString() };
  });
}

function normalizeAdminSettings(settings = {}) {
  return {
    capacityOverrides: settings.capacityOverrides || {},
    priceOverrides: settings.priceOverrides || {},
    scheduleStatus: settings.scheduleStatus || {},
    scheduleDetails: settings.scheduleDetails || {},
    headerLinks: Array.isArray(settings.headerLinks) ? settings.headerLinks : [],
    boardingTime: String(settings.boardingTime || "10:00").trim() || "10:00"
  };
}

function removeDateKey(settings = {}, date) {
  const next = { ...settings };
  delete next[date];
  return next;
}

function updateScheduleDetail(settings = {}, date, detail = "") {
  const safeDetail = String(detail || "").trim();
  if (!safeDetail) return removeDateKey(settings, date);
  return { ...settings, [date]: safeDetail };
}

function isValidUrl(url = "") {
  const s = String(url || "").trim();
  return s.startsWith("http://") || s.startsWith("https://");
}

// ── 모바일 결제 완료 처리 페이지 (사용 안 함 - nicepay-return Edge Function으로 처리) ──
function PaymentResultPage() {
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const [detail, setDetail] = useState("");

  useEffect(() => {
    const params = Object.fromEntries(new URLSearchParams(window.location.search));
    if (params.AuthResultCode !== "0000") {
      setStatus("fail");
      setMessage("결제 인증에 실패했습니다.");
      setDetail(params.AuthResultMsg || `코드: ${params.AuthResultCode}`);
      return;
    }
    fetch(NICEPAY_APPROVE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    })
      .then((r) => r.json())
      .then((result) => {
        if (!result.ok) {
          setStatus("fail");
          setMessage("결제 승인에 실패했습니다.");
          setDetail(result.message || "알 수 없는 오류");
          return;
        }
        setStatus("success");
        setMessage("결제가 완료되었습니다!");
        setDetail(`결제금액: ${Number(result.Amt).toLocaleString()}원 · 승인번호: ${result.AuthCode || "-"}`);
        setTimeout(() => { window.location.href = "/"; }, 3000);
      })
      .catch((err) => {
        setStatus("fail");
        setMessage("결제 승인 중 오류가 발생했습니다.");
        setDetail(String(err));
      });
  }, []);

  return (
    <div className="min-h-screen bg-[#fff8ef] flex items-center justify-center px-5">
      <div className="bg-white rounded-[2rem] p-10 max-w-md w-full text-center shadow-xl shadow-orange-100">
        {status === "loading" && (
          <>
            <div className="mx-auto mb-6 h-12 w-12 animate-spin rounded-full border-4 border-orange-100 border-t-orange-500" />
            <p className="text-xl font-black text-stone-900">결제 승인 처리 중</p>
            <p className="mt-2 text-sm font-bold text-stone-500">잠시만 기다려주세요.</p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="text-5xl mb-4">🎉</div>
            <p className="text-2xl font-black text-stone-900">{message}</p>
            <p className="mt-3 text-sm font-bold text-green-700 bg-green-50 rounded-2xl px-4 py-3">{detail}</p>
            <p className="mt-4 text-xs font-bold text-stone-400">3초 후 홈으로 이동합니다.</p>
          </>
        )}
        {status === "fail" && (
          <>
            <div className="text-5xl mb-4">⚠️</div>
            <p className="text-2xl font-black text-stone-900">{message}</p>
            <p className="mt-3 text-sm font-bold text-red-700 bg-red-50 rounded-2xl px-4 py-3">{detail}</p>
            <a href="/" className="mt-6 inline-block rounded-2xl bg-orange-500 px-8 py-3 text-sm font-black text-white">홈으로 돌아가기</a>
          </>
        )}
      </div>
    </div>
  );
}

function PolicyModal({ type, onClose }) {
  if (!type) return null;
  const isPrivacy = type === "privacy";
  const title = isPrivacy ? "개인정보처리방침" : "이용약관";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
      <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl md:p-8">
        <div className="flex items-start justify-between gap-4 border-b border-orange-100 pb-4">
          <div>
            <p className="text-xs font-black tracking-[0.2em] text-orange-700">SOMANG TOUR</p>
            <h3 className="mt-2 text-2xl font-black text-stone-950">{title}</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-full bg-stone-100 px-4 py-2 text-sm font-black text-stone-700">닫기</button>
        </div>
        {isPrivacy ? (
          <div className="mt-5 space-y-5 text-sm font-bold leading-7 text-stone-700">
            <p className="text-xs font-black text-stone-400">시행일: 2026년 6월 22일</p>
            <div><p className="font-black text-stone-900">1. 수집하는 개인정보 항목</p><p className="mt-2">소망투어는 대전빵버스 예약 서비스 운영을 위해 다음과 같은 개인정보를 수집합니다.</p><p className="mt-1">예약자명, 휴대폰 번호, 예약일, 예약 인원, 예약 상태</p></div>
            <div><p className="font-black text-stone-900">2. 개인정보 수집·이용 목적</p><p className="mt-2">예약 접수 및 확인, 결제 처리 안내, 예약 확정·취소 문자 발송, 고객 문의 응대</p></div>
            <div><p className="font-black text-stone-900">3. 보유 및 이용 기간</p><p className="mt-2">예약 서비스 이용 완료 후 관련 법령에 따라 보관합니다.</p><p className="mt-1">전자상거래법에 따라 계약·청약철회 기록 5년, 소비자 불만·분쟁 처리 기록 3년, 표시·광고 기록 6개월을 보관하며, 이후 지체 없이 파기합니다.</p></div>
            <div><p className="font-black text-stone-900">4. 개인정보의 제3자 제공</p><p className="mt-2">소망투어는 법령에 따른 경우를 제외하고 고객의 동의 없이 개인정보를 외부에 제공하지 않습니다.</p></div>
            <div><p className="font-black text-stone-900">5. 개인정보 처리 위탁</p><p className="mt-2">소망투어는 예약 안내 문자 발송을 위해 문자 발송 서비스 업체에 최소한의 개인정보(휴대폰 번호)를 위탁할 수 있습니다.</p></div>
            <div><p className="font-black text-stone-900">6. 정보주체의 권리</p><p className="mt-2">고객은 언제든지 자신의 개인정보에 대한 열람, 정정, 삭제, 처리정지를 요청할 수 있습니다.</p></div>
            <div><p className="font-black text-stone-900">7. 개인정보 파기</p><p className="mt-2">보유 기간이 경과하거나 처리 목적이 달성된 개인정보는 즉시 파기합니다.</p></div>
            <div><p className="font-black text-stone-900">8. 개인정보보호책임자</p><p className="mt-2">성명: 전훈 | 소속: 소망투어 | 연락처: 010-4560-6701 / ehgus0718@naver.com</p></div>
            <div><p className="font-black text-stone-900">9. 권익침해 구제 방법</p><p className="mt-2">개인정보 침해 신고·상담: 개인정보보호위원회(privacy.go.kr, 182) 또는 한국인터넷진흥원(kisa.or.kr, 118)</p></div>
          </div>
        ) : (
          <div className="mt-5 space-y-5 text-sm font-bold leading-7 text-stone-700">
            <p className="text-xs font-black text-stone-400">시행일: 2026년 6월 22일</p>
            <div><p className="font-black text-stone-900">제1조 (목적)</p><p className="mt-2">본 약관은 소망투어(이하 "회사")가 운영하는 대전빵셔틀 빵버스 예약 서비스의 이용 조건 및 절차에 관한 사항을 규정합니다.</p></div>
            <div><p className="font-black text-stone-900">제2조 (예약 접수)</p><p className="mt-2">고객은 날짜 선택, 휴대폰 인증, 예약 정보 입력을 통해 예약을 접수할 수 있습니다.</p></div>
            <div><p className="font-black text-stone-900">제3조 (결제)</p><p className="mt-2">카드결제로 결제를 완료하시면 예약확정 문자가 자동 발송되며, 이 시점에 예약이 최종 확정됩니다.</p></div>
            <div><p className="font-black text-stone-900">제4조 (청약철회 및 취소·환불)</p><ul className="mt-2 list-disc pl-5 space-y-1"><li>출발 5일 전까지 취소: 전액 환불</li><li>출발 3~4일 전 취소: 결제 금액의 50% 환불</li><li>출발 1~2일 전 및 당일 취소: 환불 불가</li><li>회사 사정으로 취소 시: 전액 환불</li></ul></div>
            <div><p className="font-black text-stone-900">제5조 (운영 변경)</p><p className="mt-2">최소 출발 인원 미달, 기상 악화, 차량 사정 등으로 일정이 변경되거나 취소될 수 있습니다.</p></div>
            <div><p className="font-black text-stone-900">제6조 (면책)</p><p className="mt-2">고객의 귀책 사유로 인한 취소·변경, 또는 천재지변으로 인한 운행 불가 시 회사는 책임을 지지 않습니다.</p></div>
            <div><p className="font-black text-stone-900">제7조 (문의)</p><p className="mt-2">예약 및 이용 문의: 010-4560-6701 / ehgus0718@naver.com | 운영시간: 09:00 ~ 18:00 (연중무휴)</p></div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AppSafe() {
  const savedAdminSettings = useMemo(() => loadAdminSettings(INITIAL_ADMIN_SETTINGS), []);

  const isPaymentResultPage = typeof window !== "undefined" && window.location.pathname.startsWith("/payment-result");
  if (isPaymentResultPage) return <PaymentResultPage />;

  const [selectedDate, setSelectedDate] = useState(getInitialSelectedDate);
  const [reservationForm, setReservationForm] = useState(DEFAULT_RESERVATION_FORM);
  const [reservations, setReservations] = useState(getInitialReservations);
  const [adminReservations, setAdminReservations] = useState(null);
  const [recentChangedReservationId, setRecentChangedReservationId] = useState("");
  const [operationNotice, setOperationNotice] = useState("");
  const [capacityOverrides, setCapacityOverrides] = useState(savedAdminSettings.capacityOverrides);
  const [priceOverrides, setPriceOverrides] = useState(savedAdminSettings.priceOverrides);
  const [scheduleStatus, setScheduleStatus] = useState(savedAdminSettings.scheduleStatus);
  const [scheduleDetails, setScheduleDetails] = useState(savedAdminSettings.scheduleDetails || {});
  const [headerLinks, setHeaderLinks] = useState(Array.isArray(savedAdminSettings.headerLinks) ? savedAdminSettings.headerLinks : []);
  const [boardingTime, setBoardingTime] = useState(String(savedAdminSettings.boardingTime || "10:00").trim() || "10:00");
  const [notice, setNotice] = useState("");
  const [reservationSuccessNotice, setReservationSuccessNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshingReservations, setIsRefreshingReservations] = useState(false);
  const [isAdminAuthed, setIsAdminAuthed] = useState(getInitialAdminAuthState);
  const [adminAccessCode, setAdminAccessCode] = useState(getInitialAdminAccessCode);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");
  const [isAdminSettingsReady, setIsAdminSettingsReady] = useState(!USES_REMOTE_RESERVATION_STORAGE);
  const [activePolicyModal, setActivePolicyModal] = useState(null);

  const isAdminPage = typeof window !== "undefined" && window.location.pathname.startsWith("/admin");

  const visibleHeaderLinks = useMemo(
    () => (Array.isArray(headerLinks) ? headerLinks : []).filter((link) => link.label && isValidUrl(link.url)),
    [headerLinks]
  );

  useEffect(() => {
    let isMounted = true;
    async function loadStoredReservations() {
      if (isAdminPage) {
        const storedAccessCode = getInitialAdminAccessCode();
        if (!storedAccessCode) {
          const counts = await fetchReservationCounts();
          if (!isMounted) return;
          setReservations(counts);
          return;
        }
        const result = await adminReservationClient.list(storedAccessCode);
        if (!isMounted) return;
        if (!result.ok) {
          setNotice(`예약 데이터를 불러오지 못했습니다. ${getErrorMessage(result.error)}`);
          setOperationNotice(`예약 데이터를 불러오지 못했습니다. ${getErrorMessage(result.error)}`);
          setReservations([]);
          return;
        }
        setReservations(Array.isArray(result.data) ? result.data : []);
        setAdminReservations(null);
        return;
      }
      const counts = await fetchReservationCounts();
      if (!isMounted) return;
      setReservations(counts);
    }
    loadStoredReservations();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function loadRemoteAdminSettings() {
      if (!USES_REMOTE_RESERVATION_STORAGE) { setIsAdminSettingsReady(true); return; }
      const result = await loadSiteSettings();
      if (!isMounted) return;
      if (!result.ok) {
        console.warn("Remote admin settings load failed", result.error);
        setNotice(`관리자 날짜 설정은 임시 저장소로 표시됩니다. ${getErrorMessage(result.error)}`);
        setIsAdminSettingsReady(true);
        return;
      }
      const nextSettings = normalizeAdminSettings(result.data);
      setCapacityOverrides(nextSettings.capacityOverrides);
      setPriceOverrides(nextSettings.priceOverrides);
      setScheduleStatus(nextSettings.scheduleStatus);
      setScheduleDetails(nextSettings.scheduleDetails);
      setHeaderLinks(nextSettings.headerLinks);
      setBoardingTime(nextSettings.boardingTime);
      saveAdminSettings(nextSettings);
      setIsAdminSettingsReady(true);
    }
    loadRemoteAdminSettings();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    const nextSettings = { capacityOverrides, priceOverrides, scheduleStatus, scheduleDetails, headerLinks, boardingTime };
    saveAdminSettings(nextSettings);
    if (!USES_REMOTE_RESERVATION_STORAGE || !isAdminSettingsReady) return;
    let isCancelled = false;
    async function saveRemoteSettings() {
      const result = await saveSiteSettings(nextSettings);
      if (isCancelled || result.ok) return;
      console.warn("Remote admin settings save failed", result.error);
      setNotice(`관리자 날짜 설정 원격 저장에 실패했습니다. ${getErrorMessage(result.error)}`);
    }
    saveRemoteSettings();
    return () => { isCancelled = true; };
  }, [capacityOverrides, priceOverrides, scheduleStatus, scheduleDetails, headerLinks, boardingTime, isAdminSettingsReady]);

  const managedDateSettings = useMemo(
    () => buildDateSettings({ capacityOverrides, priceOverrides, scheduleStatus, scheduleDetails }),
    [capacityOverrides, priceOverrides, scheduleStatus, scheduleDetails]
  );

  const visibleAdminReservations = adminReservations || reservations;
  const isQuickReservationView = Array.isArray(adminReservations);

  function clearQuickAdminReservations() { setAdminReservations(null); }
  function handleClearQuickReservations() {
    clearQuickAdminReservations();
    setOperationNotice("전체 예약 목록 보기로 돌아왔습니다.");
    setNotice("전체 예약 목록 보기로 돌아왔습니다.");
  }
  function markReservationChanged(reservationId, message) {
    setRecentChangedReservationId(reservationId || "");
    setOperationNotice(message || "예약 정보가 반영되었습니다.");
  }
  function remaining(date) {
    return getRemainingSeats({ reservations, dateSettings: managedDateSettings, date, fallbackCapacity: 15 });
  }

  const selectedPrice = useMemo(() => Number(managedDateSettings[selectedDate]?.price || 30000), [managedDateSettings, selectedDate]);
  const selectedScheduleStatus = managedDateSettings[selectedDate]?.status || "closed";
  const selectedScheduleDetail = managedDateSettings[selectedDate]?.detail || "";

  function handleSelectDate(date) { setSelectedDate(date); setReservationSuccessNotice(""); }
  function handleFormChange(key, value) {
    if (["name", "phone", "people", "adultCount", "childCount", "infantCount"].includes(key)) setReservationSuccessNotice("");
    setReservationForm((prev) => ({ ...prev, [key]: value }));
  }
  function resetForm() { setReservationForm(DEFAULT_RESERVATION_FORM); }

  async function handleAdminLogin() {
    setAdminError("");
    const code = adminPassword.trim();
    if (!code) { setAdminError("관리자 접근 코드를 입력해주세요."); return; }
    const verifyResult = await adminReservationClient.verify(code);
    if (!verifyResult.ok) { setAdminError("관리자 인증에 실패했습니다. 접근 코드를 확인해주세요."); return; }
    saveAdminSession(code);
    setAdminAccessCode(code);
    setIsAdminAuthed(true);
    setAdminPassword("");
    const listResult = await adminReservationClient.list(code);
    if (listResult.ok) { setReservations(Array.isArray(listResult.data) ? listResult.data : []); setAdminReservations(null); }
  }

  function handleAdminLogout() {
    clearAdminSession();
    setIsAdminAuthed(false); setAdminAccessCode(""); setAdminReservations(null);
    setReservations([]); setAdminPassword(""); setAdminError("");
  }

  function handleCapacityChange(date, nextCapacity) { setCapacityOverrides((prev) => updateCapacityOverride({ capacityOverrides: prev, date, nextCapacity })); }
  function handlePriceChange(date, nextPrice) { setPriceOverrides((prev) => updatePriceOverride({ priceOverrides: prev, nextPrice, date })); }
  function handleScheduleStatusChange(date, nextStatus) { setScheduleStatus((prev) => updateScheduleStatus({ scheduleStatus: prev, date, nextStatus })); }
  function handleScheduleDetailChange(date, nextDetail) {
    if (!date) { setNotice("일정을 저장할 날짜를 찾지 못했습니다."); return; }
    setScheduleDetails((prev) => updateScheduleDetail(prev, date, nextDetail));
    setNotice("여행 일정이 저장되었습니다.");
  }
  function handleRemoveScheduleDetail(date) {
    if (!date) { setNotice("삭제할 일정 날짜를 찾지 못했습니다."); return; }
    setScheduleDetails((prev) => removeDateKey(prev, date));
    setNotice("선택한 날짜의 여행 일정이 삭제되었습니다.");
  }
  function handleRemoveDateSettings(date) {
    if (!date) { setNotice("삭제할 날짜를 찾지 못했습니다."); return; }
    setCapacityOverrides((prev) => removeDateKey(prev, date));
    setPriceOverrides((prev) => removeDateKey(prev, date));
    setScheduleStatus((prev) => removeDateKey(prev, date));
    setScheduleDetails((prev) => removeDateKey(prev, date));
    setNotice("선택한 날짜 설정이 삭제되었습니다.");
  }
  function handleUpdateHeaderLinks(nextLinks) { setHeaderLinks(Array.isArray(nextLinks) ? nextLinks : []); }
  function handleUpdateBoardingTime(nextTime) { setBoardingTime(String(nextTime || "").trim() || "10:00"); }

  async function handleRefreshReservations() {
    if (isRefreshingReservations) return;
    setNotice(""); setOperationNotice(""); setIsRefreshingReservations(true);
    try {
      const result = await adminReservationClient.list(adminAccessCode, { limit: ADMIN_QUICK_REFRESH_LIMIT });
      if (!result.ok) {
        const message = `예약 목록 새로고침에 실패했습니다. ${getErrorMessage(result.error)}`;
        setNotice(message); setOperationNotice(message); return;
      }
      if (Array.isArray(result.data)) {
        setAdminReservations(result.data);
        setOperationNotice(`최근 예약 ${result.data.length}건을 빠르게 불러왔습니다.`);
        setNotice(`최근 예약 ${result.data.length}건을 빠르게 불러왔습니다.`);
      }
    } catch (error) {
      const message = `예약 목록 새로고침에 실패했습니다. ${getErrorMessage(error)}`;
      setNotice(message); setOperationNotice(message);
    } finally { setIsRefreshingReservations(false); }
  }

  async function handleReservationStatusChange(id, nextStatus) {
    setNotice(""); setOperationNotice("예약 상태를 저장하는 중입니다..."); clearQuickAdminReservations();
    const previousReservations = reservations;
    const nextReservations = updateReservationStatus({ reservations, reservationId: id, nextStatus });
    setReservations(nextReservations); setRecentChangedReservationId(id || "");
    try {
      const result = await adminReservationClient.update(adminAccessCode, id, { status: nextStatus });
      if (!result.ok) {
        const message = `예약 상태 저장에 실패했습니다. ${getErrorMessage(result.error)}`;
        setReservations(previousReservations); setNotice(message); setOperationNotice(message); return;
      }
      let savedReservations = [];
      if (Array.isArray(result.data) && result.data.length > 0) {
        savedReservations = result.data;
        setReservations((cur) => mergeReservationsById(cur, result.data));
      }
      const smsReservation =
        savedReservations[0] ||
        nextReservations.find((r) => getReservationId(r) === id) ||
        previousReservations.find((r) => getReservationId(r) === id) ||
        { id, status: nextStatus };
      if (!shouldSendReservationStatusSms(nextStatus)) { markReservationChanged(id, "예약 상태가 저장되었습니다."); return; }
      const smsResult = await sendReservationStatusSms({
        reservation: { ...smsReservation, status: nextStatus },
        status: nextStatus,
        boardingTime: boardingTime || "10:00"
      });
      if (smsResult.ok && !smsResult.skipped) { markReservationChanged(id, "예약 상태가 저장되었고 안내 문자가 발송되었습니다."); return; }
      const smsErrorMessage = smsResult.error ? ` ${getErrorMessage(smsResult.error)}` : "";
      markReservationChanged(id, `예약 상태는 저장되었지만 안내 문자 발송에 실패했습니다.${smsErrorMessage}`);
    } catch (error) {
      const message = `예약 상태 저장에 실패했습니다. ${getErrorMessage(error)}`;
      setReservations(previousReservations); setNotice(message); setOperationNotice(message);
    }
  }

  async function handleSaveReservationNote(id, note = "") {
    setNotice(""); setOperationNotice("관리자 메모를 저장하는 중입니다..."); clearQuickAdminReservations();
    if (!id) { const msg = "메모를 저장할 예약을 찾지 못했습니다."; setNotice(msg); setOperationNotice(msg); return false; }
    const safeNote = toSafeAdminNote(note);
    const previousReservations = reservations;
    setReservations(updateReservationAdminNote({ reservations, reservationId: id, note: safeNote }));
    setRecentChangedReservationId(id || "");
    try {
      const result = await adminReservationClient.update(adminAccessCode, id, { adminNote: safeNote });
      if (!result.ok) {
        const msg = `관리자 메모 저장에 실패했습니다. ${getErrorMessage(result.error)}`;
        setReservations(previousReservations); setNotice(msg); setOperationNotice(msg); return false;
      }
      if (Array.isArray(result.data) && result.data.length > 0) setReservations((cur) => mergeReservationsById(cur, result.data));
      markReservationChanged(id, "관리자 메모가 저장되었습니다."); setNotice("관리자 메모가 저장되었습니다."); return true;
    } catch (error) {
      const msg = `관리자 메모 저장에 실패했습니다. ${getErrorMessage(error)}`;
      setReservations(previousReservations); setNotice(msg); setOperationNotice(msg); return false;
    }
  }

  async function handleClearReservationNote(id) { return handleSaveReservationNote(id, ""); }

  async function handleRemoveReservation(id) {
    setNotice(""); setOperationNotice("예약을 삭제하는 중입니다..."); clearQuickAdminReservations();
    if (!id) { const msg = "삭제할 예약을 찾지 못했습니다."; setNotice(msg); setOperationNotice(msg); return; }
    if (typeof window !== "undefined" && !window.confirm("선택한 예약을 삭제하시겠습니까?")) { setOperationNotice(""); return; }
    const previousReservations = reservations;
    setReservations(reservations.filter((r) => r.id !== id));
    setRecentChangedReservationId("");
    try {
      const result = await adminReservationClient.remove(adminAccessCode, id);
      if (!result.ok) {
        const msg = `예약 삭제에 실패했습니다. ${getErrorMessage(result.error)}`;
        setReservations(previousReservations); setNotice(msg); setOperationNotice(msg); return;
      }
      setNotice("예약이 삭제되었습니다."); setOperationNotice("예약이 삭제되었습니다.");
    } catch (error) {
      const msg = `예약 삭제에 실패했습니다. ${getErrorMessage(error)}`;
      setReservations(previousReservations); setNotice(msg); setOperationNotice(msg);
    }
  }

  // ── PC 결제 완료 후 예약 저장 ──
  // ✅ 최종 수정: DB 저장 완료 즉시 성공 메시지 + resetForm → 스피너 해제
  // ✅ 문자 발송은 await 없이 백그라운드 실행 (스피너에 영향 없음)
  async function handleSubmit(paymentInfo = {}) {
    setNotice(""); setReservationSuccessNotice(""); setOperationNotice(""); clearQuickAdminReservations();

    const remainingSeats = remaining(selectedDate);
    const validation = validateReservationForm({
      selectedDate,
      scheduleStatus: selectedScheduleStatus,
      form: reservationForm,
      remainingSeats
    });
    if (!validation.valid) { setNotice(validation.message); return; }

    try {
      const isPaid = Boolean(paymentInfo?.paymentTID);
      const reservationItem = createReservation({
        selectedDate,
        form: reservationForm,
        price: selectedPrice,
        status: isPaid ? "결제완료" : "결제대기",
      });

      const result = await reservationRepository.add(reservationItem);
      if (!result.ok) {
        setNotice(`예약 저장 중 오류가 발생했습니다. ${getErrorMessage(result.error)}`);
        return;
      }

      const createdReservations = Array.isArray(result.data) && result.data.length > 0
        ? result.data : [reservationItem];
      const savedReservation = createdReservations[0];

      setRecentChangedReservationId(getReservationId(savedReservation) || "");
      setOperationNotice("신규 예약이 접수되었습니다.");

      // ✅ 즉시 성공 메시지 세팅 + 폼 초기화 → ReservationPanel useEffect가 스피너 해제
      setReservationSuccessNotice(RESERVATION_RECEIVED_NOTICE);
      resetForm();

      // ✅ 문자 발송은 await 없이 백그라운드 (블로킹 없음)
      const bt = boardingTime || "10:00";
      if (isPaid) {
        sendReservationStatusSms({
          reservation: { ...savedReservation, amount: paymentInfo.paymentAmt || savedReservation.amount },
          status: "결제완료",
          boardingTime: bt
        }).catch((e) => console.warn("고객 결제완료 문자 발송 실패", e));
      }
      sendReservationStatusSms({
        reservation: { ...savedReservation, phone: "01045606701" },
        status: "예약접수",
        boardingTime: bt
      }).catch((e) => console.warn("관리자 예약 알림 문자 발송 실패", e));

    } catch (error) {
      setNotice(`예약 저장 중 오류가 발생했습니다. ${getErrorMessage(error)}`);
    }
  }

  return (
    <div className="min-h-screen bg-[#fff8ef] text-stone-950">
      <header className="border-b border-orange-100 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto grid max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-3 px-5 py-4">
          <a href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-500 text-2xl text-white shadow-lg shadow-orange-200">🚌</div>
            <div>
              <h1 className="text-xl font-black">대전빵버스 빵셔틀</h1>
              <p className="text-xs font-bold text-stone-500">2026 Reservation Platform</p>
            </div>
          </a>
          <div className="hidden md:flex items-center justify-center gap-3">
            {visibleHeaderLinks.map((link) => (
              <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer"
                className="shrink-0 rounded-full border-2 border-orange-300 bg-orange-50 px-6 py-2.5 text-sm font-black text-orange-700 shadow-sm transition hover:bg-orange-100 hover:border-orange-400 hover:text-orange-800">
                {link.label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {!isAdminPage ? (
              <a href="tel:01045606701"
                className="shrink-0 flex items-center gap-2 rounded-full border-2 border-orange-400 bg-orange-50 px-5 py-2.5 text-sm font-black text-orange-700 shadow-sm transition hover:bg-orange-100 hover:border-orange-500">
                📞 전화상담
              </a>
            ) : null}
            {isAdminAuthed ? (
              <button type="button" onClick={handleAdminLogout}
                className="shrink-0 rounded-full bg-stone-950 px-4 py-2 text-xs font-black text-white">
                관리자 로그아웃
              </button>
            ) : null}
          </div>
        </div>
        {!isAdminPage && visibleHeaderLinks.length > 0 && (
          <div className="md:hidden border-t border-orange-100 bg-orange-50 px-4 py-3">
            <p className="mb-2 text-xs font-black text-orange-500 tracking-widest">이용후기</p>
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${visibleHeaderLinks.length}, 1fr)` }}>
              {visibleHeaderLinks.map((link) => (
                <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 rounded-2xl border-2 border-orange-300 bg-white py-3 text-base font-black text-orange-700 shadow-sm active:bg-orange-100">
                  ⭐ {link.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-7xl px-5 py-12">
        <section className="rounded-[2.5rem] bg-stone-950 p-8 text-white shadow-2xl shadow-orange-100 md:p-12">
          <p className="text-sm font-black tracking-[0.3em] text-orange-300">DAEJEON BREAD BUS</p>
          <h2 className="mt-4 text-4xl font-black leading-tight md:text-6xl">달력으로 선택하고<br />대전 빵버스를 예약하세요.</h2>
          <p className="mt-6 max-w-2xl text-base font-bold leading-7 text-stone-300">날짜별 모집현황, 잔여좌석, 예약마감 상태를 한 번에 확인할 수 있는 실제 운영형 예약 플랫폼 구조입니다.</p>
        </section>

        <section className="mt-10">
          <CustomerScheduleSection selectedDate={selectedDate} scheduleDetail={selectedScheduleDetail} scheduleStatus={selectedScheduleStatus} />
          <TwoMonthCalendar currentDate={new Date(2026, 5, 1)} dateSettings={managedDateSettings} getRemainingSeats={remaining} selectedDate={selectedDate} onSelectDate={handleSelectDate} />
        </section>

        <section className="mt-10">
          <ReservationPanel
            selectedDate={selectedDate} remainingSeats={remaining(selectedDate)} price={selectedPrice}
            form={reservationForm} onChange={handleFormChange} onSubmit={handleSubmit}
            notice={notice} reservationSuccessNotice={reservationSuccessNotice}
            isSubmitting={false}
            onOpenPrivacyPolicy={() => setActivePolicyModal("privacy")}
          />
        </section>

        <section className="mt-10 rounded-[2rem] border border-orange-200 bg-white p-6 shadow-xl shadow-orange-100/60 md:p-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-black tracking-[0.2em] text-orange-700">BOOKING GUIDE</p>
              <h3 className="mt-2 text-3xl font-black text-stone-950">예약 전 꼭 확인해주세요</h3>
            </div>
            <p className="max-w-xl text-sm font-bold leading-6 text-stone-600">결제 완료 즉시 예약이 확정됩니다.</p>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl border border-orange-200 bg-orange-50 p-5"><p className="text-sm font-black text-orange-800">예약 절차</p><p className="mt-3 text-sm font-bold leading-6 text-stone-700">날짜 선택 후 휴대폰 인증과 예약 정보를 입력하면 결제창이 열립니다.</p></div>
            <div className="rounded-3xl border border-orange-200 bg-orange-50 p-5"><p className="text-sm font-black text-orange-800">결제 안내</p><p className="mt-3 text-sm font-bold leading-6 text-stone-700">신용카드·체크카드·카카오페이·네이버페이·토스페이로 결제하실 수 있습니다.</p></div>
            <div className="rounded-3xl border border-orange-200 bg-orange-50 p-5"><p className="text-sm font-black text-orange-800">확정 기준</p><p className="mt-3 text-sm font-bold leading-6 text-stone-700">결제 완료 즉시 예약확정 문자가 발송되며, 그때 최종 예약이 완료됩니다.</p></div>
            <div className="rounded-3xl border border-orange-200 bg-orange-50 p-5"><p className="text-sm font-black text-orange-800">출발 안내</p><p className="mt-3 text-sm font-bold leading-6 text-stone-700">출발 장소와 시간은 예약 확정 후 문자로 개별 안내드립니다.</p></div>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-red-100 bg-red-50 p-5"><p className="text-sm font-black text-red-700">취소 및 환불 안내</p><ul className="mt-3 space-y-2 text-sm font-bold leading-6 text-stone-700"><li>출발 5일 전까지 취소 시 전액 환불됩니다.</li><li>출발 3~4일 전 취소 시 결제 금액의 50%가 환불됩니다.</li><li>출발 1~2일 전 및 당일 취소는 환불이 어렵습니다.</li><li>운영사 사정으로 취소될 경우 전액 환불됩니다.</li></ul></div>
            <div className="rounded-3xl border border-green-100 bg-green-50 p-5"><p className="text-sm font-black text-green-700">운영 안내</p><ul className="mt-3 space-y-2 text-sm font-bold leading-6 text-stone-700"><li>최소 출발 인원 미달 시 일정이 조정되거나 취소될 수 있습니다.</li><li>예약 변경은 잔여 좌석이 있는 경우에 한해 가능합니다.</li><li>문의가 필요한 경우 예약자 연락처로 안내드립니다.</li><li>예약 상태 변경 시 안내 문자가 자동 발송됩니다.</li></ul></div>
          </div>
        </section>

        {!isAdminPage ? (
          <footer className="mt-12 rounded-[2rem] border border-orange-100 bg-white/95 px-5 py-6 text-xs font-bold leading-6 text-stone-600 shadow-sm md:px-8">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-stone-800">
              <span className="font-black text-stone-950">소망투어</span><span className="text-stone-300">|</span>
              <span>대전빵버스 빵셔틀</span><span className="text-stone-300">|</span>
              <a href="tel:01045606701" className="font-black text-stone-800 underline decoration-orange-300 underline-offset-4">대표전화 010-4560-6701</a>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1"><span>사업자등록번호 781-69-00237</span><span>통신판매업 신고번호 2020-대전서구-0689</span></div>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
              <span>주소 대전광역시 서구 청사서로 29</span>
              <a href="mailto:ehgus0718@naver.com" className="text-stone-600 underline decoration-stone-300 underline-offset-4">이메일 ehgus0718@naver.com</a>
              <span>운영시간 09:00 ~ 18:00 (연중무휴)</span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
              <button type="button" onClick={() => setActivePolicyModal("terms")} className="font-black text-orange-700 underline decoration-orange-300 underline-offset-4">이용약관</button>
              <span className="text-stone-300">|</span>
              <button type="button" onClick={() => setActivePolicyModal("privacy")} className="font-black text-orange-700 underline decoration-orange-300 underline-offset-4">개인정보처리방침</button>
              <span className="text-stone-400">예약 관련 문의는 운영시간 내 순차적으로 안내됩니다.</span>
            </div>
            <p className="mt-3 text-[11px] font-black text-stone-400">Copyright © 소망투어. All rights reserved.</p>
          </footer>
        ) : null}

        {isAdminPage && isAdminAuthed ? (
          <AdminDashboard
            reservations={visibleAdminReservations}
            capacityOverrides={capacityOverrides} priceOverrides={priceOverrides}
            scheduleStatus={scheduleStatus} scheduleDetails={scheduleDetails}
            selectedDate={selectedDate} isRefreshingReservations={isRefreshingReservations}
            isQuickReservationView={isQuickReservationView} quickReservationLimit={ADMIN_QUICK_REFRESH_LIMIT}
            recentChangedReservationId={recentChangedReservationId} operationNotice={operationNotice}
            headerLinks={headerLinks} boardingTime={boardingTime}
            onRefreshReservations={handleRefreshReservations}
            onClearQuickReservations={handleClearQuickReservations}
            onChangeReservationStatus={handleReservationStatusChange}
            onRemoveReservation={handleRemoveReservation}
            onChangeCapacity={handleCapacityChange} onChangePrice={handlePriceChange}
            onChangeScheduleStatus={handleScheduleStatusChange}
            onChangeScheduleDetail={handleScheduleDetailChange}
            onRemoveScheduleDetail={handleRemoveScheduleDetail}
            onRemoveDateSettings={handleRemoveDateSettings}
            onSaveReservationNote={handleSaveReservationNote}
            onClearReservationNote={handleClearReservationNote}
            onUpdateHeaderLinks={handleUpdateHeaderLinks}
            onUpdateBoardingTime={handleUpdateBoardingTime}
          />
        ) : isAdminPage ? (
          <AdminLogin password={adminPassword} error={adminError} onChangePassword={setAdminPassword} onSubmit={handleAdminLogin} />
        ) : null}
      </main>

      <PolicyModal type={activePolicyModal} onClose={() => setActivePolicyModal(null)} />
    </div>
  );
}
