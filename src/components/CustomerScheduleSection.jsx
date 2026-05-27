import React from "react";

function formatDisplayDate(date) {
  if (!date) return "";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short"
  });
}

export default function CustomerScheduleSection({
  selectedDate,
  scheduleDetail = "",
  scheduleStatus = "closed"
}) {
  const hasSchedule = Boolean(String(scheduleDetail || "").trim());

  if (!hasSchedule) {
    return null;
  }

  return (
    <section className="mt-8 rounded-[2rem] border border-orange-100 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-black tracking-[0.2em] text-orange-500">
            TRAVEL SCHEDULE
          </p>

          <h3 className="mt-2 text-2xl font-black text-stone-950">
            여행 일정 안내
          </h3>

          <p className="mt-2 text-sm font-bold text-stone-500">
            달력으로 선택하고 대전 빵버스를 예약하세요.
          </p>
        </div>

        <div className="rounded-full bg-orange-50 px-4 py-2 text-xs font-black text-orange-700">
          {scheduleStatus === "open" ? "현재 예약 가능" : "예약 마감 일정"}
        </div>
      </div>

      <div className="mt-6 rounded-[1.5rem] border border-stone-100 bg-stone-50 p-5">
        <div className="flex flex-wrap items-center gap-3 border-b border-stone-200 pb-4">
          <div className="rounded-full bg-stone-950 px-4 py-2 text-xs font-black text-white">
            선택 일정
          </div>

          <div className="text-sm font-black text-stone-700">
            {formatDisplayDate(selectedDate)}
          </div>
        </div>

        <div className="mt-5 whitespace-pre-wrap text-sm font-bold leading-7 text-stone-700">
          {scheduleDetail}
        </div>
      </div>
    </section>
  );
}
