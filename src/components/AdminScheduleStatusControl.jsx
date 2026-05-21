import React from "react";

const STATUS_OPTIONS = [
  { value: "open", label: "모집중" },
  { value: "closed", label: "예약마감" }
];

function formatDate(dateString) {
  if (!dateString) return "-";

  const date = new Date(dateString);

  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

function getStatusLabel(status) {
  return STATUS_OPTIONS.find((item) => item.value === status)?.label || "예약마감";
}

export default function AdminScheduleStatusControl({
  scheduleStatus = {},
  onChangeStatus
}) {
  const entries = Object.entries(scheduleStatus);

  return (
    <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-black text-orange-600">
            Admin Schedule Status
          </p>
          <h3 className="mt-1 text-3xl font-black text-stone-900">
            날짜별 모집 상태 관리
          </h3>
        </div>

        <div className="rounded-full bg-stone-100 px-4 py-2 text-xs font-black text-stone-700">
          총 {entries.length}개 날짜 관리중
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl border border-stone-100">
        <div className="grid grid-cols-3 bg-stone-50 px-5 py-4 text-xs font-black text-stone-500">
          <div>날짜</div>
          <div>현재 상태</div>
          <div>상태 변경</div>
        </div>

        <div className="divide-y divide-stone-100">
          {entries.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm font-bold text-stone-400">
              설정된 모집 상태가 없습니다.
            </div>
          ) : (
            entries.map(([date, status]) => (
              <div
                key={date}
                className="grid grid-cols-3 items-center gap-4 px-5 py-5 text-sm font-bold text-stone-700"
              >
                <div>{formatDate(date)}</div>

                <div>
                  <span className={`rounded-full px-3 py-2 text-xs font-black ${
                    status === "open"
                      ? "bg-orange-50 text-orange-700"
                      : "bg-stone-900 text-white"
                  }`}>
                    {getStatusLabel(status)}
                  </span>
                </div>

                <div>
                  <select
                    value={status}
                    onChange={(event) =>
                      onChangeStatus?.(date, event.target.value)
                    }
                    className="w-full rounded-2xl border border-stone-200 px-3 py-3 text-sm font-black outline-none transition focus:border-orange-400"
                  >
                    {STATUS_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
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
