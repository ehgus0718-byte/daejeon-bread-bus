import { hasSupabaseConfig, supabaseClient } from "./supabaseClient.js";

const TABLE_NAME = ["admin", "settings"].join("_");
const ROW_ID = "default";
const COLUMNS = "id,capacity_overrides,price_overrides,schedule_status,schedule_details,updated_at";

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

function fromRow(row = {}) {
  return {
    capacityOverrides: record(row.capacity_overrides),
    priceOverrides: record(row.price_overrides),
    scheduleStatus: record(row.schedule_status),
    scheduleDetails: record(row.schedule_details),
    updatedAt: row.updated_at || ""
  };
}

function toRow(settings = {}) {
  return {
    id: ROW_ID,
    capacity_overrides: record(settings.capacityOverrides),
    price_overrides: record(settings.priceOverrides),
    schedule_status: record(settings.scheduleStatus),
    schedule_details: record(settings.scheduleDetails)
  };
}

function hasClient() {
  return hasSupabaseConfig() && Boolean(supabaseClient);
}

export async function loadSiteSettings() {
  if (!hasClient()) return fail(new Error("원격 설정 저장소를 사용할 수 없습니다."));

  const { data, error, status } = await supabaseClient
    .from(TABLE_NAME)
    .select(COLUMNS)
    .eq("id", ROW_ID)
    .single();

  if (error) return fail(error, status);
  return ok(fromRow(data), status);
}

export async function saveSiteSettings(settings = {}) {
  if (!hasClient()) return fail(new Error("원격 설정 저장소를 사용할 수 없습니다."));

  const { data, error, status } = await supabaseClient
    .from(TABLE_NAME)
    .upsert(toRow(settings), { onConflict: "id" })
    .select(COLUMNS)
    .single();

  if (error) return fail(error, status);
  return ok(fromRow(data), status);
}
