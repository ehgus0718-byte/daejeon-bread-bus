import React from "react";

const GUIDE_ITEMS = [
  {
    title: "예약 관리",
    description: "예약자명, 연락처, 날짜를 검색하고 상태별 필터와 정렬을 사용해 예약을 빠르게 확인합니다."
  },
  {
    title: "CSV 다운로드",
    description: "현재 표시 중인 예약 목록을 Excel 호환 CSV 파일로 내려받아 운영 자료로 보관합니다."
  },
  {
    title: "관리자 메모",
    description: "입금 확인, 고객 요청사항, 특이사항을 예약별 메모로 남겨 운영 누락을 줄입니다."
  },
  {
    title: "운영 상태 점검",
    description: "예약 데이터와 관리자 설정 구조에 누락이나 오류가 있는지 대시보드에서 확인합니다."
  }
];

export default function AdminOperationGuide() {
  return (
    <section className="rounded-[2rem] border border-orange-100 bg-orange-50 p-6 shadow-sm">
      <div className="mb-5">
        <p className="text-sm font-black text-orange-600">
          Operation Guide
        </p>
        <h3 className="mt-1 text-3xl font-black text-stone-900">
          관리자 운영 안내
        </h3>
        <p className="mt-2 text-sm font-bold leading-6 text-stone-600">
          예약 운영 중 자주 사용하는 기능을 한눈에 확인할 수 있도록 정리했습니다.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {GUIDE_ITEMS.map((item) => (
          <div
            key={item.title}
            className="rounded-3xl border border-orange-100 bg-white p-4"
          >
            <p className="text-base font-black text-stone-950">
              {item.title}
            </p>
            <p className="mt-2 text-sm font-bold leading-6 text-stone-500">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
