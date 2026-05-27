import React, { useMemo, useState } from "react";
import AdminCsvDownloadButton from "./AdminCsvDownloadButton.jsx";
import AdminReservationControls from "./AdminReservationControls.jsx";
import AdminSectionTitle from "./AdminSectionTitle.jsx";
import { filterReservations } from "../core/reservationFilters.js";
import { sortReservations } from "../core/reservationSorters.js";
import { formatPeopleCount } from "../core/formatters.js";
import { RESERVATION_STATUS_OPTIONS } from "../core/statusConstants.js";

const STATUS_OPTIONS = [
  ...RESERVATION_STATUS_OPTIONS,
  "탑승완료"
];
const DEFAULT_STATUS = STATUS_OPTIONS[0] || "예약접수";
const INITIAL_VISIBLE_COUNT = 25;
const VISIBLE_COUNT_STEP = 25;

function formatDate(dateString) {
  if (!dateString) return "-";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

function formatCurrency(value) {
  return `${new Intl.NumberFormat("ko-KR").format(Number(value || 0))}원`;
}

function createReservationRowKey(reservation = {}, index = 0) {
  return reservation.id || `${reservation.date || "date"}-${reservation.name || "name"}-${index}`;
}

function getReservationStatusValue(status = "") {
  return STATUS_OPTIONS.includes(status) ? status : DEFAULT_STATUS;
}

function getReservationStatusLabel(status = "") {
  return status || "상태 미정";
}

function getReservationPhoneLabel(phone = "") {
  return String(phone || "").trim() || "연락처 없음";
}

function getReservationPhoneHref(phone = "") {
  const digits = String(phone || "").replace(/\D/g, "");
  return digits ? `tel:${digits}` : "";
}

function createVisibleReservationSummary(reservations = []) {
  return reservations.reduce(
    (summary, reservation) => {
      const people = Number(reservation.people || 0);
      const amount = Number(reservation.amount || 0);
      const status = String(reservation.status || "");

      return {
        count: summary.count + 1,
        people: summary.people + (Number.isFinite(people) ? people : 0),
        amount: summary.amount + (Number.isFinite(amount) ? amount : 0),
        paid: summary.paid + (status === "결제완료" ? 1 : 0),
        waiting: summary.waiting + (status === "결제대기" ? 1 : 0),
        cancelled: summary.cancelled + (status === "취소" ? 1 : 0)
      };
    },
    {
      count: 0,
      people: 0,
      amount: 0,
      paid: 0,
      waiting: 0,
      cancelled: 0
    }
  );
}

function SummaryItem({ label, value }) {
  return (
    <div className="rounded-3xl border border-orange-100 bg-orange-50/60 px-4 py-3">
      <div className="text-xs font-black text-orange-600">{label}</div>
      <div className="mt-1 text-lg font-black text-stone-900">{value}</div>
    </div>
  );
}

function ReservationRow({
  reservation,
  tableColumnClassName,
  canRemoveReservation,
  isRecentlyChanged,
  onChangeStatus,
  onRemoveReservation
}) {
  const statusValue = getReservationStatusValue(reservation.status);
  const phoneLabel = getReservationPhoneLabel(reservation.phone);
  const phoneHref = getReservationPhoneHref(reservation.phone);

  return (
    <div
      className={`grid ${tableColumnClassName} items-center gap-4 px-5 py-5 text-sm font-bold text-stone-700 transition ${
        isRecentlyChanged ? "bg-orange-50/80 ring-2 ring-inset ring-orange-200" : "bg-white"
      }`}
    >
      <div>
        <div>{formatDate(reservation.date)}</div>
        {isRecentlyChanged ? (
          <div className="mt-2 inline-flex rounded-full bg-orange-500 px-3 py-1 text-[11px] font-black text-white">
            방금 반영됨
          </div>
        ) : null}
      </div>

      <div className="min-w-0">
        <div className="truncate text-base font-black text-stone-900">
          {reservation.name || "-"}
        </div>

        {phoneHref ? (
          <a
            href={phoneHref}
            className="mt-2 inline-flex max-w-full items-center rounded-full bg-stone-100 px-3 py-1 text-xs font-black text-stone-700 transition hover:bg-orange-100 hover:text-orange-700"
          >
            <span className="mr-1 text-stone-400">☎</span>
            <span className="truncate">{phoneLabel}</span>
          </a>
        ) : (
          <div className="mt-2 inline-flex max-w-full items-center rounded-full bg-stone-100 px-3 py-1 text-xs font-black text-stone-500">
            <span className="mr-1 text-stone-400">☎</span>
            <span className="truncate">{phoneLabel}</span>
          </div>
        )}
      </div>

      <div>{formatPeopleCount(reservation.people)}</div>

      <div>
        <span className="rounded-full bg-orange-50 px-3 py-2 text-xs font-black text-orange-700">
          {getReservationStatusLabel(reservation.status)}
        </span>
      </div>

      <div>
        <select
          value={statusValue}
          onChange={(event) => onChangeStatus?.(reservation.id, event.target.value)}
          className="w-full rounded-2xl border border-stone-200 px-3 py-3 text-sm font-black outline-none transition focus:border-orange-400"
        >
          {STATUS_OPTIONS.map((statusOption) => (
            <option key={statusOption} value={statusOption}>
              {statusOption}
            </option>
          ))}
        </select>
      </div>

      {canRemoveReservation ? (
        <div>
          <button
            type="button"
            onClick={() => onRemoveReservation(reservation.id)}
            className="w-full rounded-2xl border border-red-100 bg-red-50 px-3 py-3 text-sm font-black text-red-600 transition hover:bg-red-100"
          >
            삭제
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function AdminReservationTable({
  reservations = [],
  recentChangedReservationId = "",
  operationNotice = "",
  onChangeStatus,
  onRemoveReservation
}) {
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("");
  const [sortKey, setSortKey] = useState("newest");
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);
  const safeReservations = Array.isArray(reservations) ? reservations : [];
  const canRemoveReservation = typeof onRemoveReservation === "function";
  const tableColumnClassName = canRemoveReservation ? "grid-cols-6" : "grid-cols-5";

  const visibleReservations = useMemo(() => {
    const filteredReservations = filterReservations({
      reservations: safeReservations,
      status,
      keyword
    });

    return sortReservations(filteredReservations, sortKey);
  }, [keyword, safeReservations, sortKey, status]);

  const renderedReservations = useMemo(
    () => visibleReservations.slice(0, visibleCount),
    [visibleCount, visibleReservations]
  );

  const visibleSummary = useMemo(
    () => createVisibleReservationSummary(visibleReservations),
    [visibleReservations]
  );

  const hasMoreReservations = renderedReservations.length < visibleReservations.length;

  function handleKeywordChange(nextKeyword) {
    setKeyword(nextKeyword);
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  }

  function handleStatusChange(nextStatus) {
    setStatus(nextStatus);
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  }

  function handleSortKeyChange(nextSortKey) {
    setSortKey(nextSortKey);
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  }

  function handleShowMore() {
    setVisibleCount((currentCount) => currentCount + VISIBLE_COUNT_STEP);
  }

  function handleShowLess() {
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  }

  return (
    <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <AdminSectionTitle
          eyebrow="Admin Reservation Control"
          title="관리자 예약 관리"
          description="예약자 이름, 연락처, 예약 날짜, 상태를 통합 검색하고 예약 상태를 관리합니다."
        />

        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-full bg-stone-100 px-4 py-2 text-xs font-black text-stone-700">
            총 {safeReservations.length}건 / 검색 {visibleReservations.length}건 / 표시 {renderedReservations.length}건
          </div>
          <AdminCsvDownloadButton reservations={visibleReservations} />
        </div>
      </div>

      {operationNotice ? (
        <div className="mt-5 rounded-3xl border border-orange-100 bg-orange-50 px-5 py-4 text-sm font-black text-orange-700">
          {operationNotice}
        </div>
      ) : null}

      <div className="mt-5">
        <AdminReservationControls
          keyword={keyword}
          status={status}
          sortKey={sortKey}
          onChangeKeyword={handleKeywordChange}
          onChangeStatus={handleStatusChange}
          onChangeSortKey={handleSortKeyChange}
        />
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <SummaryItem label="검색 결과" value={`${visibleSummary.count}건`} />
        <SummaryItem label="총 인원" value={formatPeopleCount(visibleSummary.people)} />
        <SummaryItem label="총 금액" value={formatCurrency(visibleSummary.amount)} />
        <SummaryItem label="결제완료" value={`${visibleSummary.paid}건`} />
        <SummaryItem label="결제대기" value={`${visibleSummary.waiting}건`} />
        <SummaryItem label="취소" value={`${visibleSummary.cancelled}건`} />
      </div>

      <div className="mt-4 rounded-3xl bg-stone-50 px-5 py-4 text-xs font-bold leading-6 text-stone-500">
        예약 목록은 성능을 위해 처음 {INITIAL_VISIBLE_COUNT}건만 표시합니다. 검색·필터·정렬 결과는 전체 예약을 기준으로 계산되며, 필요한 경우 아래에서 더 불러올 수 있습니다.
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl border border-stone-100">
        <div className={`grid ${tableColumnClassName} bg-stone-50 px-5 py-4 text-xs font-black text-stone-500`}>
          <div>예약 날짜</div>
          <div>예약자 / 연락처</div>
          <div>인원</div>
          <div>현재 상태</div>
          <div>상태 변경</div>
          {canRemoveReservation ? <div>삭제</div> : null}
        </div>

        <div className="divide-y divide-stone-100">
          {visibleReservations.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm font-bold text-stone-400">
              조건에 맞는 예약이 없습니다.
            </div>
          ) : (
            renderedReservations.map((reservation, index) => (
              <ReservationRow
                key={createReservationRowKey(reservation, index)}
                reservation={reservation}
                tableColumnClassName={tableColumnClassName}
                canRemoveReservation={canRemoveReservation}
                isRecentlyChanged={reservation.id === recentChangedReservationId}
                onChangeStatus={onChangeStatus}
                onRemoveReservation={onRemoveReservation}
              />
            ))
          )}
        </div>
      </div>

      {visibleReservations.length > INITIAL_VISIBLE_COUNT ? (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          {hasMoreReservations ? (
            <button
              type="button"
              onClick={handleShowMore}
              className="rounded-full bg-stone-950 px-5 py-3 text-sm font-black text-white transition hover:bg-orange-600"
            >
              예약 {Math.min(VISIBLE_COUNT_STEP, visibleReservations.length - renderedReservations.length)}건 더 보기
            </button>
          ) : null}

          {renderedReservations.length > INITIAL_VISIBLE_COUNT ? (
            <button
              type="button"
              onClick={handleShowLess}
              className="rounded-full border border-stone-200 bg-white px-5 py-3 text-sm font-black text-stone-700 transition hover:bg-stone-50"
            >
              처음 {INITIAL_VISIBLE_COUNT}건만 보기
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
