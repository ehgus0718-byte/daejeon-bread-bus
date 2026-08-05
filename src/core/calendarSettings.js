export const CALENDAR_MODE_AUTO = "auto";
export const CALENDAR_MODE_MANUAL = "manual";

export const MIN_MONTH_COUNT = 1;
export const MAX_MONTH_COUNT = 4;
export const DEFAULT_MONTH_COUNT = 2;

const MONTH_KEY_PATTERN = /^(\d{4})-(\d{2})$/;

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isValidDate(value) {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

/**
 * "2026-08" 형태의 월 키를 만듭니다.
 */
export function formatMonthKey(date) {
  const safeDate = isValidDate(date) ? date : new Date();
  return `${safeDate.getFullYear()}-${String(safeDate.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * "2026-08" 형태의 월 키를 해당 월 1일 Date로 변환합니다.
 * 형식이 잘못되었거나 실제 존재하지 않는 월이면 null을 반환합니다.
 */
export function parseMonthKey(monthKey) {
  const matched = MONTH_KEY_PATTERN.exec(String(monthKey || "").trim());
  if (!matched) return null;

  const year = Number(matched[1]);
  const month = Number(matched[2]);

  if (!Number.isFinite(year) || year < 2000 || year > 2100) return null;
  if (!Number.isFinite(month) || month < 1 || month > 12) return null;

  const date = new Date(year, month - 1, 1);
  return isValidDate(date) ? date : null;
}

function safeMonthCount(value) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return DEFAULT_MONTH_COUNT;
  const rounded = Math.round(numberValue);
  if (rounded < MIN_MONTH_COUNT) return MIN_MONTH_COUNT;
  if (rounded > MAX_MONTH_COUNT) return MAX_MONTH_COUNT;
  return rounded;
}

/**
 * 어떤 형태의 값이 들어와도 항상 유효한 설정 객체를 돌려줍니다.
 * 저장값이 비어 있으면 "자동(현재월)" 기본값이 됩니다.
 */
export function normalizeCalendarSettings(settings) {
  const source = isRecord(settings) ? settings : {};
  const rawMode = String(source.mode || "").trim().toLowerCase();
  const mode = rawMode === CALENDAR_MODE_MANUAL ? CALENDAR_MODE_MANUAL : CALENDAR_MODE_AUTO;

  const parsedStartMonth = parseMonthKey(source.startMonth);

  return {
    mode,
    startMonth: parsedStartMonth ? formatMonthKey(parsedStartMonth) : "",
    monthCount: safeMonthCount(source.monthCount)
  };
}

/**
 * 달력이 실제로 시작할 월의 1일 Date를 계산합니다.
 * - 자동 모드: 항상 오늘이 속한 달
 * - 직접 지정 모드: 저장된 월. 값이 유효하지 않으면 자동과 동일하게 동작(안전 폴백)
 */
export function resolveCalendarStartDate(settings, referenceDate = new Date()) {
  const now = isValidDate(referenceDate) ? referenceDate : new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const normalized = normalizeCalendarSettings(settings);

  if (normalized.mode !== CALENDAR_MODE_MANUAL) return currentMonthStart;

  const manualStart = parseMonthKey(normalized.startMonth);
  return manualStart || currentMonthStart;
}

/**
 * 관리자 화면에서 "지금 고객에게 무엇이 보이는지" 안내하기 위한 월 목록입니다.
 */
export function resolveVisibleMonthKeys(settings, referenceDate = new Date()) {
  const normalized = normalizeCalendarSettings(settings);
  const startDate = resolveCalendarStartDate(normalized, referenceDate);

  return Array.from({ length: normalized.monthCount }, (unused, index) =>
    formatMonthKey(new Date(startDate.getFullYear(), startDate.getMonth() + index, 1))
  );
}

/**
 * 직접 지정 모드인데 시작월이 과거로 굳어 있는지 판단합니다. (관리자 경고용)
 */
export function isCalendarStartOutdated(settings, referenceDate = new Date()) {
  const normalized = normalizeCalendarSettings(settings);
  if (normalized.mode !== CALENDAR_MODE_MANUAL) return false;

  const manualStart = parseMonthKey(normalized.startMonth);
  if (!manualStart) return false;

  const now = isValidDate(referenceDate) ? referenceDate : new Date();
  const lastVisible = new Date(
    manualStart.getFullYear(),
    manualStart.getMonth() + normalized.monthCount - 1,
    1
  );
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  return lastVisible.getTime() < currentMonthStart.getTime();
}
