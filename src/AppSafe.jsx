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

function getErrorMessage(error) {
  return error?.message || String(error || "알 수 없는 오류");
}

function getInitialReservations() {
  return USES_REMOTE_RESERVATION_STORAGE ? [] : INITIAL_RESERVATIONS;
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

export default function AppSafe() {
  const savedAdminSettings = useMemo(
    () => loadAdminSettings(INITIAL_ADMIN_SETTINGS),
    []
  );

  const [selectedDate, setSelectedDate] = useState("2026-05-30");
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshingReservations, setIsRefreshingReservations] = useState(false);
  const [isAdminAuthed, setIsAdminAuthed] = useState(getInitialAdminAuthState);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");
  const [isAdminSettingsReady, setIsAdminSettingsReady] = useState(
    !USES_REMOTE_RESERVATION_STORAGE
  );

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

  function handleFormChange(key, value) {
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

      if (Array.isArray(result.data) && result.data.length > 0) {
        setReservations((currentReservations) =>
          mergeReservationsById(currentReservations, result.data)
        );
      }

      markReservationChanged(id, "예약 상태가 저장되었습니다.");
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
      setNotice("예약이 저장되었습니다. 결제를 진행해주세요.");
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
              관리자에서 날짜별 정원·가격·상태 수정 가능
            </div>
          </div>

          <CustomerScheduleSection
            selectedDate={selectedDate}
            scheduleDetail={selectedScheduleDetail}
            scheduleStatus={selectedScheduleStatus}
          />

          <TwoMonthCalendar
            currentDate={new Date(2026, 4, 1)}
            dateSettings={managedDateSettings}
            getRemainingSeats={remaining}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
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
            isSubmitting={isSubmitting}
          />
        </section>

        <section className="mt-10">
          <ReservationList reservations={reservations} />
        </section>

        {isAdminAuthed ? (
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
        ) : (
          <AdminLogin
            password={adminPassword}
            error={adminError}
            onChangePassword={setAdminPassword}
            onSubmit={handleAdminLogin}
          />
        )}
      </main>
    </div>
  );
}
