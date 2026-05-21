import React from "react";

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

function CalendarCard({
  monthDate,
  dateSettings = {},
  getRemainingSeats,
  selectedDate,
  onSelectDate
}) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const days = buildMonth(year, month);

  return (
    <div className="rounded-[2rem] border border-orange-100 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-2xl font-black text-stone-900">
          {year}.{String(month + 1).padStart(2, "0")}
        </h3>
        <span className="rounded-full bg-orange-50 px-3 py-2 text-xs font-black text-orange-700">
          빵버스 일정
        </span>
      </div>

      <div className="mb-3 grid grid-cols-7 gap-2 text-center text-xs font-black text-stone-400">
        {["일", "월", "화", "수", "목", "금", "토"].map((label) => (
          <div key={label}>{label}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="aspect-square rounded-2xl bg-stone-50" />;
          }

          const key = formatKey(date);
          const setting = dateSettings[key];
          const remaining = getRemainingSeats?.(key) ?? 0;
          const isOpen = setting?.status === "open";
          const isSelected = selectedDate === key;

          return (
            <button
              type="button"
              key={key}
              onClick={() => {
                if (setting && isOpen) {
                  onSelectDate?.(key);
                }
              }}
              className={`aspect-square rounded-2xl border p-2 text-left transition ${
                isSelected
                  ? "border-orange-500 bg-orange-500 text-white shadow-lg shadow-orange-100"
                  : isOpen
                    ? "border-orange-100 bg-orange-50/60 hover:border-orange-300"
                    : "border-stone-100 bg-stone-50"
              }`}
            >
              <div className="flex h-full flex-col justify-between">
                <div className="text-lg font-black">{date.getDate()}</div>

                {setting ? (
                  <div>
                    <div
                      className={`rounded-full px-2 py-1 text-[10px] font-black ${
                        isSelected
                          ? "bg-white text-orange-700"
                          : remaining > 0
                            ? "bg-white text-orange-700"
                            : "bg-stone-900 text-white"
                      }`}
                    >
                      {remaining > 0 ? `${remaining}석 남음` : "예약마감"}
                    </div>
                  </div>
                ) : (
                  <div className="text-[10px] font-bold text-stone-400">일정 없음</div>
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
  const firstMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const secondMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);

  return (
    <section className="grid gap-6 lg:grid-cols-2">
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
    </section>
  );
}
