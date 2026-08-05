import { hasSupabaseConfig, supabaseClient } from "./supabaseClient.js";
import { normalizeCalendarSettings } from "../core/calendarSettings.js";
import { normalizePricingSettings } from "../core/pricingSettings.js";

const TABLE_NAME = ["admin", "settings"].join("_");
const ROW_ID = "default";
const BASE_COLUMNS = "id,capacity_overrides,price_overrides,schedule_status,header_links,boarding_time,updated_at";
const EXTENDED_COLUMNS = "id,capacity_overrides,price_overrides,schedule_status,schedule_details,calendar_settings,pricing_settings,header_links,boarding_time,updated_at";
const SCHEDULE_DETAILS_FALLBACK_KEY = "__schedule_details__";
const CALENDAR_SETTINGS_FALLBACK_KEY = "__calendar_settings__";
const PRICING_SETTINGS_FALLBACK_KEY = "__pricing_settings__";

function ok(data = null, status = 200) {
  return { ok: true, data, error: null, status };
}

function fail(error, status = 0) {
  return { ok: false, data: null, error, status };
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function record(value) {
  return isRecord(value) ? value : {};
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeBoardingTime(value) {
  const s = String(value || "").trim();
  return s || "10:00";
}

function isMissingOptionalColumnError(error) {
  const message = String(error?.message || error?.details || error?.hint || "").toLowerCase();
  return (
    message.includes("schedule_details") ||
    message.includes("calendar_settings") ||
    message.includes("pricing_settings") ||
    message.includes("column")
  );
}

function splitScheduleStatusAndDetails(
  scheduleStatus = {},
  explicitScheduleDetails = {},
  explicitCalendarSettings = {},
  explicitPricingSettings = {}
) {
  const sourceStatus = record(scheduleStatus);
  const fallbackScheduleDetails = record(sourceStatus[SCHEDULE_DETAILS_FALLBACK_KEY]);
  const fallbackCalendarSettings = record(sourceStatus[CALENDAR_SETTINGS_FALLBACK_KEY]);
  const fallbackPricingSettings = record(sourceStatus[PRICING_SETTINGS_FALLBACK_KEY]);
  const nextScheduleStatus = { ...sourceStatus };
  delete nextScheduleStatus[SCHEDULE_DETAILS_FALLBACK_KEY];
  delete nextScheduleStatus[CALENDAR_SETTINGS_FALLBACK_KEY];
  delete nextScheduleStatus[PRICING_SETTINGS_FALLBACK_KEY];

  const explicitCalendar = record(explicitCalendarSettings);
  const hasExplicitCalendar = Object.keys(explicitCalendar).length > 0;
  const explicitPricing = record(explicitPricingSettings);
  const hasExplicitPricing = Object.keys(explicitPricing).length > 0;

  return {
    scheduleStatus: nextScheduleStatus,
    scheduleDetails: {
      ...fallbackScheduleDetails,
      ...record(explicitScheduleDetails)
    },
    calendarSettings: hasExplicitCalendar ? explicitCalendar : fallbackCalendarSettings,
    pricingSettings: hasExplicitPricing ? explicitPricing : fallbackPricingSettings
  };
}

function mergeScheduleDetailsIntoStatus(settings = {}) {
  return {
    ...record(settings.scheduleStatus),
    [SCHEDULE_DETAILS_FALLBACK_KEY]: record(settings.scheduleDetails),
    [CALENDAR_SETTINGS_FALLBACK_KEY]: normalizeCalendarSettings(settings.calendarSettings),
    [PRICING_SETTINGS_FALLBACK_KEY]: normalizePricingSettings(settings.pricingSettings)
  };
}

function fromRow(row = {}) {
  const splitSchedule = splitScheduleStatusAndDetails(
    row.schedule_status,
    row.schedule_details,
    row.calendar_settings,
    row.pricing_settings
  );

  return {
    capacityOverrides: record(row.capacity_overrides),
    priceOverrides: record(row.price_overrides),
    scheduleStatus: splitSchedule.scheduleStatus,
    scheduleDetails: splitSchedule.scheduleDetails,
    calendarSettings: normalizeCalendarSettings(splitSchedule.calendarSettings),
    pricingSettings: normalizePricingSettings(splitSchedule.pricingSettings),
    headerLinks: safeArray(row.header_links),
    boardingTime: safeBoardingTime(row.boarding_time),
    updatedAt: row.updated_at || ""
  };
}

function toExtendedRow(settings = {}) {
  return {
    id: ROW_ID,
    capacity_overrides: record(settings.capacityOverrides),
    price_overrides: record(settings.priceOverrides),
    schedule_status: record(settings.scheduleStatus),
    schedule_details: record(settings.scheduleDetails),
    calendar_settings: normalizeCalendarSettings(settings.calendarSettings),
    pricing_settings: normalizePricingSettings(settings.pricingSettings),
    header_links: safeArray(settings.headerLinks),
    boarding_time: safeBoardingTime(settings.boardingTime)
  };
}

function toFallbackRow(settings = {}) {
  return {
    id: ROW_ID,
    capacity_overrides: record(settings.capacityOverrides),
    price_overrides: record(settings.priceOverrides),
    schedule_status: mergeScheduleDetailsIntoStatus(settings),
    header_links: safeArray(settings.headerLinks),
    boarding_time: safeBoardingTime(settings.boardingTime)
  };
}

function hasClient() {
  return hasSupabaseConfig() && Boolean(supabaseClient);
}

async function loadSiteSettingsWithColumns(columns) {
  return supabaseClient
    .from(TABLE_NAME)
    .select(columns)
    .eq("id", ROW_ID)
    .single();
}

async function saveSiteSettingsWithColumns(row, columns) {
  return supabaseClient
    .from(TABLE_NAME)
    .upsert(row, { onConflict: "id" })
    .select(columns)
    .single();
}

export async function loadSiteSettings() {
  if (!hasClient()) return fail(new Error("원격 설정 저장소를 사용할 수 없습니다."));

  const extendedResult = await loadSiteSettingsWithColumns(EXTENDED_COLUMNS);

  if (!extendedResult.error) {
    return ok(fromRow(extendedResult.data), extendedResult.status);
  }

  if (!isMissingOptionalColumnError(extendedResult.error)) {
    return fail(extendedResult.error, extendedResult.status);
  }

  const fallbackResult = await loadSiteSettingsWithColumns(BASE_COLUMNS);

  if (fallbackResult.error) {
    return fail(fallbackResult.error, fallbackResult.status);
  }

  return ok(fromRow(fallbackResult.data), fallbackResult.status);
}

export async function saveSiteSettings(settings = {}) {
  if (!hasClient()) return fail(new Error("원격 설정 저장소를 사용할 수 없습니다."));

  const extendedResult = await saveSiteSettingsWithColumns(
    toExtendedRow(settings),
    EXTENDED_COLUMNS
  );

  if (!extendedResult.error) {
    return ok(fromRow(extendedResult.data), extendedResult.status);
  }

  if (!isMissingOptionalColumnError(extendedResult.error)) {
    return fail(extendedResult.error, extendedResult.status);
  }

  const fallbackResult = await saveSiteSettingsWithColumns(
    toFallbackRow(settings),
    BASE_COLUMNS
  );

  if (fallbackResult.error) {
    return fail(fallbackResult.error, fallbackResult.status);
  }

  return ok(fromRow(fallbackResult.data), fallbackResult.status);
}
