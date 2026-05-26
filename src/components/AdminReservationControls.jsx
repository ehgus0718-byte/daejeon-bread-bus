import React from "react";
import { RESERVATION_STATUS_OPTIONS } from "../core/statusConstants.js";

export const RESERVATION_SORT_OPTIONS = [
  {
    value: "newest",
    label: "최신순"
  },
  {
    value: "oldest",
    label: "오래된순"
  },
  {
    value: "date",
    label: "예약일순"
  },
  {
    value: "people",
    label: "인원 많은순"
  },
  {
    value: "amount",
    label: "금액 높은순"
  }
];

export default function AdminReservationControls({
  keyword = "",
  status = "",
  sortKey = "newest",
  onChangeKeyword,
  onChangeStatus,
  onChangeSortKey
}) {
  const hasActiveFilter = Boolean(keyword || status || sortKey !== "newest");

  function handleReset() {
    onChangeKeyword?.("");
    onChangeStatus?.("");
    onChangeSortKey?.("newest");
  }

  return (
    <div className="grid gap-3 rounded-3xl border border-orange-100 bg-white p-4 shadow-sm md:grid-cols-4">
      <label className="grid gap-2 text-sm font-black text-stone-700 md:col-span-2">
        통합 검색
        <input
          type="search"
          value={keyword}
          onChange={(event) => onChangeKeyword?.(event.target.value)}
          placeholder="예약자명, 연락처, 날짜, 상태 검색"
          className="rounded-2xl border border-stone-200 px-4 py-3 text-sm font-bold outline-none focus:border-orange-400"
        />
        <span className="text-xs font-bold text-stone-400">
          검색어, 상태, 정렬 조건을 조합해서 확인할 수 있습니다.
        </span>
      </label>

      <label className="grid gap-2 text-sm font-black text-stone-700">
        예약 상태
        <select
          value={status}
          onChange={(event) => onChangeStatus?.(event.target.value)}
          className="rounded-2xl border border-stone-200 px-4 py-3 text-sm font-bold outline-none focus:border-orange-400"
        >
          <option value="">전체 상태</option>
          {RESERVATION_STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-2">
        <label className="grid gap-2 text-sm font-black text-stone-700">
          정렬
          <select
            value={sortKey}
            onChange={(event) => onChangeSortKey?.(event.target.value)}
            className="rounded-2xl border border-stone-200 px-4 py-3 text-sm font-bold outline-none focus:border-orange-400"
          >
            {RESERVATION_SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={handleReset}
          disabled={!hasActiveFilter}
          className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-black text-stone-700 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          검색 초기화
        </button>
      </div>
    </div>
  );
}
