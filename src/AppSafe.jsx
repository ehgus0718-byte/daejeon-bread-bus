import React, { useEffect, useMemo, useState } from "react";
import TwoMonthCalendar from "./components/TwoMonthCalendar.jsx";
import ReservationPanel from "./components/ReservationPanel.jsx";
import ReservationList from "./components/ReservationList.jsx";
import AdminLogin from "./components/AdminLogin.jsx";
import AdminDashboard from "./components/AdminDashboard.jsx";
import CustomerScheduleSection from "./components/CustomerScheduleSection.jsx";
import { buildDateSettings } from "./core/dateSettingsBuilder.js";
import { validateAdminPassword } from "./core/adminPasswordValidation.js";
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
import { reservationRepository } from "./repositories/index.js";
import {
  getReservationRepositoryMode,
  REPOSITORY_MODE
} from "./repositories/reservationRepositoryMode.js";

const ADMIN_ACCESS_CODE = import.meta.env.VITE_ADMIN_ACCESS_CODE || "breadbus2026";
const ADMIN_SESSION_KEY = "daejeon-bread-bus-admin-authed";
const ADMIN_QUICK_REFRESH_LIMIT = 100;
const RESERVATION_REPOSITORY_MODE = getReservationRepositoryMode();
const USES_REMOTE_RESERVATION_STORAGE =
  RESERVATION_REPOSITORY_MODE !== REPOSITORY_MODE.LOCAL;
const RESERVATION_RECEIVED_NOTICE =
  "예약이 접수되었습니다. 관리자가 연락처 확인 후 결제 계좌를 안내드리며, 입금 확인 후 예약이 확정됩니다.";

function getErrorMessage(error) {
  return error?.message || String(error || "알 수 없는 오류");
}

function getInitialReservations() {
  return USES_REMOTE_RESERVATION_STORAGE ? [] : INITIAL_RESERVATIONS;
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

function getInitialAdminAuthState() {
  if (typeof window === "undefined") return false;

  try {
    return window.sessionStorage.getItem(ADMIN_SESSION_KEY) === "true";
  } catch (error) {
    console.warn("Admin session read failed", error);
    return false;
  }
}

function saveAdminSession() {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
  } catch (error) {
    console.warn("Admin session save failed", error);
  }
}

function clearAdminSession() {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
  } catch (error) {
    console.warn("Admin session clear failed", error);
  }
}

function toSafeAdminNote(note = "") {
  return String(note || "").trim();
}

function getReservationId(reservation = {}) {
  return reservation?.id || reservation?.reservationId || null;
}

function normalizeReservationArray(reservations = []) {
  return Array.isArray(reservations) ? reservations.filter(Boolean) : [];
}

function mergeReservationsById(currentReservations = [], incomingReservations = []) {
  const currentList = normalizeReservationArray(currentReservations);
  const incomingList = normalizeReservationArray(incomingReservations);

  if (incomingList.length === 0) return currentList;

  const incomingIds = new Set(
    incomingList.map(getReservationId).filter(Boolean)
  );

  const remainingCurrent = currentList.filter((reservation) => {
    const reservationId = getReservationId(reservation);
    return !reservationId || !incomingIds.has(reservationId);
  });

  return [...incomingList, ...remainingCurrent];
}

function updateReservationAdminNote({ reservations = [], reservationId, note = "" }) {
  const safeNote = toSafeAdminNote(note);

  return reservations.map((reservation) => {
    if (reservation.id !== reservationId) return reservation;

    return {
      ...reservation,
      adminNote: safeNote,
      noteUpdatedAt: new Date().toISOString()
    };
  });
}

function normalizeAdminSettings(settings = {}) {
  return {
    capacityOverrides: settings.capacityOverrides || {},
    priceOverrides: settings.priceOverrides || {},
    scheduleStatus: settings.scheduleStatus || {},
    scheduleDetails: settings.scheduleDetails || {}
  };
}

