import React from "react";
import { formatCurrency, formatSeatCount } from "../core/formatters.js";
import SectionTitle from "./SectionTitle.jsx";

const PEOPLE_OPTIONS = [1, 2, 3, 4];

function toSafeNumber(value, fallbackValue = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallbackValue;
}

function normalizePeopleCount(value) {
  const people = toSafeNumber(value, 1);
  return PEOPLE_OPTIONS.includes(people) ? people : PEOPLE_OPTIONS[0];
}

export default function ReservationPanel({
  selectedDate,
  remainingSeats = 0,
  price = 0,
  form = {},
  onChange,
  onSubmit,
  notice
}) {
  const selectedPeople = normalizePeopleCount(form.people);
  const safePrice = Math.max(0, toSafeNumber(price, 0));
  const totalAmount = selectedPeople * safePrice;

  return (
    <section className="rounded-[2rem] border border-orange-100 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <SectionTitle
          eyebrow="Reservation"
          title="예약 정보 입력"
          description="선택한 날짜의 잔여 좌석과 결제 예정금액을 확인하고 예약 정보를 입력합니다."
        />
        <div className="rounded-full bg-orange-50 px-4 py-2 text-xs font-black text-orange-700">
          실시간 모집현황 반영
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl bg-stone-50 p-5">
          <p className="text-xs font-black text-stone-500">선택 날짜</p>
          <p className="mt-2 text-2xl font-black text-stone-900">
            {selectedDate || "날짜 선택 대기"}
          </p>
        </div>
        <div className="rounded-3xl bg-stone-50 p-5">
          <p className="text-xs font-black text-stone-500">잔여 좌석</p>
          <p className="mt-2 text-2xl font-black text-stone-900">
            {formatSeatCount(remainingSeats)}
          </p>
        </div>
        <div className="rounded-3xl bg-stone-50 p-5">
          <p className="text-xs font-black text-stone-500">총 결제 예정금액</p>
          <p className="mt-2 text-2xl font-black text-orange-600">
            {formatCurrency(totalAmount)}
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-3xl border border-orange-100 bg-orange-50/70 p-5 text-sm font-bold leading-6 text-stone-700">
        <p className="font-black text-orange-700">결제 안내</p>
        <p className="mt-2">
          예약 접수 후 관리자가 예약 내용을 확인하고 연락처로 결제 또는 입금 안내를 드립니다.
        </p>
        <p className="mt-1 text-xs font-black text-stone-500">
          관리자 확인 전까지 예약 상태는 결제대기로 저장됩니다.
        </p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-black text-stone-700">예약자명</span>
          <input
            type="text"
            value={form.name || ""}
            onChange={(e) => onChange?.("name", e.target.value)}
            placeholder="예약자명을 입력해주세요"
            className="rounded-2xl border border-stone-200 px-4 py-4 font-bold outline-none transition focus:border-orange-400"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-sm font-black text-stone-700">연락처</span>
          <input
            type="tel"
            value={form.phone || ""}
            onChange={(e) => onChange?.("phone", e.target.value)}
            placeholder="010-0000-0000"
            className="rounded-2xl border border-stone-200 px-4 py-4 font-bold outline-none transition focus:border-orange-400"
          />
        </label>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-black text-stone-700">예약 인원</span>
          <select
            value={selectedPeople}
            onChange={(e) => onChange?.("people", Number(e.target.value))}
            className="rounded-2xl border border-stone-200 px-4 py-4 font-bold outline-none transition focus:border-orange-400"
          >
            {PEOPLE_OPTIONS.map((people) => (
              <option key={people} value={people}>
                {people}명
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end">
          <button
            type="button"
            onClick={onSubmit}
            className="w-full rounded-2xl bg-stone-950 px-5 py-4 text-sm font-black text-white transition hover:translate-y-[-1px]"
          >
            예약 접수하기
          </button>
        </div>
      </div>

      {notice ? (
        <div className="mt-5 rounded-2xl border border-orange-100 bg-orange-50 px-4 py-4 text-sm font-black text-orange-700">
          {notice}
        </div>
      ) : null}
    </section>
  );
}
