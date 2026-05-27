import React, { useEffect, useState } from "react";
import AdminSectionTitle from "./AdminSectionTitle.jsx";

function getTodayInputValue() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

export default function AdminScheduleDetailEditor({
  selectedDate = "",
  scheduleDetails = {},
  onSave,
  onRemove
}) {
  const [targetDate, setTargetDate] = useState(selectedDate || getTodayInputValue());
  const [detail, setDetail] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (selectedDate) {
      setTargetDate(selectedDate);
    }
  }, [selectedDate]);

  useEffect(() => {
    setDetail(scheduleDetails[targetDate] || "");
  }, [scheduleDetails, targetDate]);

  function handleDateChange(nextDate) {
    setTargetDate(nextDate);
    setMessage("");
  }

  function handleSave() {
    setMessage("");

    if (!targetDate) {
      setMessage("날짜를 먼저 선택해주세요.");
      return;
    }

    onSave?.(targetDate, detail);
    setMessage("여행 일정이 저장되었습니다.");
  }

  function handleRemove() {
    setMessage("");

    if (!targetDate) {
      setMessage("삭제할 날짜를 선택해주세요.");
      return;
    }

    onRemove?.(targetDate);
    setDetail("");
    setMessage("일정 내용이 삭제되었습니다.");
  }

  return (
    <section className="rounded-[2rem] border border-orange-100 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <AdminSectionTitle
          eyebrow="Travel Schedule"
          title="여행 일정 관리"
          description="고객 화면에 표시될 일정 내용을 날짜별로 관리합니다."
        />

        <div className="rounded-full bg-orange-50 px-4 py-2 text-xs font-black text-orange-700">
          고객 예약 화면 연동
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-stone-100 bg-stone-50 p-5">
        <label className="mb-4 grid gap-2 text-xs font-black text-stone-500 md:max-w-xs">
          일정 등록 날짜
          <input
            type="date"
            value={targetDate}
            onChange={(event) => handleDateChange(event.target.value)}
            className="rounded-2xl border border-stone-200 bg-white px-3 py-3 text-sm font-black text-stone-800 outline-none transition focus:border-orange-400"
          />
        </label>

        <div className="mb-4 rounded-2xl bg-white px-4 py-3 text-sm font-black text-stone-700">
          선택 날짜: {targetDate || "날짜를 선택해주세요"}
        </div>

        <textarea
          value={detail}
          onChange={(event) => setDetail(event.target.value)}
          rows={10}
          placeholder="예: 09:00 출발, 10:30 빵집 투어, 12:00 자유시간, 17:00 복귀"
          className="w-full rounded-[1.5rem] border border-stone-200 bg-white px-4 py-4 text-sm font-bold leading-7 text-stone-700 outline-none transition focus:border-orange-400"
        />

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleSave}
            className="rounded-2xl bg-stone-950 px-5 py-3 text-sm font-black text-white transition hover:bg-orange-600"
          >
            일정 저장
          </button>

          <button
            type="button"
            onClick={handleRemove}
            className="rounded-2xl border border-red-100 bg-red-50 px-5 py-3 text-sm font-black text-red-600 transition hover:bg-red-100"
          >
            일정 삭제
          </button>
        </div>

        {message ? (
          <div className="mt-4 rounded-2xl bg-orange-50 px-4 py-3 text-sm font-black text-orange-700">
            {message}
          </div>
        ) : null}
      </div>
    </section>
  );
}
