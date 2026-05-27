import React from "react";
import { formatCurrency, formatSeatCount } from "../core/formatters.js";
import SectionTitle from "./SectionTitle.jsx";

const LEGACY_PAYMENT_NOTICE = "예약이 저장되었습니다. 결제를 진행해주세요.";
const RESERVATION_RECEIVED_NOTICE =
  "예약이 접수되었습니다. 관리자가 연락처 확인 후 결제 계좌를 안내드리며, 입금 확인 후 예약이 확정됩니다.";

function toSafeNumber(value, fallbackValue = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallbackValue;
}

function toCount(value, fallbackValue = 0) {
  const numberValue = toSafeNumber(value, fallbackValue);
  return Math.max(0, Math.floor(numberValue));
}

function normalizeNoticeText(value = "") {
  return value === LEGACY_PAYMENT_NOTICE ? RESERVATION_RECEIVED_NOTICE : value;
}

function PassengerCounter({
  label,
  description,
  priceLabel,
  value = 0,
  onDecrease,
  onIncrease,
  disableDecrease = false,
  disableIncrease = false
}) {
  return (
    <div className="grid gap-3 border-stone-100 md:border-r md:pr-6 last:border-r-0 last:pr-0">
      <div>
        <div className="text-sm font-black text-stone-700">{label}</div>
        {description ? (
          <div className="mt-1 text-xs font-bold text-stone-400">{description}</div>
        ) : null}
        <div className="mt-3 text-base font-black text-stone-950">{priceLabel}</div>
      </div>

      <div className="grid max-w-[170px] grid-cols-[36px_1fr_36px] border border-stone-200 bg-white text-sm font-black text-stone-800">
        <button
          type="button"
          onClick={onDecrease}
          disabled={disableDecrease}
          className="border-r border-stone-200 py-3 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:text-stone-300"
          aria-label={`${label} 감소`}
        >
          -
        </button>
        <div className="flex items-center justify-center px-4 py-3">{value}</div>
        <button
          type="button"
          onClick={onIncrease}
          disabled={disableIncrease}
          className="border-l border-stone-200 py-3 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:text-stone-300"
          aria-label={`${label} 증가`}
        >
          +
        </button>
      </div>
    </div>
  );
}

