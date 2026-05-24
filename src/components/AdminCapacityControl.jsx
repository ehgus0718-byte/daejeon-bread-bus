import React from "react";
import AdminSectionTitle from "./AdminSectionTitle.jsx";

function formatDate(dateString) {
  if (!dateString) return "-";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

export default function AdminCapacityControl({
  capacityOverrides = {},
  onChangeCapacity
}) {
  const entries = Object.entries(capacityOverrides);

  return (
    <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <AdminSectionTitle
          eyebrow="Admin Capacity Control"
          title="날짜별 정원 관리"
          description="운행 날짜별 최대 예약 인원을 관리합니다."
        />

        <div className="rounded-full bg-stone-100 px-4 py-2 text-xs font-black text-stone-700">
          총 {entries.length}개 날짜 관리중
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl border border-stone-100">
        <div className="grid grid-cols-3 bg-stone-50 px-5 py-4 text-xs font-black text-stone-500">
          <div>날짜</div>
          <div>최대 정원</div>
          <div>정원 수정</div>
        </div>

        <div className="divide-y divide-stone-100">
          {entries.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm font-bold text-stone-400">
              설정된 정원 정보가 없습니다.
            </div>
          ) : (
            entries.map(([date, capacity]) => (
              <div
                key={date}
                className="grid grid-cols-3 items-center gap-4 px-5 py-5 text-sm font-bold text-stone-700"
              >
                <div>{formatDate(date)}</div>

                <div>{capacity}명</div>

                <div>
                  <input
                    type="number"
                    min="1"
                    value={capacity}
                    onChange={(event) =>
                      onChangeCapacity?.(
                        date,
                        Number(event.target.value)
                      )
                    }
                    className="w-full rounded-2xl border border-stone-200 px-3 py-3 text-sm font-black outline-none transition focus:border-orange-400"
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
