import React from "react";
import { formatSeatCount } from "../core/formatters.js";

function toSafeNumber(value, fallbackValue = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallbackValue;
}

function buildMonth(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startWeekday = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const cells = [];

  for (let i = 0; i < startWeekday; i += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day));
  }

  return cells;
}

function formatKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function hasScheduleDetail(setting = {}) {
  return Boolean(String(setting?.detail || "").trim());
}

function CalendarCard({
  monthDate,
  dateSettings = {},
  getRemainingSeats,
  selectedDate,
  onSelectDate
}) {
  const safeMonthDate = Number.isNaN(monthDate?.getTime?.()) ? new Date() : monthDate;
  const year = safeMonthDate.getFullYear();
  const month = safeMonthDate.getMonth();
  const days = buildMonth(year, month);

  return (
    <div className="bb-calendar-card rounded-[2rem] border border-orange-100 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-2xl font-black text-stone-900">
          {year}.{String(month + 1).padStart(2, "0")}
        </h3>
        <span className="bb-calendar-badge rounded-full bg-orange-50 px-3 py-2 text-xs font-black text-orange-700">
          빵버스 일정
        </span>
      </div>

      <div className="bb-calendar-weekdays mb-3 grid grid-cols-7 gap-2 text-center text-xs font-black text-stone-400">
        {["일", "월", "화", "수", "목", "금", "토"].map((label) => (
          <div key={label}>{label}</div>
        ))}
      </div>

      <div className="bb-calendar-grid grid grid-cols-7 gap-2">
        {days.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="bb-calendar-empty aspect-square rounded-2xl bg-stone-50" />;
          }

          const key = formatKey(date);
          const setting = dateSettings[key];
          const remaining = Math.max(0, toSafeNumber(getRemainingSeats?.(key), 0));
          const isOpen = setting?.status === "open";
          const isSelected = selectedDate === key;
          const hasDetail = hasScheduleDetail(setting);
          const isLowSeats = isOpen && remaining > 0 && remaining <= 3;

          return (
            <button
              type="button"
              key={key}
              data-open={isOpen ? "true" : "false"}
              data-selected={isSelected ? "true" : "false"}
              data-low-seats={isLowSeats ? "true" : "false"}
              data-has-setting={setting ? "true" : "false"}
              onClick={() => {
                if (setting && isOpen) {
                  onSelectDate?.(key);
                }
              }}
              className={`bb-calendar-day aspect-square overflow-hidden rounded-2xl border p-2 text-left transition ${
                isSelected
                  ? "border-orange-500 bg-orange-500 text-white shadow-md shadow-orange-100"
                  : isOpen
                    ? "border-orange-100 bg-orange-50/60 hover:border-orange-300"
                    : "border-stone-100 bg-stone-50"
              }`}
            >
              <div className="bb-calendar-day-inner flex h-full min-h-0 flex-col justify-between gap-0.5">
                <div className="flex min-h-0 items-start justify-between gap-1">
                  <div className="bb-calendar-date text-base font-black leading-none">{date.getDate()}</div>

                  {hasDetail ? (
                    <div
                      className={`bb-calendar-detail-dot rounded-full px-1.5 py-0.5 text-[9px] font-black leading-none ${
                        isSelected
                          ? "bg-white text-orange-700"
                          : "bg-orange-500 text-white"
                      }`}
                    >
                      일정
                    </div>
                  ) : null}
                </div>

                {setting ? (
                  <div className="bb-calendar-info grid gap-0.5">
                    {hasDetail ? (
                      <div
                        className={`bb-calendar-detail-label truncate rounded-full px-1.5 py-0.5 text-[9px] font-black leading-tight ${
                          isSelected
                            ? "bg-white/90 text-stone-900"
                            : "bg-white text-stone-700"
                        }`}
                      >
                        여행 일정 보기
                      </div>
                    ) : null}

                    <div
                      className={`bb-calendar-seat-label rounded-full px-1.5 py-0.5 text-[9px] font-black leading-tight ${
                        isSelected
                          ? "bg-white text-orange-700"
                          : remaining > 0
                            ? "bg-white text-orange-700"
                            : "bg-stone-900 text-white"
                      }`}
                    >
                      {remaining > 0 ? `${formatSeatCount(remaining)} 남음` : "예약마감"}
                    </div>
                  </div>
                ) : (
                  <div className="bb-calendar-no-schedule text-[10px] font-bold leading-tight text-stone-400">일정 없음</div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function TwoMonthCalendar({
  currentDate = new Date(),
  dateSettings = {},
  getRemainingSeats,
  selectedDate,
  onSelectDate
}) {
  const safeCurrentDate = Number.isNaN(currentDate?.getTime?.()) ? new Date() : currentDate;
  const firstMonth = new Date(safeCurrentDate.getFullYear(), safeCurrentDate.getMonth(), 1);
  const secondMonth = new Date(safeCurrentDate.getFullYear(), safeCurrentDate.getMonth() + 1, 1);

  return (
    <section className="bb-calendar-section grid gap-6 lg:grid-cols-2">
      <CalendarCard
        monthDate={firstMonth}
        dateSettings={dateSettings}
        getRemainingSeats={getRemainingSeats}
        selectedDate={selectedDate}
        onSelectDate={onSelectDate}
      />

      <CalendarCard
        monthDate={secondMonth}
        dateSettings={dateSettings}
        getRemainingSeats={getRemainingSeats}
        selectedDate={selectedDate}
        onSelectDate={onSelectDate}
      />

      <div className="bb-calendar-legend" aria-label="달력 상태 안내">
        <span className="bb-legend-item bb-legend-open">예약가능</span>
        <span className="bb-legend-item bb-legend-low">마감임박</span>
        <span className="bb-legend-item bb-legend-closed">마감/일정없음</span>
      </div>
    </section>
  );
}
