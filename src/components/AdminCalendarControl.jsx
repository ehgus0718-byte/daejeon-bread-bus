import React, { useMemo } from "react";
import {
  CALENDAR_MODE_AUTO,
  CALENDAR_MODE_MANUAL,
  MAX_MONTH_COUNT,
  MIN_MONTH_COUNT,
  formatMonthKey,
  isCalendarStartOutdated,
  normalizeCalendarSettings,
  resolveVisibleMonthKeys
} from "../core/calendarSettings.js";

function toMonthLabel(monthKey) {
  const [year, month] = String(monthKey || "").split("-");
  if (!year || !month) return "";
  return `${year}년 ${Number(month)}월`;
}

export default function AdminCalendarControl({
  calendarSettings = {},
  onUpdateCalendarSettings
}) {
  const settings = normalizeCalendarSettings(calendarSettings);
  const isManual = settings.mode === CALENDAR_MODE_MANUAL;

  const currentMonthKey = useMemo(() => formatMonthKey(new Date()), []);
  const visibleMonths = useMemo(
    () => resolveVisibleMonthKeys(settings, new Date()),
    [settings.mode, settings.startMonth, settings.monthCount]
  );
  const isOutdated = isCalendarStartOutdated(settings, new Date());

  function update(patch) {
    onUpdateCalendarSettings?.({ ...settings, ...patch });
  }

  function handleModeChange(nextMode) {
    if (nextMode === CALENDAR_MODE_MANUAL) {
      update({
        mode: CALENDAR_MODE_MANUAL,
        startMonth: settings.startMonth || currentMonthKey
      });
      return;
    }
    update({ mode: CALENDAR_MODE_AUTO });
  }

  return (
    <section className="rounded-[2rem] border border-stone-200 bg-white p-6">
      <div>
        <p className="text-xs font-black tracking-[0.2em] text-orange-600">CALENDAR</p>
        <h3 className="mt-1 text-2xl font-black text-stone-950">예약 달력 노출 설정</h3>
        <p className="mt-2 text-sm font-bold leading-6 text-stone-600">
          고객 페이지 달력이 어느 달부터, 몇 개월치가 보일지 결정합니다.
          평소에는 <span className="font-black text-orange-700">자동</span>으로 두시면 매달 알아서 넘어갑니다.
        </p>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <button
          type="button"
          onClick={() => handleModeChange(CALENDAR_MODE_AUTO)}
          className={`rounded-2xl border p-4 text-left transition ${
            !isManual
              ? "border-orange-400 bg-orange-50 shadow-sm"
              : "border-stone-200 bg-white hover:border-orange-200"
          }`}
        >
          <p className="text-sm font-black text-stone-950">
            자동 (현재 월부터) {!isManual ? <span className="text-orange-600">✓</span> : null}
          </p>
          <p className="mt-1 text-xs font-bold leading-5 text-stone-600">
            매달 1일이 되면 자동으로 이번 달부터 보입니다. 손댈 필요 없음 — 권장 설정입니다.
          </p>
        </button>

        <button
          type="button"
          onClick={() => handleModeChange(CALENDAR_MODE_MANUAL)}
          className={`rounded-2xl border p-4 text-left transition ${
            isManual
              ? "border-orange-400 bg-orange-50 shadow-sm"
              : "border-stone-200 bg-white hover:border-orange-200"
          }`}
        >
          <p className="text-sm font-black text-stone-950">
            직접 지정 {isManual ? <span className="text-orange-600">✓</span> : null}
          </p>
          <p className="mt-1 text-xs font-bold leading-5 text-stone-600">
            성수기 예약을 미리 열 때만 사용하세요. 지정한 달에 고정되므로 직접 관리해야 합니다.
          </p>
        </button>
      </div>

      <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-end">
        <div className="flex flex-col gap-2">
          <label htmlFor="calendar-start-month" className="text-xs font-black text-stone-600">
            시작 월
          </label>
          <input
            id="calendar-start-month"
            type="month"
            value={isManual ? settings.startMonth || currentMonthKey : currentMonthKey}
            disabled={!isManual}
            onChange={(e) => update({ startMonth: e.target.value })}
            className="w-48 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-center text-base font-black text-stone-950 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:bg-stone-100 disabled:text-stone-400"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="calendar-month-count" className="text-xs font-black text-stone-600">
            표시 개월 수
          </label>
          <select
            id="calendar-month-count"
            value={settings.monthCount}
            onChange={(e) => update({ monthCount: Number(e.target.value) })}
            className="w-36 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-center text-base font-black text-stone-950 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          >
            {Array.from(
              { length: MAX_MONTH_COUNT - MIN_MONTH_COUNT + 1 },
              (unused, index) => MIN_MONTH_COUNT + index
            ).map((count) => (
              <option key={count} value={count}>
                {count}개월
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-5 rounded-[1.5rem] border border-orange-100 bg-orange-50 p-4">
        <p className="text-xs font-black text-stone-500">지금 고객에게 보이는 달력</p>
        <p className="mt-1 text-sm font-black text-orange-800">
          {visibleMonths.map((monthKey) => toMonthLabel(monthKey)).join("  ·  ")}
        </p>
        <p className="mt-2 text-xs font-bold text-stone-500">💡 선택 즉시 자동 저장됩니다.</p>
      </div>

      {isOutdated ? (
        <div className="mt-3 rounded-[1.5rem] border border-red-200 bg-red-50 p-4">
          <p className="text-xs font-black text-red-700">
            ⚠️ 지정한 달이 이미 지났습니다. 고객에게 지난 달력이 보이고 있습니다.
          </p>
          <p className="mt-1 text-xs font-bold text-stone-600">
            위에서 &lsquo;자동 (현재 월부터)&rsquo;를 선택하시면 바로 정상으로 돌아옵니다.
          </p>
        </div>
      ) : null}
    </section>
  );
}
