import React from "react";
import AdminReservationTable from "./AdminReservationTable.jsx";
import AdminCapacityControl from "./AdminCapacityControl.jsx";
import AdminPriceControl from "./AdminPriceControl.jsx";
import AdminScheduleStatusControl from "./AdminScheduleStatusControl.jsx";

export default function AdminDashboard({
  reservations = [],
  capacityOverrides = {},
  priceOverrides = {},
  scheduleStatus = {},
  onChangeReservationStatus,
  onChangeCapacity,
  onChangePrice,
  onChangeScheduleStatus
}) {
  return (
    <section className="mt-10 rounded-[2.5rem] border border-stone-200 bg-stone-950 p-5 shadow-xl shadow-orange-100 md:p-8">
      <div className="mb-8 flex flex-col gap-3 text-white md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-black tracking-[0.25em] text-orange-300">
            ADMIN CENTER
          </p>
          <h2 className="mt-2 text-4xl font-black">
            관리자 운영 센터
          </h2>
          <p className="mt-3 text-sm font-bold leading-6 text-stone-300">
            예약 상태, 날짜별 정원, 가격, 모집 상태를 한 곳에서 관리합니다.
          </p>
        </div>

        <div className="rounded-full bg-white/10 px-4 py-3 text-xs font-black text-orange-100">
          운영자 전용 관리 영역
        </div>
      </div>

      <div className="grid gap-6">
        <AdminReservationTable
          reservations={reservations}
          onChangeStatus={onChangeReservationStatus}
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
