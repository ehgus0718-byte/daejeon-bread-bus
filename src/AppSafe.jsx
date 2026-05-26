import React, { useEffect, useMemo, useState } from "react";
import TwoMonthCalendar from "./components/TwoMonthCalendar.jsx";
import ReservationPanel from "./components/ReservationPanel.jsx";
import ReservationList from "./components/ReservationList.jsx";
import AdminLogin from "./components/AdminLogin.jsx";
import AdminDashboard from "./components/AdminDashboard.jsx";
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
import { reservationRepository } from "./repositories/index.js";
import {
  getReservationRepositoryMode,
  REPOSITORY_MODE
} from "./repositories/reservationRepositoryMode.js";

const ADMIN_ACCESS_CODE = import.meta.env.VITE_ADMIN_ACCESS_CODE || "breadbus2026";
const RESERVATION_REPOSITORY_MODE = getReservationRepositoryMode();
const USES_REMOTE_RESERVATION_STORAGE =
  RESERVATION_REPOSITORY_MODE !== REPOSITORY_MODE.LOCAL;

function getErrorMessage(error) {
  return error?.message || String(error || "알 수 없는 오류");
}

function getInitialReservations() {
  return USES_REMOTE_RESERVATION_STORAGE ? [] : INITIAL_RESERVATIONS;
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
  const [capacityOverrides, setCapacityOverrides] = useState(
    savedAdminSettings.capacityOverrides
  );
  const [priceOverrides, setPriceOverrides] = useState(
    savedAdminSettings.priceOverrides
  );
  const [scheduleStatus, setScheduleStatus] = useState(
    savedAdminSettings.scheduleStatus
  );
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdminAuthed, setIsAdminAuthed] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadStoredReservations() {
      const result = await reservationRepository.list();

      if (!isMounted) {
        return;
      }

      if (!result.ok) {
        setNotice(`예약 데이터를 불러오지 못했습니다. ${getErrorMessage(result.error)}`);
        if (USES_REMOTE_RESERVATION_STORAGE) {
          setReservations([]);
        }
        return;
      }

      if (Array.isArray(result.data)) {
        if (USES_REMOTE_RESERVATION_STORAGE || result.data.length > 0) {
          setReservations(result.data);
        }
      }
    }

    loadStoredReservations();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    saveAdminSettings({
      capacityOverrides,
      priceOverrides,
      scheduleStatus
    });
  }, [capacityOverrides, priceOverrides, scheduleStatus]);

  const managedDateSettings = useMemo(
    () =>
      buildDateSettings({
        capacityOverrides,
        priceOverrides,
        scheduleStatus
      }),
    [capacityOverrides, priceOverrides, scheduleStatus]
  );

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

  function handleFormChange(key, value) {
    setReservationForm((prev) => ({
      ...prev,
      [key]: value
    }));
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

    setIsAdminAuthed(true);
    setAdminPassword("");
  }

  function handleAdminLogout() {
    setIsAdminAuthed(false);
    setAdminPassword("");
    setAdminError("");
  }

  function handleCapacityChange(date, nextCapacity) {
    setCapacityOverrides((prev) =>
      updateCapacityOverride({
        capacityOverrides: prev,
        date,
        nextCapacity
      })
    );
  }

  function handlePriceChange(date, nextPrice) {
    setPriceOverrides((prev) =>
      updatePriceOverride({
        priceOverrides: prev,
        nextPrice,
        date
      })
    );
  }

  function handleScheduleStatusChange(date, nextStatus) {
    setScheduleStatus((prev) =>
      updateScheduleStatus({
        scheduleStatus: prev,
        date,
        nextStatus
      })
    );
  }

  async function handleReservationStatusChange(id, nextStatus) {
    setNotice("");

    const previousReservations = reservations;
    const nextReservations = updateReservationStatus({
      reservations,
      reservationId: id,
      nextStatus
    });

    setReservations(nextReservations);

    try {
      const result = await reservationRepository.update(id, {
        status: nextStatus
      });

      if (!result.ok) {
        setReservations(previousReservations);
        setNotice(`예약 상태 저장에 실패했습니다. ${getErrorMessage(result.error)}`);
        return;
      }

      if (Array.isArray(result.data)) {
        setReservations(result.data);
      }
    } catch (error) {
      console.warn("Reservation status update failed", error);
      setReservations(previousReservations);
      setNotice(`예약 상태 저장에 실패했습니다. ${getErrorMessage(error)}`);
    }
  }

  async function handleRemoveReservation(id) {
    setNotice("");

    if (!id) {
      setNotice("삭제할 예약을 찾지 못했습니다.");
      return;
    }

    if (
      typeof window !== "undefined" &&
      !window.confirm("선택한 예약을 삭제하시겠습니까?")
    ) {
      return;
    }

    const previousReservations = reservations;
    const nextReservations = reservations.filter(
      (reservation) => reservation.id !== id
    );

    setReservations(nextReservations);

    try {
      const result = await reservationRepository.remove(id);

      if (!result.ok) {
        setReservations(previousReservations);
        setNotice(`예약 삭제에 실패했습니다. ${getErrorMessage(result.error)}`);
        return;
      }

      if (Array.isArray(result.data)) {
        setReservations(result.data);
      }

      setNotice("예약이 삭제되었습니다.");
    } catch (error) {
      console.warn("Reservation remove failed", error);
      setReservations(previousReservations);
      setNotice(`예약 삭제에 실패했습니다. ${getErrorMessage(error)}`);
    }
  }

  async function handleSubmit() {
    setNotice("");

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

      setReservations(Array.isArray(result.data) ? result.data : []);
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
              <p className="text-xs font-bold text-stone-500">
                2026 Reservation Platform
              </p>
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
          <p className="text-sm font-black tracking-[0.3em] text-orange-300">
            DAEJEON BREAD BUS
          </p>

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
              <p className="text-sm font-black text-orange-600">
                Reservation Calendar
              </p>
              <h3 className="text-3xl font-black">
                2개월 예약 달력
              </h3>
            </div>

            <div className="rounded-full bg-white px-4 py-3 text-sm font-black shadow-sm">
              관리자에서 날짜별 정원·가격·상태 수정 가능
            </div>
          </div>

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
            reservations={reservations}
            capacityOverrides={capacityOverrides}
            priceOverrides={priceOverrides}
            scheduleStatus={scheduleStatus}
            onChangeReservationStatus={handleReservationStatusChange}
            onRemoveReservation={handleRemoveReservation}
            onChangeCapacity={handleCapacityChange}
            onChangePrice={handlePriceChange}
            onChangeScheduleStatus={handleScheduleStatusChange}
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
