import React from "react";

const STATUS_OPTIONS = [
  "결제대기",
  "결제완료",
  "예약확정",
  "탑승완료",
  "예약취소"
];

function formatDate(dateString) {
  if (!dateString) return "-";

  const date = new Date(dateString);

  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

export default function AdminReservationTable({
  reservations = [],
  onChangeStatus
}) {
  return (
    <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-black text-orange-600">
            Admin Reservation Control
          </p>
          <h3 className="mt-1 text-3xl font-black text-stone-900">
            관리자 예약 관리
          </h3>
        </div>

        <div className="rounded-full bg-stone-100 px-4 py-2 text-xs font-black text-stone-700">
          총 {reservations.length}건 관리중
        </div>
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
          {reservations.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm font-bold text-stone-400">
              관리할 예약이 없습니다.
            </div>
          ) : (
            reservations
              .slice()
              .reverse()
              .map((reservation) => (
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
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
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
