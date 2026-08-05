export const CHILD_MODE_DISCOUNT = "discount";
export const CHILD_MODE_PERCENT = "percent";
export const CHILD_MODE_FIXED = "fixed";

export const CHILD_MODES = [CHILD_MODE_DISCOUNT, CHILD_MODE_PERCENT, CHILD_MODE_FIXED];
export const ROUNDING_UNITS = [0, 100, 1000];

/**
 * 기본값은 기존 동작(성인가 - 10,000원)을 그대로 재현합니다.
 * 운영 중인 사이트의 가격이 배포만으로 바뀌면 안 되기 때문입니다.
 */
export const DEFAULT_PRICING_SETTINGS = {
  childMode: CHILD_MODE_DISCOUNT,
  childDiscount: 10000,
  childPercent: 30,
  childFixedPrice: 0,
  childRounding: 0,
  childMinPrice: 0,
  infantPrice: 0
};

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function toSafeInt(value, fallbackValue, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return fallbackValue;
  const rounded = Math.round(numberValue);
  if (rounded < min) return min;
  if (rounded > max) return max;
  return rounded;
}

function safeRoundingUnit(value) {
  const unit = toSafeInt(value, 0);
  return ROUNDING_UNITS.includes(unit) ? unit : 0;
}

/**
 * 어떤 값이 들어와도 항상 유효한 설정 객체를 돌려줍니다.
 */
export function normalizePricingSettings(settings) {
  const source = isRecord(settings) ? settings : {};
  const rawMode = String(source.childMode || "").trim().toLowerCase();
  const childMode = CHILD_MODES.includes(rawMode) ? rawMode : DEFAULT_PRICING_SETTINGS.childMode;

  return {
    childMode,
    childDiscount: toSafeInt(source.childDiscount, DEFAULT_PRICING_SETTINGS.childDiscount, { max: 1000000 }),
    childPercent: toSafeInt(source.childPercent, DEFAULT_PRICING_SETTINGS.childPercent, { max: 100 }),
    childFixedPrice: toSafeInt(source.childFixedPrice, DEFAULT_PRICING_SETTINGS.childFixedPrice, { max: 1000000 }),
    childRounding: safeRoundingUnit(source.childRounding),
    childMinPrice: toSafeInt(source.childMinPrice, DEFAULT_PRICING_SETTINGS.childMinPrice, { max: 1000000 }),
    infantPrice: toSafeInt(source.infantPrice, DEFAULT_PRICING_SETTINGS.infantPrice, { max: 1000000 })
  };
}

function applyRounding(amount, unit) {
  if (!unit || unit <= 0) return amount;
  return Math.round(amount / unit) * unit;
}

/**
 * 성인가로부터 아동 1인 요금을 계산합니다.
 * 계산 순서: 모드별 산출 → 반올림 → 하한선 적용 → 성인가 초과 방지
 */
export function calculateChildPrice(adultPrice, settings) {
  const config = normalizePricingSettings(settings);
  const safeAdultPrice = toSafeInt(adultPrice, 0, { max: 100000000 });

  let base;
  if (config.childMode === CHILD_MODE_PERCENT) {
    base = safeAdultPrice * ((100 - config.childPercent) / 100);
  } else if (config.childMode === CHILD_MODE_FIXED) {
    base = config.childFixedPrice;
  } else {
    base = safeAdultPrice - config.childDiscount;
  }

  const rounded =
    config.childMode === CHILD_MODE_FIXED
      ? Math.round(base)
      : applyRounding(Math.round(base), config.childRounding);

  const floored = Math.max(rounded, config.childMinPrice, 0);

  // 아동 요금이 성인 요금보다 비싸지는 상황은 어떤 설정으로도 만들지 않습니다.
  return Math.min(floored, safeAdultPrice);
}

export function calculateInfantPrice(settings) {
  return normalizePricingSettings(settings).infantPrice;
}

export function calculateTotalAmount({
  adultPrice = 0,
  adultCount = 0,
  childCount = 0,
  infantCount = 0,
  settings
}) {
  const safeAdultPrice = toSafeInt(adultPrice, 0, { max: 100000000 });
  const childPrice = calculateChildPrice(safeAdultPrice, settings);
  const infantPrice = calculateInfantPrice(settings);

  return (
    toSafeInt(adultCount, 0, { max: 1000 }) * safeAdultPrice +
    toSafeInt(childCount, 0, { max: 1000 }) * childPrice +
    toSafeInt(infantCount, 0, { max: 1000 }) * infantPrice
  );
}

/**
 * 관리자 화면 경고용. 설정이 위험하거나 헷갈릴 수 있는 조합을 짚어줍니다.
 */
export function describePricingRisks(settings, samplePrices = []) {
  const config = normalizePricingSettings(settings);
  const prices = samplePrices
    .map((price) => toSafeInt(price, 0))
    .filter((price) => price > 0);

  const risks = [];

  const freeAt = prices.filter((price) => calculateChildPrice(price, config) === 0);
  if (freeAt.length > 0) {
    risks.push("현재 설정으로 아동 요금이 0원이 되는 날짜가 있습니다. 하한선을 올려주세요.");
  }

  const sameAt = prices.filter(
    (price) => calculateChildPrice(price, config) === price && price > 0
  );
  if (sameAt.length > 0) {
    risks.push("아동 요금이 성인 요금과 같아지는 날짜가 있습니다.");
  }

  if (config.childMode === CHILD_MODE_FIXED && config.childFixedPrice === 0) {
    risks.push("고정 금액이 0원입니다. 아동이 무료로 결제됩니다.");
  }

  if (config.childMode === CHILD_MODE_DISCOUNT && prices.length > 1) {
    const rates = prices.map((price) =>
      Math.round(((price - calculateChildPrice(price, config)) / price) * 100)
    );
    const gap = Math.max(...rates) - Math.min(...rates);
    if (gap >= 10) {
      risks.push(
        `정액 할인이라 날짜별 할인율이 ${Math.min(...rates)}%~${Math.max(...rates)}%로 벌어집니다. 비율 할인 방식을 검토해보세요.`
      );
    }
  }

  return risks;
}