function removeDateKey(settings = {}, date) {
  const nextSettings = { ...settings };
  delete nextSettings[date];
  return nextSettings;
}

function updateScheduleDetail(settings = {}, date, detail = "") {
  const safeDetail = String(detail || "").trim();

  if (!safeDetail) {
    return removeDateKey(settings, date);
  }

  return {
    ...settings,
    [date]: safeDetail
  };
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
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-stone-100 px-4 py-2 text-sm font-black text-stone-700"
          >
            닫기
          </button>
        </div>

        {isPrivacy ? (
          <div className="mt-5 space-y-4 text-sm font-bold leading-7 text-stone-700">
            <p>소망투어는 대전빵셔틀 빵버스 예약 확인과 고객 안내를 위해 필요한 최소한의 개인정보를 수집합니다.</p>
            <p><strong>수집 항목:</strong> 예약자명, 연락처, 예약일, 예약 인원, 예약 상태</p>
            <p><strong>이용 목적:</strong> 예약 접수 확인, 결제 계좌 안내, 예약확정·취소 문자 발송, 고객 문의 응대</p>
            <p><strong>보관 기간:</strong> 예약 처리와 고객 응대 목적 달성 후 관련 법령에 따라 필요한 기간 동안 보관할 수 있습니다.</p>
            <p><strong>제3자 제공:</strong> 법령에 따른 경우를 제외하고 고객 동의 없이 개인정보를 외부에 제공하지 않습니다. 단, 문자 발송 등 예약 안내에 필요한 범위에서는 위탁 처리가 이루어질 수 있습니다.</p>
            <p><strong>문의:</strong> 개인정보 관련 문의는 대표전화 010-6422-9352로 연락해 주세요.</p>
          </div>
        ) : (
          <div className="mt-5 space-y-4 text-sm font-bold leading-7 text-stone-700">
            <p>본 약관은 소망투어가 운영하는 대전빵셔틀 빵버스 예약 서비스 이용에 관한 기본 사항을 안내합니다.</p>
            <p><strong>예약 접수:</strong> 고객은 날짜 선택, 휴대폰 인증, 예약 정보 입력을 통해 예약을 접수할 수 있습니다.</p>
            <p><strong>예약 확정:</strong> 예약은 접수 즉시 확정되지 않으며, 담당자 확인과 입금 확인 후 예약확정 문자가 발송된 시점에 최종 확정됩니다.</p>
            <p><strong>결제 안내:</strong> 예약 접수 후 담당자가 연락처와 예약 내용을 확인한 뒤 문자로 결제 계좌를 안내드립니다.</p>
            <p><strong>취소 및 환불:</strong> 출발 5일 전까지는 전액 환불, 출발 3~4일 전은 50% 환불, 출발 1~2일 전 및 당일 취소는 환불이 어려울 수 있습니다. 운영사 사정으로 취소될 경우 전액 환불됩니다.</p>
            <p><strong>운영 변경:</strong> 최소 출발 인원 미달, 기상 악화, 차량 사정 등으로 일정이 변경 또는 취소될 수 있습니다.</p>
            <p><strong>문의:</strong> 예약 및 이용 문의는 대표전화 010-6422-9352로 연락해 주세요.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AppSafe() {
  const savedAdminSettings = useMemo(
    () => loadAdminSettings(INITIAL_ADMIN_SETTINGS),
    []
  );

  const [selectedDate, setSelectedDate] = useState(getInitialSelectedDate);
  const [reservationForm, setReservationForm] = useState(
    DEFAULT_RESERVATION_FORM
  );
  const [reservations, setReservations] = useState(getInitialReservations);
  const [adminReservations, setAdminReservations] = useState(null);
  const [recentChangedReservationId, setRecentChangedReservationId] = useState("");
  const [operationNotice, setOperationNotice] = useState("");
  const [capacityOverrides, setCapacityOverrides] = useState(
    savedAdminSettings.capacityOverrides
  );
  const [priceOverrides, setPriceOverrides] = useState(
    savedAdminSettings.priceOverrides
  );
  const [scheduleStatus, setScheduleStatus] = useState(
    savedAdminSettings.scheduleStatus
  );
  const [scheduleDetails, setScheduleDetails] = useState(
    savedAdminSettings.scheduleDetails || {}
  );
  const [notice, setNotice] = useState("");
  const [reservationSuccessNotice, setReservationSuccessNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshingReservations, setIsRefreshingReservations] = useState(false);
  const [isAdminAuthed, setIsAdminAuthed] = useState(getInitialAdminAuthState);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");
  const [isAdminSettingsReady, setIsAdminSettingsReady] = useState(
    !USES_REMOTE_RESERVATION_STORAGE
  );
  const [activePolicyModal, setActivePolicyModal] = useState(null);

  const isAdminPage =
    typeof window !== "undefined" && window.location.pathname.startsWith("/admin");

  useEffect(() => {
    let isMounted = true;

    async function loadStoredReservations() {
      const result = await reservationRepository.list();

      if (!isMounted) return;

      if (!result.ok) {
        setNotice(`예약 데이터를 불러오지 못했습니다. ${getErrorMessage(result.error)}`);
        setOperationNotice(`예약 데이터를 불러오지 못했습니다. ${getErrorMessage(result.error)}`);
        if (USES_REMOTE_RESERVATION_STORAGE) setReservations([]);
        return;
      }

      if (Array.isArray(result.data)) {
        if (USES_REMOTE_RESERVATION_STORAGE || result.data.length > 0) {
          setReservations(result.data);
          setAdminReservations(null);
        }
      }
    }

    loadStoredReservations();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadRemoteAdminSettings() {
      if (!USES_REMOTE_RESERVATION_STORAGE) {
        setIsAdminSettingsReady(true);
        return;
      }

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
      saveAdminSettings(nextSettings);
      setIsAdminSettingsReady(true);
    }

    loadRemoteAdminSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const nextSettings = {
      capacityOverrides,
      priceOverrides,
      scheduleStatus,
      scheduleDetails
    };

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

    return () => {
      isCancelled = true;
    };
  }, [capacityOverrides, priceOverrides, scheduleStatus, scheduleDetails, isAdminSettingsReady]);

  const managedDateSettings = useMemo(
    () =>
      buildDateSettings({
        capacityOverrides,
        priceOverrides,
        scheduleStatus,
        scheduleDetails
      }),
    [capacityOverrides, priceOverrides, scheduleStatus, scheduleDetails]
  );

  const visibleAdminReservations = adminReservations || reservations;
  const isQuickReservationView = Array.isArray(adminReservations);

  function clearQuickAdminReservations() {
    setAdminReservations(null);
  }

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
    return getRemainingSeats({
      reservations,
      dateSettings: managedDateSettings,
      date,
      fallbackCapacity: 15
    });
  }

  const selectedPrice = useMemo(() => {
    return Number(managedDateSettings[selectedDate]?.price || 30000);
  }, [managedDateSettings, selectedDate]);

  const selectedScheduleStatus = managedDateSettings[selectedDate]?.status || "closed";
  const selectedScheduleDetail = managedDateSettings[selectedDate]?.detail || "";

  function handleSelectDate(date) {
    setSelectedDate(date);
    setReservationSuccessNotice("");
  }

  function handleFormChange(key, value) {
    if (["name", "phone", "people", "adultCount", "childCount", "infantCount"].includes(key)) {
      setReservationSuccessNotice("");
    }

    setReservationForm((prev) => ({ ...prev, [key]: value }));
  }

  function resetForm() {
    setReservationForm(DEFAULT_RESERVATION_FORM);
  }

  function handleAdminLogin() {
    setAdminError("");

    const validation = validateAdminPassword({
      password: adminPassword,
      accessCode: ADMIN_ACCESS_CODE
    });

    if (!validation.valid) {
      setAdminError(validation.message);
      return;
    }

    saveAdminSession();
    setIsAdminAuthed(true);
    setAdminPassword("");
  }

  function handleAdminLogout() {
    clearAdminSession();
    setIsAdminAuthed(false);
    setAdminPassword("");
    setAdminError("");
  }

  function handleCapacityChange(date, nextCapacity) {
    setCapacityOverrides((prev) =>
      updateCapacityOverride({ capacityOverrides: prev, date, nextCapacity })
    );
  }

  function handlePriceChange(date, nextPrice) {
    setPriceOverrides((prev) =>
      updatePriceOverride({ priceOverrides: prev, nextPrice, date })
    );
  }

  function handleScheduleStatusChange(date, nextStatus) {
    setScheduleStatus((prev) =>
      updateScheduleStatus({ scheduleStatus: prev, date, nextStatus })
    );
  }

  function handleScheduleDetailChange(date, nextDetail) {
    if (!date) {
      setNotice("일정을 저장할 날짜를 찾지 못했습니다.");
      return;
    }

    setScheduleDetails((prev) => updateScheduleDetail(prev, date, nextDetail));
    setNotice("여행 일정이 저장되었습니다.");
  }

  function handleRemoveScheduleDetail(date) {
    if (!date) {
      setNotice("삭제할 일정 날짜를 찾지 못했습니다.");
      return;
    }

    setScheduleDetails((prev) => removeDateKey(prev, date));
    setNotice("선택한 날짜의 여행 일정이 삭제되었습니다.");
  }

  function handleRemoveDateSettings(date) {
    if (!date) {
      setNotice("삭제할 날짜를 찾지 못했습니다.");
      return;
    }

    setCapacityOverrides((prev) => removeDateKey(prev, date));
    setPriceOverrides((prev) => removeDateKey(prev, date));
    setScheduleStatus((prev) => removeDateKey(prev, date));
    setScheduleDetails((prev) => removeDateKey(prev, date));
    setNotice("선택한 날짜 설정이 삭제되었습니다.");
  }

  async function handleRefreshReservations() {
    if (isRefreshingReservations) return;

    setNotice("");
    setOperationNotice("");
    setIsRefreshingReservations(true);

    try {
      const result = await reservationRepository.list({ limit: ADMIN_QUICK_REFRESH_LIMIT });

      if (!result.ok) {
        const message = `예약 목록 새로고침에 실패했습니다. ${getErrorMessage(result.error)}`;
        setNotice(message);
        setOperationNotice(message);
        return;
      }

      if (Array.isArray(result.data)) {
        setAdminReservations(result.data);
        setOperationNotice(`최근 예약 ${result.data.length}건을 빠르게 불러왔습니다.`);
        setNotice(`최근 예약 ${result.data.length}건을 빠르게 불러왔습니다.`);
      }
    } catch (error) {
      console.warn("Reservation refresh failed", error);
      const message = `예약 목록 새로고침에 실패했습니다. ${getErrorMessage(error)}`;
      setNotice(message);
      setOperationNotice(message);
    } finally {
      setIsRefreshingReservations(false);
    }
  }

  async function handleReservationStatusChange(id, nextStatus) {
    setNotice("");
    setOperationNotice("예약 상태를 저장하는 중입니다...");
    clearQuickAdminReservations();

    const previousReservations = reservations;
    const nextReservations = updateReservationStatus({
      reservations,
      reservationId: id,
      nextStatus
    });

    setReservations(nextReservations);
    setRecentChangedReservationId(id || "");

    try {
      const result = await reservationRepository.update(id, { status: nextStatus });

      if (!result.ok) {
        const message = `예약 상태 저장에 실패했습니다. ${getErrorMessage(result.error)}`;
        setReservations(previousReservations);
        setNotice(message);
        setOperationNotice(message);
        return;
      }

      let savedReservations = [];

      if (Array.isArray(result.data) && result.data.length > 0) {
        savedReservations = result.data;
        setReservations((currentReservations) =>
          mergeReservationsById(currentReservations, result.data)
        );
      }

      const smsReservation =
        savedReservations[0] ||
        nextReservations.find((reservation) => getReservationId(reservation) === id) ||
        previousReservations.find((reservation) => getReservationId(reservation) === id) ||
        { id, status: nextStatus };

      if (!shouldSendReservationStatusSms(nextStatus)) {
        markReservationChanged(id, "예약 상태가 저장되었습니다.");
        return;
      }

      const smsResult = await sendReservationStatusSms({
        reservation: { ...smsReservation, status: nextStatus },
        status: nextStatus
      });

      if (smsResult.ok && !smsResult.skipped) {
        markReservationChanged(id, "예약 상태가 저장되었고 안내 문자가 발송되었습니다.");
        return;
      }

      const smsErrorMessage = smsResult.error ? ` ${getErrorMessage(smsResult.error)}` : "";
      markReservationChanged(id, `예약 상태는 저장되었지만 안내 문자 발송에 실패했습니다.${smsErrorMessage}`);
    } catch (error) {
      console.warn("Reservation status update failed", error);
      const message = `예약 상태 저장에 실패했습니다. ${getErrorMessage(error)}`;
      setReservations(previousReservations);
      setNotice(message);
      setOperationNotice(message);
    }
  }

  async function handleSaveReservationNote(id, note = "") {
    setNotice("");
    setOperationNotice("관리자 메모를 저장하는 중입니다...");
    clearQuickAdminReservations();

    if (!id) {
      const message = "메모를 저장할 예약을 찾지 못했습니다.";
      setNotice(message);
      setOperationNotice(message);
      return false;
    }

    const safeNote = toSafeAdminNote(note);
    const previousReservations = reservations;
    const nextReservations = updateReservationAdminNote({
      reservations,
      reservationId: id,
      note: safeNote
    });

    setReservations(nextReservations);
    setRecentChangedReservationId(id || "");

    try {
      const result = await reservationRepository.update(id, { adminNote: safeNote });

      if (!result.ok) {
        const message = `관리자 메모 저장에 실패했습니다. ${getErrorMessage(result.error)}`;
        setReservations(previousReservations);
        setNotice(message);
        setOperationNotice(message);
        return false;
      }

      if (Array.isArray(result.data) && result.data.length > 0) {
        setReservations((currentReservations) =>
          mergeReservationsById(currentReservations, result.data)
        );
      }

      markReservationChanged(id, "관리자 메모가 저장되었습니다.");
      setNotice("관리자 메모가 저장되었습니다.");
      return true;
    } catch (error) {
      console.warn("Reservation note save failed", error);
      const message = `관리자 메모 저장에 실패했습니다. ${getErrorMessage(error)}`;
      setReservations(previousReservations);
      setNotice(message);
      setOperationNotice(message);
      return false;
    }
  }

  async function handleClearReservationNote(id) {
    return handleSaveReservationNote(id, "");
  }

  async function handleRemoveReservation(id) {
    setNotice("");
    setOperationNotice("예약을 삭제하는 중입니다...");
    clearQuickAdminReservations();

    if (!id) {
      const message = "삭제할 예약을 찾지 못했습니다.";
      setNotice(message);
      setOperationNotice(message);
      return;
    }

    if (typeof window !== "undefined" && !window.confirm("선택한 예약을 삭제하시겠습니까?")) {
      setOperationNotice("");
      return;
    }

    const previousReservations = reservations;
    const nextReservations = reservations.filter((reservation) => reservation.id !== id);

    setReservations(nextReservations);
    setRecentChangedReservationId("");

    try {
      const result = await reservationRepository.remove(id);

      if (!result.ok) {
        const message = `예약 삭제에 실패했습니다. ${getErrorMessage(result.error)}`;
        setReservations(previousReservations);
        setNotice(message);
        setOperationNotice(message);
        return;
      }

      setNotice("예약이 삭제되었습니다.");
      setOperationNotice("예약이 삭제되었습니다.");
    } catch (error) {
      console.warn("Reservation remove failed", error);
      const message = `예약 삭제에 실패했습니다. ${getErrorMessage(error)}`;
      setReservations(previousReservations);
      setNotice(message);
      setOperationNotice(message);
    }
  }

  async function handleSubmit() {
    setNotice("");
    setReservationSuccessNotice("");
    setOperationNotice("");
    clearQuickAdminReservations();

    const remainingSeats = remaining(selectedDate);
    const validation = validateReservationForm({
      selectedDate,
      scheduleStatus: selectedScheduleStatus,
      form: reservationForm,
      remainingSeats
    });

    if (!validation.valid) {
      setNotice(validation.message);
      return;
    }

    setIsSubmitting(true);

    try {
      const reservationItem = createReservation({
        selectedDate,
        form: reservationForm,
        price: selectedPrice,
        status: "결제대기"
      });

      const result = await reservationRepository.add(reservationItem);

      if (!result.ok) {
        setNotice(`예약 저장 중 오류가 발생했습니다. ${getErrorMessage(result.error)}`);
        return;
      }

      const createdReservations = Array.isArray(result.data) && result.data.length > 0
        ? result.data
        : [reservationItem];

      setReservations((currentReservations) =>
        mergeReservationsById(currentReservations, createdReservations)
      );
      setRecentChangedReservationId(getReservationId(createdReservations[0]) || "");
setOperationNotice("신규 예약이 접수되었습니다.");
setReservationSuccessNotice(RESERVATION_RECEIVED_NOTICE);

const adminSmsResult = await sendReservationStatusSms({
  reservation: {
    ...createdReservations[0],
    phone: "01064229352"
  },
  status: "예약접수"
});

if (!adminSmsResult.ok) {
  console.warn("관리자 신규 예약 알림 문자 발송 실패", adminSmsResult.error);
}

resetForm();
    } catch (error) {
      console.warn("Reservation submit failed", error);
      setNotice(`예약 저장 중 오류가 발생했습니다. ${getErrorMessage(error)}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#fff8ef] text-stone-950">
      <header className="border-b border-orange-100 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500 text-2xl text-white shadow-lg shadow-orange-200">
              🚌
            </div>
            <div>
              <h1 className="text-xl font-black">대전빵셔틀 빵버스</h1>
              <p className="text-xs font-bold text-stone-500">2026 Reservation Platform</p>
            </div>
          </div>

          {isAdminAuthed ? (
            <button
              type="button"
              onClick={handleAdminLogout}
              className="rounded-full bg-stone-950 px-4 py-2 text-xs font-black text-white"
            >
              관리자 로그아웃
            </button>
          ) : null}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-12">
        <section className="rounded-[2.5rem] bg-stone-950 p-8 text-white shadow-2xl shadow-orange-100 md:p-12">
          <p className="text-sm font-black tracking-[0.3em] text-orange-300">DAEJEON BREAD BUS</p>
          <h2 className="mt-4 text-4xl font-black leading-tight md:text-6xl">
            달력으로 선택하고
            <br />
            대전 빵버스를 예약하세요.
          </h2>
          <p className="mt-6 max-w-2xl text-base font-bold leading-7 text-stone-300">
            날짜별 모집현황, 잔여좌석, 예약마감 상태를 한 번에 확인할 수 있는
            실제 운영형 예약 플랫폼 구조입니다.
          </p>
        </section>

        <section className="mt-10">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-black text-orange-600">Reservation Calendar</p>
              <h3 className="text-3xl font-black">2개월 예약 달력</h3>
            </div>
            <div className="rounded-full bg-white px-4 py-3 text-sm font-black shadow-sm">
              예약 가능한 날짜를 선택한 뒤 정보를 입력해주세요
            </div>
          </div>

          <CustomerScheduleSection
            selectedDate={selectedDate}
            scheduleDetail={selectedScheduleDetail}
            scheduleStatus={selectedScheduleStatus}
          />

          <TwoMonthCalendar
            currentDate={new Date(2026, 5, 1)}
            dateSettings={managedDateSettings}
            getRemainingSeats={remaining}
            selectedDate={selectedDate}
            onSelectDate={handleSelectDate}
          />
        </section>

        <section className="mt-10">
          <ReservationPanel
            selectedDate={selectedDate}
            remainingSeats={remaining(selectedDate)}
            price={selectedPrice}
            form={reservationForm}
            onChange={handleFormChange}
            onSubmit={handleSubmit}
            notice={notice}
            reservationSuccessNotice={reservationSuccessNotice}
            isSubmitting={isSubmitting}
          />
        </section>

        <section className="mt-10 rounded-[2rem] border border-orange-200 bg-white p-6 shadow-xl shadow-orange-100/60 md:p-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-black tracking-[0.2em] text-orange-700">BOOKING GUIDE</p>
              <h3 className="mt-2 text-3xl font-black text-stone-950">예약 전 꼭 확인해주세요</h3>
            </div>
            <p className="max-w-xl text-sm font-bold leading-6 text-stone-600">
              예약은 접수 후 바로 확정되는 방식이 아니며, 담당자 확인과 입금 확인 후 최종 확정됩니다.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl border border-orange-200 bg-orange-50 p-5">
              <p className="text-sm font-black text-orange-800">예약 절차</p>
              <p className="mt-3 text-sm font-bold leading-6 text-stone-700">
                날짜 선택 후 휴대폰 인증과 예약 정보를 입력하면 예약이 접수됩니다.
              </p>
            </div>
            <div className="rounded-3xl border border-orange-200 bg-orange-50 p-5">
              <p className="text-sm font-black text-orange-800">결제 안내</p>
              <p className="mt-3 text-sm font-bold leading-6 text-stone-700">
                담당자가 연락처와 예약 내용을 확인한 뒤 문자로 결제 계좌를 안내드립니다.
              </p>
            </div>
            <div className="rounded-3xl border border-orange-200 bg-orange-50 p-5">
              <p className="text-sm font-black text-orange-800">확정 기준</p>
              <p className="mt-3 text-sm font-bold leading-6 text-stone-700">
                입금 확인 후 예약확정 문자가 발송되며, 그때 최종 예약이 완료됩니다.
              </p>
            </div>
            <div className="rounded-3xl border border-orange-200 bg-orange-50 p-5">
              <p className="text-sm font-black text-orange-800">출발 안내</p>
              <p className="mt-3 text-sm font-bold leading-6 text-stone-700">
                출발 장소와 시간은 예약 확정 후 문자로 개별 안내드립니다.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-red-100 bg-red-50 p-5">
              <p className="text-sm font-black text-red-700">취소 및 환불 안내</p>
              <ul className="mt-3 space-y-2 text-sm font-bold leading-6 text-stone-700">
                <li>출발 5일 전까지 취소 시 전액 환불됩니다.</li>
                <li>출발 3~4일 전 취소 시 결제 금액의 50%가 환불됩니다.</li>
                <li>출발 1~2일 전 및 당일 취소는 환불이 어렵습니다.</li>
                <li>운영사 사정으로 취소될 경우 전액 환불됩니다.</li>
              </ul>
            </div>
            <div className="rounded-3xl border border-green-100 bg-green-50 p-5">
              <p className="text-sm font-black text-green-700">운영 안내</p>
              <ul className="mt-3 space-y-2 text-sm font-bold leading-6 text-stone-700">
                <li>최소 출발 인원 미달 시 일정이 조정되거나 취소될 수 있습니다.</li>
                <li>예약 변경은 잔여 좌석이 있는 경우에 한해 가능합니다.</li>
                <li>문의가 필요한 경우 예약자 연락처로 안내드립니다.</li>
                <li>예약 상태 변경 시 안내 문자가 자동 발송됩니다.</li>
              </ul>
            </div>
          </div>
        </section>

        {!isAdminPage ? (
          <section className="mt-10">
            <ReservationList reservations={reservations} />
          </section>
        ) : null}

        {!isAdminPage ? (
          <footer className="mt-12 rounded-[2rem] border border-orange-100 bg-white/95 px-5 py-6 text-xs font-bold leading-6 text-stone-600 shadow-sm md:px-8">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-stone-800">
              <span className="font-black text-stone-950">소망투어</span>
              <span className="text-stone-300">|</span>
              <span>대전빵버스 빵셔틀</span>
              <span className="text-stone-300">|</span>
              <span>대표전화 010-6422-9352</span>
            </div>

            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              <span>사업자등록번호 781-69-00237</span>
              <span>통신판매업 신고번호 2020-대전서구-0689</span>
            </div>

            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
              <span>주소 대전광역시 서구 청사서로 29</span>
              <span>운영시간 09:00 ~ 18:00 (연중무휴)</span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
              <button
                type="button"
                onClick={() => setActivePolicyModal("terms")}
                className="font-black text-orange-700 underline decoration-orange-300 underline-offset-4"
              >
                이용약관
              </button>
              <span className="text-stone-300">|</span>
              <button
                type="button"
                onClick={() => setActivePolicyModal("privacy")}
                className="font-black text-orange-700 underline decoration-orange-300 underline-offset-4"
              >
                개인정보처리방침
              </button>
              <span className="text-stone-400">예약 관련 문의는 운영시간 내 순차적으로 안내됩니다.</span>
            </div>

            <p className="mt-3 text-[11px] font-black text-stone-400">
              Copyright © 소망투어. All rights reserved.
            </p>
          </footer>
        ) : null}

        {isAdminPage && isAdminAuthed ? (
          <AdminDashboard
            reservations={visibleAdminReservations}
            capacityOverrides={capacityOverrides}
            priceOverrides={priceOverrides}
            scheduleStatus={scheduleStatus}
            scheduleDetails={scheduleDetails}
            selectedDate={selectedDate}
            isRefreshingReservations={isRefreshingReservations}
            isQuickReservationView={isQuickReservationView}
            quickReservationLimit={ADMIN_QUICK_REFRESH_LIMIT}
            recentChangedReservationId={recentChangedReservationId}
            operationNotice={operationNotice}
            onRefreshReservations={handleRefreshReservations}
            onClearQuickReservations={handleClearQuickReservations}
            onChangeReservationStatus={handleReservationStatusChange}
            onRemoveReservation={handleRemoveReservation}
            onChangeCapacity={handleCapacityChange}
            onChangePrice={handlePriceChange}
            onChangeScheduleStatus={handleScheduleStatusChange}
            onChangeScheduleDetail={handleScheduleDetailChange}
            onRemoveScheduleDetail={handleRemoveScheduleDetail}
            onRemoveDateSettings={handleRemoveDateSettings}
            onSaveReservationNote={handleSaveReservationNote}
            onClearReservationNote={handleClearReservationNote}
          />
        ) : isAdminPage ? (
          <AdminLogin
            password={adminPassword}
            error={adminError}
            onChangePassword={setAdminPassword}
            onSubmit={handleAdminLogin}
          />
        ) : null}
      </main>

      <PolicyModal
        type={activePolicyModal}
        onClose={() => setActivePolicyModal(null)}
      />
    </div>
  );
}