export default function ReservationPanel({
  selectedDate,
  remainingSeats = 0,
  price = 0,
  form = {},
  onChange,
  onSubmit,
  notice,
  isSubmitting = false
}) {
  const safeRemainingSeats = Math.max(0, toSafeNumber(remainingSeats, 0));
  const adultCount = toCount(form.adultCount, 1);
  const childCount = toCount(form.childCount, 0);
  const infantCount = toCount(form.infantCount, 0);
  const selectedPeople = adultCount + childCount + infantCount;
  const safePrice = Math.max(0, toSafeNumber(price, 0));
  const childPrice = Math.max(0, safePrice - 10000);
  const totalAmount = adultCount * safePrice + childCount * childPrice;
  const displayNotice = normalizeNoticeText(notice);
  const hasAvailableSeats = safeRemainingSeats > 0;
  const hasValidPeopleSelection = selectedPeople >= 1 && selectedPeople <= safeRemainingSeats;
  const canSubmit = hasAvailableSeats && hasValidPeopleSelection && !isSubmitting;

  function updatePassengerCount(key, nextValue) {
    const nextAdultCount = key === "adultCount" ? nextValue : adultCount;
    const nextChildCount = key === "childCount" ? nextValue : childCount;
    const nextInfantCount = key === "infantCount" ? nextValue : infantCount;
    const nextPeople = nextAdultCount + nextChildCount + nextInfantCount;

    if (nextPeople > safeRemainingSeats) return;

    onChange?.(key, nextValue);
    onChange?.("people", nextPeople);
  }

  return (
    <section className="rounded-[2rem] border border-orange-100 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <SectionTitle
          eyebrow="Reservation"
          title="예약 정보 입력"
          description="선택한 날짜의 잔여 좌석과 결제 예정금액을 확인하고 예약 정보를 입력합니다."
        />
        <div className="rounded-full bg-orange-50 px-4 py-2 text-xs font-black text-orange-700">
          연락처 확인 후 예약 확정
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
            {formatSeatCount(safeRemainingSeats)}
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
        <p className="font-black text-orange-700">예약 및 결제 안내</p>
        <p className="mt-2">
          예약 접수 후 관리자가 연락처와 예약 내용을 확인한 뒤 결제 계좌를 안내드립니다.
        </p>
        <p className="mt-1 text-xs font-black text-stone-500">
          입금 확인 후 예약이 확정되며, 관리자 확인 전까지 예약 상태는 결제대기로 저장됩니다.
        </p>
      </div>

      <div className="mt-4 grid gap-3 rounded-3xl border border-stone-100 bg-stone-50 p-5 text-sm font-bold leading-6 text-stone-700 md:grid-cols-2">
        <div className="rounded-2xl bg-white p-4">
          <p className="font-black text-stone-950">예약 전 확인</p>
          <p className="mt-2 text-xs font-bold text-stone-500">
            실제 연락 가능한 휴대폰 번호로만 예약해 주세요. 연락처 확인이 어려우면 예약이 확정되지 않을 수 있습니다.
          </p>
        </div>
        <div className="rounded-2xl bg-white p-4">
          <p className="font-black text-stone-950">인원 기준</p>
          <p className="mt-2 text-xs font-bold text-stone-500">
            아동과 유아 기준은 현장 운영 기준에 따라 확인될 수 있습니다.
          </p>
        </div>
        <div className="rounded-2xl bg-white p-4">
          <p className="font-black text-stone-950">취소/변경 문의</p>
          <p className="mt-2 text-xs font-bold text-stone-500">
            예약 변경이나 취소는 관리자 확인 후 안내됩니다.
          </p>
        </div>
        <div className="rounded-2xl bg-white p-4">
          <p className="font-black text-stone-950">좌석 안내</p>
          <p className="mt-2 text-xs font-bold text-stone-500">
            잔여 좌석을 초과한 예약은 접수되지 않습니다.
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-black text-stone-700">예약자명</span>
          <input
            type="text"
            value={form.name || ""}
            onChange={(e) => onChange?.("name", e.target.value)}
            placeholder="예약자명을 입력해주세요"
            autoComplete="name"
            className="rounded-2xl border border-stone-200 px-4 py-4 font-bold outline-none transition focus:border-orange-400"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-sm font-black text-stone-700">연락처</span>
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={form.phone || ""}
            onChange={(e) => onChange?.("phone", e.target.value)}
            placeholder="휴대폰 번호를 입력해주세요"
            className="rounded-2xl border border-stone-200 px-4 py-4 font-bold outline-none transition focus:border-orange-400"
          />
        </label>
      </div>

      <div className="mt-6 rounded-3xl border border-stone-200 bg-stone-50 p-5">
        <div className="grid gap-6 md:grid-cols-3">
          <PassengerCounter
            label="성인"
            description="만 12세 이상"
            priceLabel={formatCurrency(safePrice)}
            value={adultCount}
            onDecrease={() => updatePassengerCount("adultCount", Math.max(0, adultCount - 1))}
            onIncrease={() => updatePassengerCount("adultCount", adultCount + 1)}
            disableDecrease={adultCount <= 0}
            disableIncrease={selectedPeople >= safeRemainingSeats}
          />
          <PassengerCounter
            label="아동"
            description="만 12세 미만"
            priceLabel={formatCurrency(childPrice)}
            value={childCount}
            onDecrease={() => updatePassengerCount("childCount", Math.max(0, childCount - 1))}
            onIncrease={() => updatePassengerCount("childCount", childCount + 1)}
            disableDecrease={childCount <= 0}
            disableIncrease={selectedPeople >= safeRemainingSeats}
          />
          <PassengerCounter
            label="유아"
            description="만 24개월 미만"
            priceLabel="0원"
            value={infantCount}
            onDecrease={() => updatePassengerCount("infantCount", Math.max(0, infantCount - 1))}
            onIncrease={() => updatePassengerCount("infantCount", infantCount + 1)}
            disableDecrease={infantCount <= 0}
            disableIncrease={selectedPeople >= safeRemainingSeats}
          />
        </div>

        <div className="mt-5 flex flex-col gap-4 border-t border-stone-200 pt-5 md:flex-row md:items-center md:justify-between">
          <div className="text-sm font-black text-stone-700">
            총 인원 {selectedPeople}명 · 총 금액
            <span className="ml-3 text-2xl text-stone-950">{formatCurrency(totalAmount)}</span>
          </div>
          <button
            type="button"
            onClick={canSubmit ? onSubmit : undefined}
            disabled={!canSubmit}
            className="rounded-2xl bg-red-500 px-10 py-4 text-sm font-black text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-stone-300"
          >
            {isSubmitting
              ? "예약 접수 중..."
              : hasAvailableSeats
                ? "예약하기"
                : "잔여 좌석 없음"}
          </button>
        </div>

        {!hasValidPeopleSelection ? (
          <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-xs font-black text-red-600">
            예약 인원은 최소 1명 이상이며 잔여 좌석을 초과할 수 없습니다.
          </div>
        ) : null}
      </div>

      {displayNotice ? (
        <div className="mt-5 rounded-2xl border border-orange-100 bg-orange-50 px-4 py-4 text-sm font-black text-orange-700">
          {displayNotice}
        </div>
      ) : null}
    </section>
  );
}
