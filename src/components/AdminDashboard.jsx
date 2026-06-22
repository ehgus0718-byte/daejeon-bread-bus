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

const MAX_HEADER_LINKS = 5;

function createEmptyLink() {
  return { id: `link-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, label: "", url: "" };
}

function AdminHeaderLinksEditor({ headerLinks = [], onUpdateHeaderLinks }) {
  const safeLinks = Array.isArray(headerLinks) ? headerLinks : [];
  const canAdd = safeLinks.length < MAX_HEADER_LINKS;

  function handleAdd() {
    if (!canAdd) return;
    onUpdateHeaderLinks?.([...safeLinks, createEmptyLink()]);
  }

  function handleRemove(id) {
    onUpdateHeaderLinks?.(safeLinks.filter((link) => link.id !== id));
  }

  function handleChange(id, field, value) {
    onUpdateHeaderLinks?.(
      safeLinks.map((link) =>
        link.id === id ? { ...link, [field]: value } : link
      )
    );
  }

  return (
    <section className="rounded-[2rem] border border-stone-200 bg-white p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black tracking-[0.2em] text-orange-600">HEADER LINKS</p>
          <h3 className="mt-1 text-2xl font-black text-stone-950">헤더 링크 관리</h3>
          <p className="mt-2 text-sm font-bold leading-6 text-stone-600">
            고객 화면 상단에 표시되는 링크입니다. 블로그·인스타·카카오채널 등 최대 {MAX_HEADER_LINKS}개까지 등록할 수 있습니다.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-stone-100 px-3 py-2 text-xs font-black text-stone-600">
            {safeLinks.length} / {MAX_HEADER_LINKS}
          </span>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!canAdd}
            className="rounded-full bg-orange-500 px-4 py-2 text-xs font-black text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-400"
          >
            + 링크 추가
          </button>
        </div>
      </div>

      {safeLinks.length === 0 ? (
        <div className="mt-5 rounded-[1.5rem] border border-stone-100 bg-stone-50 p-6 text-center">
          <p className="text-sm font-black text-stone-500">
            등록된 링크가 없습니다. 위의 "링크 추가" 버튼으로 추가해주세요.
          </p>
          <p className="mt-2 text-xs font-bold text-stone-400">
            예) 블로그: https://blog.naver.com/yourname
          </p>
        </div>
      ) : (
        <div className="mt-5 grid gap-4">
          {safeLinks.map((link, index) => (
            <div
              key={link.id}
              className="rounded-[1.5rem] border border-stone-100 bg-stone-50 p-5"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-xs font-black text-white">
                  {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemove(link.id)}
                  className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-black text-red-500 transition hover:bg-red-100"
                >
                  삭제
                </button>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black text-stone-600">
                    버튼 이름 <span className="text-orange-500">(헤더에 표시)</span>
                  </label>
                  <input
                    type="text"
                    value={link.label || ""}
                    onChange={(e) => handleChange(link.id, "label", e.target.value)}
                    placeholder="예) 블로그, 인스타그램, 카카오채널"
                    maxLength={12}
                    className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-bold text-stone-800 placeholder-stone-400 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black text-stone-600">
                    링크 주소 <span className="text-orange-500">(URL)</span>
                  </label>
                  <input
                    type="url"
                    value={link.url || ""}
                    onChange={(e) => handleChange(link.id, "url", e.target.value)}
                    placeholder="예) https://blog.naver.com/yourname"
                    className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-bold text-stone-800 placeholder-stone-400 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>
              </div>

              {link.label && link.url ? (
                <div className="mt-3 rounded-2xl bg-orange-50 px-4 py-2.5">
                  <p className="text-xs font-bold text-stone-500">
                    미리보기 →
                    <span className="ml-2 rounded-full border border-orange-200 bg-white px-3 py-1 text-xs font-black text-orange-700">
                      {link.label}
                    </span>
                  </p>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 rounded-[1.5rem] border border-orange-100 bg-orange-50 p-4">
        <p className="text-xs font-black text-orange-700">💡 입력 즉시 자동 저장됩니다.</p>
        <p className="mt-1 text-xs font-bold text-stone-500">
          링크 이름은 최대 12자, 주소는 https://로 시작해야 합니다. 저장 후 고객 화면 헤더에 바로 반영됩니다.
        </p>
      </div>
    </section>
  );
}

function AdminDailyChecklist({ reservations = [], scheduleDetails = {}, scheduleStatus = {} }) {
  const hasOpenSchedule = Object.values(scheduleStatus || {}).some((status) => status === "open");
  const hasScheduleDetail = Object.values(scheduleDetails || {}).some((detail) => String(detail || "").trim());
  const hasWaitingReservation = reservations.some((reservation) => reservation.status === "결제대기");

  const checklist = [
    {
      label: "예약 목록 새로고침",
      done: reservations.length > 0,
      help: "운영 시작 전 최근 예약을 확인하세요."
    },
    {
      label: "모집중 날짜 확인",
      done: hasOpenSchedule,
      help: "고객에게 열려 있는 날짜가 있는지 확인하세요."
    },
    {
      label: "여행 일정 등록 확인",
      done: hasScheduleDetail,
      help: "고객 구매 전환을 위해 일정 내용을 등록하세요."
    },
    {
      label: "결제대기 예약 확인",
      done: !hasWaitingReservation,
      help: "결제대기 예약은 입금/결제 확인 후 상태를 변경하세요."
    }
  ];

  return (
    <section className="rounded-[2rem] border border-orange-200 bg-orange-50 p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black tracking-[0.2em] text-orange-600">DAILY CHECKLIST</p>
          <h3 className="mt-1 text-2xl font-black text-stone-950">운영 전 체크리스트</h3>
          <p className="mt-2 text-sm font-bold leading-6 text-stone-600">
            예약 운영 전 꼭 확인하면 좋은 항목입니다.
          </p>
        </div>
        <div className="rounded-full bg-white px-4 py-2 text-xs font-black text-orange-700">
          {checklist.filter((item) => item.done).length}/{checklist.length} 완료
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {checklist.map((item) => (
          <div key={item.label} className="rounded-3xl bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${item.done ? "bg-orange-500 text-white" : "bg-stone-100 text-stone-400"}`}>
                {item.done ? "✓" : "!"}
              </span>
              <div className="text-sm font-black text-stone-900">{item.label}</div>
            </div>
            <p className="mt-3 text-xs font-bold leading-5 text-stone-500">{item.help}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function AdminDashboard({
  reservations = [],
  capacityOverrides = {},
  priceOverrides = {},
  scheduleStatus = {},
  scheduleDetails = {},
  selectedDate = "",
  isRefreshingReservations = false,
  isQuickReservationView = false,
  quickReservationLimit = 100,
  recentChangedReservationId = "",
  operationNotice = "",
  headerLinks = [],
  onRefreshReservations,
  onClearQuickReservations,
  onChangeReservationStatus,
  onRemoveReservation,
  onChangeCapacity,
  onChangePrice,
  onChangeScheduleStatus,
  onChangeScheduleDetail,
  onRemoveScheduleDetail,
  onRemoveDateSettings,
  onSaveReservationNote,
  onClearReservationNote,
  onUpdateHeaderLinks
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

  function handleClearQuickViewClick() {
    if (typeof onClearQuickReservations === "function") {
      onClearQuickReservations();
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
            {isRefreshingReservations ? "예약 목록 불러오는 중..." : `최근 ${quickReservationLimit}건 빠른 새로고침`}
          </button>

          <div className="rounded-full bg-white/10 px-4 py-3 text-xs font-black text-orange-100">
            운영자 전용 관리 영역
          </div>
        </div>
      </div>

      {isQuickReservationView ? (
        <div className="mb-6 rounded-[1.5rem] border border-orange-300/40 bg-orange-400/10 p-5 text-white">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black tracking-[0.2em] text-orange-200">
                QUICK VIEW MODE
              </p>
              <h3 className="mt-1 text-xl font-black">
                최근 {quickReservationLimit}건 빠른보기 중입니다.
              </h3>
              <p className="mt-2 text-sm font-bold leading-6 text-orange-50/80">
                고객 잔여좌석 계산은 전체 예약 데이터를 유지하고, 관리자 목록만 빠르게 보기 위해 최근 예약만 표시합니다.
              </p>
            </div>

            <button
              type="button"
              onClick={handleClearQuickViewClick}
              className="rounded-full bg-white px-5 py-3 text-sm font-black text-stone-950 transition hover:bg-orange-50"
            >
              전체 목록으로 복귀
            </button>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6">
        <AdminSummaryCards cards={summaryCards} />

        <AdminDailyChecklist
          reservations={reservationsWithNotes}
          scheduleDetails={scheduleDetails}
          scheduleStatus={scheduleStatus}
        />

        <AdminOperationGuide />

        <AdminHealthReport report={healthReport} />

        <AdminHeaderLinksEditor
          headerLinks={headerLinks}
          onUpdateHeaderLinks={onUpdateHeaderLinks}
        />

        <AdminReservationTable
          reservations={reservationsWithNotes}
          recentChangedReservationId={recentChangedReservationId}
          operationNotice={operationNotice}
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
