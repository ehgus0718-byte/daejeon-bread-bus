import React, { useMemo } from "react";
import { formatCurrency } from "../core/formatters.js";
import {
  CHILD_MODE_DISCOUNT,
  CHILD_MODE_FIXED,
  CHILD_MODE_PERCENT,
  ROUNDING_UNITS,
  calculateChildPrice,
  describePricingRisks,
  normalizePricingSettings
} from "../core/pricingSettings.js";

const MODE_CARDS = [
  {
    mode: CHILD_MODE_PERCENT,
    title: "비율 할인",
    hint: "성인가의 일정 비율. 날짜마다 성인가가 달라도 할인율이 일정하게 유지됩니다.",
    badge: "권장"
  },
  {
    mode: CHILD_MODE_DISCOUNT,
    title: "정액 할인",
    hint: "성인가에서 정해진 금액을 뺍니다. 성인가가 낮은 날일수록 할인율이 커집니다."
  },
  {
    mode: CHILD_MODE_FIXED,
    title: "고정 금액",
    hint: "성인가와 무관하게 아동 요금을 하나로 통일합니다."
  }
];

function NumberField({ id, label, value, suffix, onChange, step = 1000, max, disabled }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-xs font-black text-stone-600">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="number"
          min={0}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-36 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-right text-base font-black text-stone-950 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:bg-stone-100 disabled:text-stone-400"
        />
        <span className="text-sm font-black text-stone-500">{suffix}</span>
      </div>
    </div>
  );
}

export default function AdminPricingControl({
  pricingSettings = {},
  priceOverrides = {},
  onUpdatePricingSettings
}) {
  const settings = normalizePricingSettings(pricingSettings);

  const samplePrices = useMemo(() => {
    const values = Object.values(priceOverrides)
      .map((price) => Number(price))
      .filter((price) => Number.isFinite(price) && price > 0);
    const unique = Array.from(new Set(values)).sort((a, b) => a - b);
    return unique.length > 0 ? unique.slice(0, 6) : [30000, 40000, 50000];
  }, [priceOverrides]);

  const hasRealPrices = Object.keys(priceOverrides).length > 0;
  const risks = describePricingRisks(settings, samplePrices);

  function update(patch) {
    onUpdatePricingSettings?.({ ...settings, ...patch });
  }

  return (
    <section className="rounded-[2rem] border border-stone-200 bg-white p-6">
      <div>
        <p className="text-xs font-black tracking-[0.2em] text-orange-600">PRICING</p>
        <h3 className="mt-1 text-2xl font-black text-stone-950">아동 · 유아 요금 설정</h3>
        <p className="mt-2 text-sm font-bold leading-6 text-stone-600">
          성인 요금은 아래 <span className="font-black text-orange-700">날짜별 가격</span>에서 정하고,
          아동 요금은 여기서 정한 규칙으로 자동 계산됩니다.
        </p>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {MODE_CARDS.map((card) => {
          const isActive = settings.childMode === card.mode;
          return (
            <button
              key={card.mode}
              type="button"
              onClick={() => update({ childMode: card.mode })}
              className={`rounded-2xl border p-4 text-left transition ${
                isActive
                  ? "border-orange-400 bg-orange-50 shadow-sm"
                  : "border-stone-200 bg-white hover:border-orange-200"
              }`}
            >
              <p className="flex items-center gap-2 text-sm font-black text-stone-950">
                {card.title}
                {isActive ? <span className="text-orange-600">✓</span> : null}
                {card.badge ? (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-black text-green-700">
                    {card.badge}
                  </span>
                ) : null}
              </p>
              <p className="mt-1 text-xs font-bold leading-5 text-stone-600">{card.hint}</p>
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap items-end gap-5">
        {settings.childMode === CHILD_MODE_PERCENT ? (
          <NumberField
            id="child-percent"
            label="할인율"
            suffix="%"
            step={5}
            max={100}
            value={settings.childPercent}
            onChange={(value) => update({ childPercent: value })}
          />
        ) : null}

        {settings.childMode === CHILD_MODE_DISCOUNT ? (
          <NumberField
            id="child-discount"
            label="할인 금액"
            suffix="원"
            value={settings.childDiscount}
            onChange={(value) => update({ childDiscount: value })}
          />
        ) : null}

        {settings.childMode === CHILD_MODE_FIXED ? (
          <NumberField
            id="child-fixed"
            label="아동 고정 요금"
            suffix="원"
            value={settings.childFixedPrice}
            onChange={(value) => update({ childFixedPrice: value })}
          />
        ) : null}

        {settings.childMode !== CHILD_MODE_FIXED ? (
          <div className="flex flex-col gap-2">
            <label htmlFor="child-rounding" className="text-xs font-black text-stone-600">
              끝자리 반올림
            </label>
            <select
              id="child-rounding"
              value={settings.childRounding}
              onChange={(e) => update({ childRounding: Number(e.target.value) })}
              className="w-40 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-base font-black text-stone-950 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            >
              {ROUNDING_UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit === 0 ? "안 함" : `${unit.toLocaleString()}원 단위`}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <NumberField
          id="child-min"
          label="최소 요금 (하한선)"
          suffix="원"
          value={settings.childMinPrice}
          onChange={(value) => update({ childMinPrice: value })}
        />

        <NumberField
          id="infant-price"
          label="유아 요금"
          suffix="원"
          value={settings.infantPrice}
          onChange={(value) => update({ infantPrice: value })}
        />
      </div>

      <div className="mt-6 rounded-[1.5rem] border border-orange-100 bg-orange-50 p-4">
        <p className="text-xs font-black text-stone-500">
          {hasRealPrices ? "등록된 성인가 기준 아동 요금 미리보기" : "예시 미리보기 (등록된 날짜별 가격이 없습니다)"}
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[320px] text-left text-sm">
            <thead>
              <tr className="text-xs font-black text-stone-500">
                <th className="pb-2 pr-4">성인</th>
                <th className="pb-2 pr-4">아동</th>
                <th className="pb-2">할인율</th>
              </tr>
            </thead>
            <tbody>
              {samplePrices.map((price) => {
                const childPrice = calculateChildPrice(price, settings);
                const rate = price > 0 ? Math.round(((price - childPrice) / price) * 100) : 0;
                return (
                  <tr key={price} className="border-t border-orange-100">
                    <td className="py-2 pr-4 font-bold text-stone-700">{formatCurrency(price)}</td>
                    <td className="py-2 pr-4 font-black text-orange-800">{formatCurrency(childPrice)}</td>
                    <td className="py-2 font-bold text-stone-500">{rate}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs font-bold text-stone-500">💡 변경 즉시 자동 저장되며 고객 화면에 바로 반영됩니다.</p>
      </div>

      {risks.length > 0 ? (
        <div className="mt-3 rounded-[1.5rem] border border-red-200 bg-red-50 p-4">
          <p className="text-xs font-black text-red-700">⚠️ 확인이 필요합니다</p>
          <ul className="mt-2 space-y-1">
            {risks.map((risk) => (
              <li key={risk} className="text-xs font-bold leading-5 text-stone-700">
                · {risk}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
