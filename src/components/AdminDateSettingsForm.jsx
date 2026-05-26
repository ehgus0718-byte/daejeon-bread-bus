import React, { useMemo, useState } from "react";
import AdminSectionTitle from "./AdminSectionTitle.jsx";

const STATUS_OPTIONS = [
  { value: "open", label: "모집중" },
  { value: "closed", label: "예약마감" }
];

function getTodayInputValue() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

function toNumber(value, fallback) {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : fallback;
}

function hasDateSetting(settings) {
  return Boolean(
    settings &&
      (settings.capacity !== undefined ||
        settings.price !== undefined ||
        settings.status !== undefined)
  );
}

export default function AdminDateSettingsForm({
  capacityOverrides = {},
  priceOverrides = {},
  scheduleStatus = {},
  onChangeCapacity,
  onChangePrice,
  onChangeScheduleStatus,
  onRemoveDateSettings
}) {
  const [date, setDate] = useState(getTodayInputValue);
  const [capacity, setCapacity] = useState("15");
  const [price, setPrice] = useState("30000");
  const [status, setStatus] = useState("open");
  const [message, setMessage] = useState("");

  const selectedCurrentSettings = useMemo(() => {
    if (!date) return null;

    return {
      capacity: capacityOverrides[date],
      price: priceOverrides[date],
      status: scheduleStatus[date]
    };
  }, [capacityOverrides, date, priceOverrides, scheduleStatus]);

  const canRemoveSelectedDate = hasDateSetting(selectedCurrentSettings);

  function handleDateChange(nextDate) {
    setDate(nextDate);
    setMessage("");

    if (!nextDate) return;

    if (capacityOverrides[nextDate] !== undefined) {
      setCapacity(String(capacityOverrides[nextDate]));
    }

    if (priceOverrides[nextDate] !== undefined) {
      setPrice(String(priceOverrides[nextDate]));
    }

    if (scheduleStatus[nextDate]) {
      setStatus(scheduleStatus[nextDate]);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    if (!date) {
      setMessage("날짜를 선택해주세요.");
      return;
    }

    const nextCapacity = toNumber(capacity, 15);
    const nextPrice = toNumber(price, 30000);

    if (nextCapacity < 1) {
      setMessage("정원은 1명 이상으로 입력해주세요.");
      return;
    }

    if (nextPrice < 0) {
      setMessage("가격은 0원 이상으로 입력해주세요.");
      return;
    }

    onChangeCapacity?.(date, nextCapacity);
    onChangePrice?.(date, nextPrice);
    onChangeScheduleStatus?.(date, status);
    setMessage("날짜 설정이 저장되었습니다. 아래 관리 목록과 Supabase에 반영됩니다.");
  }

  function handleRemove() {
    setMessage("");

    if (!date) {
      setMessage("삭제할 날짜를 선택해주세요.");
      return;
    }

    if (!canRemoveSelectedDate) {
      setMessage("선택한 날짜에 삭제할 설정이 없습니다.");
      return;
    }

    const confirmed =
      typeof window === "undefined" ||
      window.confirm("선택한 날짜의 정원, 가격, 모집 상태 설정을 삭제하시겠습니까?");

    if (!confirmed) return;

    onRemoveDateSettings?.(date);
    setMessage("선택한 날짜 설정이 삭제되었습니다. 아래 관리 목록과 Supabase에 반영됩니다.");
  }

  return (
    <section className="rounded-[2rem] border border-orange-100 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <AdminSectionTitle
          eyebrow="Admin Date Settings"
          title="날짜 설정 추가"
          description="운행 날짜의 정원, 가격, 모집 상태를 한 번에 등록하거나 삭제합니다."
        />

        <div className="rounded-full bg-orange-50 px-4 py-2 text-xs font-black text-orange-700">
          Supabase 공통 저장
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-5">
        <label className="grid gap-2 text-xs font-black text-stone-500">
          날짜
          <input
            type="date"
            value={date}
            onChange={(event) => handleDateChange(event.target.value)}
            className="rounded-2xl border border-stone-200 px-3 py-3 text-sm font-black text-stone-800 outline-none transition focus:border-orange-400"
          />
        </label>

        <label className="grid gap-2 text-xs font-black text-stone-500">
          최대 정원
          <input
            type="number"
            min="1"
            value={capacity}
            onChange={(event) => setCapacity(event.target.value)}
            className="rounded-2xl border border-stone-200 px-3 py-3 text-sm font-black text-stone-800 outline-none transition focus:border-orange-400"
          />
        </label>

        <label className="grid gap-2 text-xs font-black text-stone-500">
          예약 가격
          <input
            type="number"
            min="0"
            step="1000"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            className="rounded-2xl border border-stone-200 px-3 py-3 text-sm font-black text-stone-800 outline-none transition focus:border-orange-400"
          />
        </label>

        <label className="grid gap-2 text-xs font-black text-stone-500">
          모집 상태
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="rounded-2xl border border-stone-200 px-3 py-3 text-sm font-black text-stone-800 outline-none transition focus:border-orange-400"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-2 md:grid-cols-1">
          <button
            type="submit"
            className="w-full rounded-2xl bg-stone-950 px-4 py-3 text-sm font-black text-white transition hover:bg-orange-600"
          >
            날짜 설정 저장
          </button>

          <button
            type="button"
            onClick={handleRemove}
            disabled={!canRemoveSelectedDate}
            className="w-full rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-black text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            선택 날짜 설정 삭제
          </button>
        </div>
      </form>

      {selectedCurrentSettings ? (
        <div className="mt-4 rounded-2xl bg-stone-50 px-4 py-3 text-xs font-bold text-stone-500">
          현재 선택 날짜 설정: 정원 {selectedCurrentSettings.capacity || "기본값"} / 가격 {selectedCurrentSettings.price || "기본값"} / 상태 {selectedCurrentSettings.status || "기본값"}
        </div>
      ) : null}

      {message ? (
        <div className="mt-4 rounded-2xl bg-orange-50 px-4 py-3 text-sm font-black text-orange-700">
          {message}
        </div>
      ) : null}
    </section>
  );
}
