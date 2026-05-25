import React from "react";

function formatDate(dateString) {
  if (!dateString) return "-";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

function formatDateTime(dateString) {
  if (!dateString) return "-";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return `${formatDate(dateString)} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export default function ReservationList({ reservations = [] }) {
  return (
    <section className="rounded-[2rem] border border-orange-100 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-black text-orange-600">
            Reservation List
          </p>
          <h3 className="mt-1 text-3xl font-black text-stone-900">
            예약 현황
          </h3>
        </div>

        <div className="rounded-full bg-orange-50 px-4 py-2 text-xs font-black text-orange-700">
          총 {reservations.length}건
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl border border-stone-100">
        <div className="grid grid-cols-5 bg-stone-50 px-5 py-4 text-xs font-black text-stone-500">
          <div>예약 날짜</div>
          <div>예약자명</div>
          <div>예약 인원</div>
          <div>예약 상태</div>
          <div>예약 시간</div>
        </div>

        <div className="divide-y divide-stone-100">
          {reservations.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm font-bold text-stone-400">
              아직 예약 내역이 없습니다.
            </div>
          ) : (
            reservations
              .slice()
              .reverse()
              .map((reservation) => (
                <div
                  key={reservation.id}
                  className="grid grid-cols-5 items-center px-5 py-5 text-sm font-bold text-stone-700"
                >
                  <div>{formatDate(reservation.date)}</div>
                  <div>{reservation.name || "-"}</div>
                  <div>{reservation.people}명</div>
                  <div>
                    <span className="rounded-full bg-orange-50 px-3 py-2 text-xs font-black text-orange-700">
                      {reservation.status}
                    </span>
                  </div>
                  <div>{formatDateTime(reservation.createdAt)}</div>
                </div>
              ))
          )}
        </div>
      </div>
    </section>
  );
}
