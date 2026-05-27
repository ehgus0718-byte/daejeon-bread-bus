import React, { useEffect, useState } from "react";
import AdminSectionTitle from "./AdminSectionTitle.jsx";

export default function AdminScheduleDetailEditor({
  selectedDate = "",
  scheduleDetails = {},
  onSave,
  onRemove
}) {
  const [detail, setDetail] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setDetail(scheduleDetails[selectedDate] || "");
  }, [scheduleDetails, selectedDate]);

  function handleSave() {
    setMessage("");

    if (!selectedDate) {
      setMessage("날짜를 먼저 선택해주세요.");
      return;
    }

    onSave?.(selectedDate, detail);
    setMessage("여행 일정이 저장되었습니다.");
  }

  function handleRemove() {
    setMessage("");

    if (!selectedDate) {
      setMessage("삭제할 날짜를 선택해주세요.");
      return;
    }

    onRemove?.(selectedDate);
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
        <div className="mb-4 text-sm font-black text-stone-700">
          선택 날짜: {selectedDate || "날짜를 선택해주세요"}
        </div>

        <textarea
          value={detail}
          onChange={(event) => setDetail(event.target.value)}
          rows={10}
          placeholder="여행 일정 내용을 입력해주세요"
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
