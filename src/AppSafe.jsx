import React from "react";

export default function AppSafe() {
  return (
    <div className="min-h-screen bg-[#fff8ef] text-stone-950">
      <header className="border-b border-orange-100 bg-white/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500 text-2xl text-white">🚌</div>
            <div>
              <h1 className="text-xl font-black">대전빵셔틀 빵버스</h1>
              <p className="text-xs font-bold text-stone-500">빌드 정상화 진행 중</p>
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-12">
        <section className="rounded-[2rem] bg-stone-950 p-8 text-white shadow-xl shadow-orange-100">
          <p className="text-sm font-black tracking-[0.25em] text-orange-300">STABLE BUILD</p>
          <h2 className="mt-4 text-4xl font-black leading-tight md:text-6xl">대전 빵버스 예약 시스템을 안정화하고 있습니다.</h2>
          <p className="mt-5 max-w-2xl font-bold leading-7 text-stone-300">현재 깨진 기존 App.jsx를 우회해 빌드 정상화부터 진행합니다. 이후 예약 캘린더, 관리자 정원 변경, 결제 준비 기능을 단계적으로 다시 올립니다.</p>
        </section>
        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl bg-white p-6 shadow-sm"><p className="text-sm font-black text-orange-600">1단계</p><h3 className="mt-2 text-2xl font-black">빌드 복구</h3><p className="mt-3 text-sm font-bold leading-6 text-stone-600">문법 오류가 있는 기존 파일을 우회하고 정상 배포 상태를 먼저 회복합니다.</p></div>
          <div className="rounded-3xl bg-white p-6 shadow-sm"><p className="text-sm font-black text-orange-600">2단계</p><h3 className="mt-2 text-2xl font-black">구조 안정화</h3><p className="mt-3 text-sm font-bold leading-6 text-stone-600">예약, 관리자, 설정 로직을 분리해 코드가 꼬이지 않게 정리합니다.</p></div>
          <div className="rounded-3xl bg-white p-6 shadow-sm"><p className="text-sm font-black text-orange-600">3단계</p><h3 className="mt-2 text-2xl font-black">운영 기능</h3><p className="mt-3 text-sm font-bold leading-6 text-stone-600">관리자에서 날짜별 정원, 가격, 모집상태를 수정할 수 있게 만듭니다.</p></div>
        </section>
      </main>
    </div>
  );
}
