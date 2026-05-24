import React, { useMemo, useState } from "react";
import AdminCsvDownloadButton from "./AdminCsvDownloadButton.jsx";
import AdminReservationControls from "./AdminReservationControls.jsx";
import AdminSectionTitle from "./AdminSectionTitle.jsx";
import { filterReservations } from "../core/reservationFilters.js";
import { sortReservations } from "../core/reservationSorters.js";
import { RESERVATION_STATUS_OPTIONS } from "../core/statusConstants.js";

const STATUS_OPTIONS = [
  ...RESERVATION_STATUS_OPTIONS,
  "탑승완료"
];

function formatDate(dateString) {
  if (!dateString) return "-";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

export default function AdminReservationTable({
  reservations = [],
  onChangeStatus
}) {
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("");
  const [sortKey, setSortKey] = useState("newest");

  const visibleReservations = useMemo(() => {
    const filteredReservations = filterReservations({
      reservations,
      status,
      keyword
    });

    return sortReservations(filteredReservations, sortKey);
  }, [keyword, reservations, sortKey, status]);

  return (
    <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <AdminSectionTitle
          eyebrow="Admin Reservation Control"
          title="관리자 예약 관리"
          description="예약 검색, 상태 필터, 정렬, CSV 다운로드와 예약 상태 변경을 관리합니다."
        />

        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-full bg-stone-100 px-4 py-2 text-xs font-black text-stone-700">
            총 {reservations.length}건 / 표시 {visibleReservations.length}건
          </div>
          <AdminCsvDownloadButton reservations={visibleReservations} />
        </div>
      </div>

      <div className="mt-5">
        <AdminReservationControls
          keyword={keyword}
          status={status}
          sortKey={sortKey}
          onChangeKeyword={setKeyword}
          onChangeStatus={setStatus}
          onChangeSortKey={setSortKey}
        />
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl border border-stone-100">
        <div className="grid grid-cols-5 bg-stone-50 px-5 py-4 text-xs font-black text-stone-500">
          <div>예약 날짜</div>
          <div>예약자</div>
          <div>인원</div>
          <div>현재 상태</div>
          <div>상태 변경</div>
        </div>

        <div className="divide-y divide-stone-100">
          {visibleReservations.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm font-bold text-stone-400">
              조건에 맞는 예약이 없습니다.
            </div>
          ) : (
            visibleReservations.map((reservation) => (
              <div
                key={reservation.id}
                className="grid grid-cols-5 items-center gap-4 px-5 py-5 text-sm font-bold text-stone-700"
              >
                <div>{formatDate(reservation.date)}</div>
                <div>{reservation.name || "-"}</div>
                <div>{reservation.people}명</div>
                <div>
                  <span className="rounded-full bg-orange-50 px-3 py-2 text-xs font-black text-orange-700">
                    {reservation.status}
                  </span>
                </div>
                <div>
                  <select
                    value={reservation.status}
                    onChange={(event) =>
                      onChangeStatus?.(
                        reservation.id,
                        event.target.value
                      )
                    }
                    className="w-full rounded-2xl border border-stone-200 px-3 py-3 text-sm font-black outline-none transition focus:border-orange-400"
                  >
                    {STATUS_OPTIONS.map((statusOption) => (
                      <option key={statusOption} value={statusOption}>
                        {statusOption}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
