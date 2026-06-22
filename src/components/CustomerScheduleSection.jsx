import React, { useEffect, useMemo, useState } from "react";
import { loadSiteSettings } from "../api/siteSettingsClient.js";

const FALLBACK_TIMELINE = [
  "출발 및 인원 확인",
  "대표 빵집 투어",
  "브런치 또는 자유시간",
  "기념품 구매 및 복귀"
];

const PROMO_TITLE = "빵 따라 떠나는\n대전 로컬 미식여행";
const PROMO_DESCRIPTION =
  "노가이드·노팁으로 부담 없이, 달력에서 원하는 날짜를 고르고 대전의 인기 빵집 코스를 편하게 예약해보세요.";
const CALENDAR_EYEBROW = "BREAD BUS BOOKING";
const CALENDAR_TITLE = "원하는 날짜로 떠나는 빵버스 예약";

function getScheduleLines(scheduleDetail = "") {
  return String(scheduleDetail || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

/**
 * 라벨 | 내용 형식을 파싱합니다.
 * 예: "집결 | 10:00 대전역 동광장" → { label: "집결", content: "10:00 대전역 동광장" }
 * 파이프 없으면 → { label: null, content: 원문 }
 */
function parseScheduleLine(line = "") {
  const pipeIndex = line.indexOf("|");

  if (pipeIndex !== -1) {
    const label = line.substring(0, pipeIndex).trim();
    const content = line.substring(pipeIndex + 1).trim();

    if (label) {
      return { label, content: content || line };
    }
  }

  return { label: null, content: line };
}

function getDefaultTimelineLabel(index) {
  const labels = ["출발", "투어", "휴식", "복귀"];
  return labels[index] || `코스 ${index + 1}`;
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

function cleanHeroDecoration(heroSection) {
  if (!heroSection) return;

  heroSection.classList.remove("bread-hero-enhanced");
  heroSection.querySelectorAll(".bread-hero-glow, .bread-hero-plate").forEach((element) => {
    element.remove();
  });
  delete heroSection.dataset.breadHeroDecorated;
}

function updateLandingCopy() {
  if (typeof document === "undefined") return;

  document.querySelectorAll("h1").forEach((element) => {
    if (element.textContent?.trim() === "대전빵셔틀 빵버스") {
      element.textContent = "대전빵버스 빵셔틀";
    }
  });

  document.querySelectorAll("h2").forEach((element) => {
    const text = String(element.textContent || "").replace(/\s+/g, " ").trim();

    if (text.includes("달력으로 선택하고") && text.includes("대전 빵버스를 예약하세요")) {
      element.innerHTML = PROMO_TITLE.replace("\n", "<br />");
    }

    if (text.includes("빵 따라 떠나는") || text.includes("대전 로컬 미식여행")) {
      cleanHeroDecoration(element.closest("section"));
    }
  });

  document.querySelectorAll("p").forEach((element) => {
    const text = String(element.textContent || "").replace(/\s+/g, " ").trim();

    if (
      text.includes("날짜별 모집현황") ||
      text.includes("실제 운영형 예약 플랫폼")
    ) {
      element.textContent = PROMO_DESCRIPTION;
    }

    if (text === "Reservation Calendar") {
      element.textContent = CALENDAR_EYEBROW;
    }
  });

  document.querySelectorAll("h3").forEach((element) => {
    const text = String(element.textContent || "").replace(/\s+/g, " ").trim();

    if (text === "2개월 예약 달력") {
      element.textContent = CALENDAR_TITLE;
    }
  });
}

export default function CustomerScheduleSection({
  selectedDate,
  scheduleDetail = ""
}) {
  const [remoteScheduleDetails, setRemoteScheduleDetails] = useState({});

  useEffect(() => {
    updateLandingCopy();
    const timer = window.setTimeout(updateLandingCopy, 300);

    return () => window.clearTimeout(timer);
  }, []);

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
  const hasSchedule = Boolean(finalScheduleDetail);
  const scheduleLines = getScheduleLines(finalScheduleDetail);
  const displayLines = hasSchedule && scheduleLines.length > 0 ? scheduleLines : FALLBACK_TIMELINE;

  return (
    <section className="mb-8 overflow-hidden rounded-[2rem] border border-orange-100 bg-white shadow-sm">
      <style>{`
        main section.mt-10 > div.mb-5 > div.rounded-full.bg-white { display: none !important; }
        .bread-hero-enhanced {
          background: #050505 !important;
        }
        .bread-hero-glow,
        .bread-hero-plate {
          display: none !important;
        }
      `}</style>

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
              예약 달력에서 날짜를 선택하면 해당 날짜의 여행 일정을 확인할 수 있습니다.
            </p>
          </div>
        </div>
      </div>

      {!hasSchedule ? (
        <div className="border-b border-orange-100 bg-orange-50 px-6 py-4 text-sm font-black leading-6 text-orange-700 md:px-7">
          해당 날짜의 상세 일정은 준비 중입니다.<br />
          예약 전 일정이 확정되면 이 영역에 안내됩니다.
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
            {displayLines.map((line, index) => {
              const parsed = parseScheduleLine(line);
              const label = parsed.label || getDefaultTimelineLabel(index);

              return (
                <div
                  key={`${line}-${index}`}
                  className={`flex gap-3 rounded-2xl bg-white p-4 shadow-sm ${!hasSchedule ? "opacity-80" : ""}`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-500 text-xs font-black text-white">
                    {String(index + 1).padStart(2, "0")}
                  </div>

                  <div className="min-w-0">
                    <div className="mb-1 text-xs font-black text-orange-600">
                      {label}
                    </div>
                    <div className="whitespace-pre-wrap text-sm font-bold leading-6 text-stone-700">
                      {parsed.content}
                    </div>
                  </div>
                </div>
              );
            })}
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
              달력에서 날짜를 선택하면 해당 날짜의 잔여 좌석을 함께 확인할 수 있습니다.
            </p>
            <p className="rounded-2xl bg-white p-4">
              마음에 드는 일정이라면 인원 선택 후 예약을 진행해주세요.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
