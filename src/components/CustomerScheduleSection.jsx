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

function ensureHeroDecorations(heroSection) {
  if (!heroSection || heroSection.dataset.breadHeroDecorated === "true") return;

  heroSection.dataset.breadHeroDecorated = "true";
  heroSection.classList.add("bread-hero-enhanced");

  const glow = document.createElement("div");
  glow.className = "bread-hero-glow";
  glow.setAttribute("aria-hidden", "true");

  const breadPlate = document.createElement("div");
  breadPlate.className = "bread-hero-plate";
  breadPlate.setAttribute("aria-hidden", "true");

  const breadOne = document.createElement("span");
  breadOne.className = "bread-piece bread-piece-one";

  const breadTwo = document.createElement("span");
  breadTwo.className = "bread-piece bread-piece-two";

  const breadThree = document.createElement("span");
  breadThree.className = "bread-piece bread-piece-three";

  const steamOne = document.createElement("span");
  steamOne.className = "bread-steam bread-steam-one";

  const steamTwo = document.createElement("span");
  steamTwo.className = "bread-steam bread-steam-two";

  const steamThree = document.createElement("span");
  steamThree.className = "bread-steam bread-steam-three";

  breadPlate.append(breadOne, breadTwo, breadThree, steamOne, steamTwo, steamThree);
  heroSection.append(glow, breadPlate);
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
      const heroSection = element.closest("section");
      ensureHeroDecorations(heroSection);
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
  scheduleDetail = "",
  scheduleStatus = "closed"
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
  const displayDate = directDetail || selectedRemoteDetail ? selectedDate : firstSavedSchedule.date || selectedDate;
  const hasSchedule = Boolean(finalScheduleDetail);
  const scheduleLines = getScheduleLines(finalScheduleDetail);
  const displayLines = hasSchedule && scheduleLines.length > 0 ? scheduleLines : FALLBACK_TIMELINE;

  return (
    <section className="mb-8 overflow-hidden rounded-[2rem] border border-orange-100 bg-white shadow-sm">
      <style>{`
        main section.mt-10 > div.mb-5 > div.rounded-full.bg-white { display: none !important; }
        .bread-hero-enhanced {
          position: relative;
          overflow: hidden;
          isolation: isolate;
          background:
            radial-gradient(circle at 82% 34%, rgba(255, 145, 54, 0.34), transparent 0 24%, transparent 25%),
            radial-gradient(circle at 91% 70%, rgba(255, 199, 118, 0.18), transparent 0 22%, transparent 23%),
            linear-gradient(135deg, #050505 0%, #0b0a08 52%, #1b1107 100%) !important;
        }
        .bread-hero-enhanced > *:not(.bread-hero-glow):not(.bread-hero-plate) {
          position: relative;
          z-index: 2;
        }
        .bread-hero-glow {
          position: absolute;
          inset: auto -8% -48% auto;
          width: min(520px, 46vw);
          height: min(520px, 46vw);
          border-radius: 9999px;
          background: radial-gradient(circle, rgba(255, 132, 42, 0.42), rgba(255, 190, 92, 0.18) 34%, transparent 68%);
          filter: blur(8px);
          opacity: 0.78;
          pointer-events: none;
          z-index: 0;
        }
        .bread-hero-plate {
          position: absolute;
          right: clamp(28px, 7vw, 110px);
          bottom: clamp(28px, 5vw, 76px);
          width: clamp(190px, 24vw, 340px);
          height: clamp(118px, 15vw, 210px);
          border-radius: 46% 54% 50% 50% / 58% 58% 42% 42%;
          background:
            radial-gradient(circle at 50% 70%, rgba(255, 244, 219, 0.14), transparent 0 42%, transparent 43%),
            linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.02));
          border: 1px solid rgba(255,255,255,0.10);
          box-shadow: inset 0 1px 24px rgba(255,255,255,0.10), 0 26px 55px rgba(0,0,0,0.28);
          transform: rotate(-3deg);
          pointer-events: none;
          z-index: 1;
          opacity: 0.98;
        }
        .bread-piece {
          position: absolute;
          display: block;
          background:
            radial-gradient(circle at 35% 28%, rgba(255, 241, 190, 0.9), transparent 0 12%, transparent 13%),
            radial-gradient(circle at 58% 36%, rgba(255, 231, 160, 0.75), transparent 0 11%, transparent 12%),
            linear-gradient(145deg, #f8b24f 0%, #d57720 55%, #91440f 100%);
          box-shadow: inset -14px -16px 24px rgba(100, 38, 5, 0.22), inset 8px 8px 14px rgba(255,255,255,0.20), 0 18px 30px rgba(0,0,0,0.24);
        }
        .bread-piece-one {
          width: 44%;
          height: 54%;
          left: 14%;
          bottom: 20%;
          border-radius: 62% 38% 56% 44% / 62% 46% 54% 38%;
          transform: rotate(-13deg);
        }
        .bread-piece-two {
          width: 50%;
          height: 48%;
          right: 10%;
          bottom: 28%;
          border-radius: 42% 58% 45% 55% / 52% 70% 30% 48%;
          transform: rotate(13deg);
        }
        .bread-piece-three {
          width: 34%;
          height: 34%;
          left: 38%;
          bottom: 10%;
          border-radius: 9999px 9999px 54% 54%;
          transform: rotate(2deg);
          background:
            linear-gradient(90deg, rgba(104, 48, 10, 0.16) 0 8%, transparent 8% 20%, rgba(104,48,10,0.12) 20% 28%, transparent 28% 43%, rgba(104,48,10,0.12) 43% 51%, transparent 51%),
            linear-gradient(145deg, #ffd37b 0%, #e8912c 58%, #9b4a13 100%);
        }
        .bread-steam {
          position: absolute;
          display: block;
          width: 12px;
          height: 52px;
          border-left: 2px solid rgba(255, 229, 181, 0.28);
          border-radius: 9999px;
          filter: blur(0.2px);
          opacity: 0.75;
        }
        .bread-steam-one { left: 31%; top: -18%; transform: rotate(18deg); }
        .bread-steam-two { left: 52%; top: -24%; transform: rotate(-8deg); height: 62px; opacity: 0.62; }
        .bread-steam-three { right: 27%; top: -12%; transform: rotate(12deg); height: 44px; opacity: 0.52; }
        @media (max-width: 900px) {
          .bread-hero-plate, .bread-hero-glow { opacity: 0.34; }
          .bread-hero-plate { right: -56px; bottom: 22px; transform: scale(0.82) rotate(-7deg); }
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
