import React, { useMemo } from "react";
import AdminReservationTable from "./AdminReservationTable.jsx";
import AdminCapacityControl from "./AdminCapacityControl.jsx";
import AdminPriceControl from "./AdminPriceControl.jsx";
import AdminScheduleStatusControl from "./AdminScheduleStatusControl.jsx";
import AdminSummaryCards from "./AdminSummaryCards.jsx";
import AdminReservationNotesSection from "./AdminReservationNotesSection.jsx";
import AdminHealthReport from "./AdminHealthReport.jsx";
import AdminOperationGuide from "./AdminOperationGuide.jsx";
import AdminDateSettingsForm from "./AdminDateSettingsForm.jsx";
import AdminScheduleDetailEditor from "./AdminScheduleDetailEditor.jsx";
import {
  createAdminDashboardSummary,
  getAdminDashboardSummaryCards
} from "../core/adminDashboardSummary.js";
import { createAppHealthReport } from "../core/appHealthCheck.js";
import { buildDateSettings } from "../core/dateSettingsBuilder.js";
import { useReservationNotes } from "../hooks/useReservationNotes.js";

export default function AdminDashboard({
  reservations = [],
  capacityOverrides = {},
  priceOverrides = {},
  scheduleStatus = {},
  scheduleDetails = {},
  selectedDate = "",
  isRefreshingReservations = false,
  onRefreshReservations,
  onChangeReservationStatus,
  onRemoveReservation,
  onChangeCapacity,
  onChangePrice,
  onChangeScheduleStatus,
  onChangeScheduleDetail,
  onRemoveScheduleDetail,
  onRemoveDateSettings,
  onSaveReservationNote,
  onClearReservationNote
}) {
  const localNotes = useReservationNotes(reservations);
  const usesExternalNoteStorage =
    typeof onSaveReservationNote === "function" ||
    typeof onClearReservationNote === "function";

  const reservationsWithNotes = usesExternalNoteStorage
    ? reservations
    : localNotes.reservationsWithNotes;

  const saveNote = onSaveReservationNote || localNotes.saveNote;
  const clearNote = onClearReservationNote || localNotes.clearNote;

  const dateSettings = useMemo(
    () =>
      buildDateSettings({
        capacityOverrides,
        priceOverrides,
        scheduleStatus,
        scheduleDetails
      }),
    [capacityOverrides, priceOverrides, scheduleDetails, scheduleStatus]
  );

  const summaryCards = useMemo(() => {
    const summary = createAdminDashboardSummary({
      reservations: reservationsWithNotes,
      dateSettings,
      notificationQueue: []
    });

    return getAdminDashboardSummaryCards(summary);
  }, [dateSettings, reservationsWithNotes]);

  const healthReport = useMemo(
    () =>
      createAppHealthReport({
        reservations: reservationsWithNotes,
        capacityOverrides,
        priceOverrides,
        scheduleStatus
      }),
    [capacityOverrides, priceOverrides, reservationsWithNotes, scheduleStatus]
  );

  function handleRefreshClick() {
    if (typeof onRefreshReservations === "function") {
      onRefreshReservations();
    }
  }

  return (
    <section className="mt-10 rounded-[2.5rem] border border-stone-200 bg-stone-950 p-5 shadow-xl shadow-orange-100 md:p-8">
      <div className="mb-8 flex flex-col gap-4 text-white md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-black tracking-[0.25em] text-orange-300">
            ADMIN CENTER
          </p>
          <h2 className="mt-2 text-4xl font-black">
            관리자 운영 센터
          </h2>
          <p className="mt-3 text-sm font-bold leading-6 text-stone-300">
            예약 상태, 날짜별 정원, 가격, 모집 상태와 고객용 여행 일정을 관리합니다.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleRefreshClick}
            disabled={isRefreshingReservations}
            className="rounded-full bg-orange-500 px-4 py-3 text-xs font-black text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/60"
          >
            {isRefreshingReservations ? "예약 목록 불러오는 중..." : "예약 목록 새로고침"}
          </button>

          <div className="rounded-full bg-white/10 px-4 py-3 text-xs font-black text-orange-100">
            운영자 전용 관리 영역
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        <AdminSummaryCards cards={summaryCards} />

        <AdminOperationGuide />

        <AdminHealthReport report={healthReport} />

        <AdminReservationTable
          reservations={reservationsWithNotes}
          onChangeStatus={onChangeReservationStatus}
          onRemoveReservation={onRemoveReservation}
        />

        <AdminReservationNotesSection
          reservations={reservationsWithNotes}
          onSaveNote={saveNote}
          onClearNote={clearNote}
        />

        <AdminDateSettingsForm
          capacityOverrides={capacityOverrides}
          priceOverrides={priceOverrides}
          scheduleStatus={scheduleStatus}
          onChangeCapacity={onChangeCapacity}
          onChangePrice={onChangePrice}
          onChangeScheduleStatus={onChangeScheduleStatus}
          onRemoveDateSettings={onRemoveDateSettings}
        />

        <AdminScheduleDetailEditor
          selectedDate={selectedDate}
          scheduleDetails={scheduleDetails}
          onSave={onChangeScheduleDetail}
          onRemove={onRemoveScheduleDetail}
        />

        <AdminCapacityControl
          capacityOverrides={capacityOverrides}
          onChangeCapacity={onChangeCapacity}
        />

        <AdminPriceControl
          priceOverrides={priceOverrides}
          onChangePrice={onChangePrice}
        />

        <AdminScheduleStatusControl
          scheduleStatus={scheduleStatus}
          onChangeStatus={onChangeScheduleStatus}
        />
      </div>
    </section>
  );
}
