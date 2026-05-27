import React, { useEffect, useMemo, useState } from "react";
import { loadSiteSettings } from "../api/siteSettingsClient.js";

const FALLBACK_TIMELINE = [
  "출발 및 인원 확인",
  "대표 빵집 투어",
  "브런치 또는 자유시간",
  "기념품 구매 및 복귀"
];

function formatDisplayDate(date) {
  if (!date) return "날짜 선택 전";

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

function getScheduleLines(scheduleDetail = "") {
  return String(scheduleDetail || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function getTimelineLabel(index) {
  const labels = ["출발", "투어", "휴식", "복귀"];
  return labels[index] || `일정 ${index + 1}`;
}

function getFirstSavedScheduleDetail(scheduleDetails = {}) {
  const entries = Object.entries(scheduleDetails || {})
    .filter(([, detail]) => String(detail || "").trim())
    .sort(([dateA], [dateB]) => String(dateA).localeCompare(String(dateB)));

  if (entries.length === 0) {
    return { date: "", detail: "" };
  }

  return {
    date: entries[0][0],
    detail: entries[0][1]
  };
}

export default function CustomerScheduleSection({
  selectedDate,
  scheduleDetail = "",
  scheduleStatus = "closed"
}) {
  const [remoteScheduleDetails, setRemoteScheduleDetails] = useState({});

  useEffect(() => {
    let isMounted = true;

    async function loadRemoteScheduleDetails() {
      const result = await loadSiteSettings();

      if (!isMounted || !result.ok) return;

      setRemoteScheduleDetails(result.data?.scheduleDetails || {});
    }

    loadRemoteScheduleDetails();

    return () => {
      isMounted = false;
    };
  }, []);

  const firstSavedSchedule = useMemo(
    () => getFirstSavedScheduleDetail(remoteScheduleDetails),
    [remoteScheduleDetails]
  );

  const selectedRemoteDetail = String(remoteScheduleDetails?.[selectedDate] || "").trim();
  const directDetail = String(scheduleDetail || "").trim();
  const finalScheduleDetail = directDetail || selectedRemoteDetail || firstSavedSchedule.detail || "";
  const displayDate = directDetail || selectedRemoteDetail ? selectedDate : firstSavedSchedule.date || selectedDate;
  const hasSchedule = Boolean(finalScheduleDetail);
  const scheduleLines = getScheduleLines(finalScheduleDetail);
  const displayLines = hasSchedule && scheduleLines.length > 0 ? scheduleLines : FALLBACK_TIMELINE;

  return (
    <section className="mb-8 overflow-hidden rounded-[2rem] border border-orange-100 bg-white shadow-sm">
      <style>{`main section.mt-10 > div.mb-5 > div.rounded-full.bg-white { display: none !important; }`}</style>

      <div className="bg-gradient-to-br from-stone-950 to-stone-800 p-6 text-white md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black tracking-[0.2em] text-orange-300">
              TRAVEL SCHEDULE
            </p>

            <h3 className="mt-2 text-3xl font-black">
              대전 빵버스 여행 일정
            </h3>

            <p className="mt-2 text-sm font-bold leading-6 text-stone-300">
              예약 달력에서 날짜를 선택하면 해당 날짜의 여행 일정과 예약 가능 여부를 함께 확인할 수 있습니다.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="rounded-full bg-white px-4 py-2 text-xs font-black text-stone-900">
              {formatDisplayDate(displayDate)}
            </div>

            <div className="rounded-full bg-orange-500 px-4 py-2 text-xs font-black text-white">
              {scheduleStatus === "open" ? "현재 예약 가능" : "예약 마감 또는 준비중"}
            </div>
          </div>
        </div>
      </div>

      {!hasSchedule ? (
        <div className="border-b border-orange-100 bg-orange-50 px-6 py-4 text-sm font-black text-orange-700 md:px-7">
          아직 등록된 상세 일정이 없습니다. 관리자 페이지에서 날짜별 여행 일정을 등록하면 이 영역에 바로 표시됩니다.
        </div>
      ) : null}

      {hasSchedule && !directDetail && !selectedRemoteDetail && firstSavedSchedule.date ? (
        <div className="border-b border-orange-100 bg-orange-50 px-6 py-4 text-sm font-black text-orange-700 md:px-7">
          선택 날짜에 등록된 일정이 없어 등록된 일정 중 가장 빠른 일정을 먼저 보여드립니다.
        </div>
      ) : null}

      <div className="grid gap-5 p-6 md:grid-cols-[1.2fr_0.8fr] md:p-7">
        <div className="rounded-[1.5rem] border border-stone-100 bg-stone-50 p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black tracking-[0.18em] text-orange-500">
                ROUTE PLAN
              </p>
              <h4 className="mt-1 text-xl font-black text-stone-950">
                {hasSchedule ? "등록된 여행 일정" : "일정 예시"}
              </h4>
            </div>

            <div className="rounded-full bg-orange-50 px-3 py-2 text-xs font-black text-orange-700">
              {displayLines.length}개 일정
            </div>
          </div>

          <div className="grid gap-3">
            {displayLines.map((line, index) => (
              <div
                key={`${line}-${index}`}
                className={`flex gap-3 rounded-2xl bg-white p-4 shadow-sm ${!hasSchedule ? "opacity-80" : ""}`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-500 text-xs font-black text-white">
                  {String(index + 1).padStart(2, "0")}
                </div>

                <div className="min-w-0">
                  <div className="mb-1 text-xs font-black text-orange-600">
                    {getTimelineLabel(index)}
                  </div>
                  <div className="whitespace-pre-wrap text-sm font-bold leading-6 text-stone-700">
                    {line}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="rounded-[1.5rem] border border-orange-100 bg-orange-50 p-5">
          <p className="text-xs font-black tracking-[0.18em] text-orange-600">
            RESERVATION TIP
          </p>

          <h4 className="mt-2 text-xl font-black text-stone-950">
            예약 전 확인해주세요
          </h4>

          <div className="mt-4 grid gap-3 text-sm font-bold leading-6 text-stone-700">
            <p className="rounded-2xl bg-white p-4">
              일정은 현장 상황과 교통 상황에 따라 일부 변경될 수 있습니다.
            </p>
            <p className="rounded-2xl bg-white p-4">
              달력에서 날짜를 선택하면 해당 날짜의 예약 가능 여부와 잔여 좌석을 함께 확인할 수 있습니다.
            </p>
            <p className="rounded-2xl bg-white p-4">
              마음에 드는 일정이라면 인원 선택 후 바로 예약을 진행해주세요.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
