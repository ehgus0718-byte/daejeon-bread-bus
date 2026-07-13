import { hasSupabaseConfig, supabaseClient } from "./supabaseClient.js";

const REVIEWS_TABLE = "customer_reviews";
const SETTINGS_TABLE = "review_settings";
const SETTINGS_ROW_ID = "default";

const REVIEW_COLUMNS =
  "id,author_name,content,rating,photo_url,profile_url,is_visible,is_featured,sort_order,likes_count,created_at,updated_at";

export const DEFAULT_REVIEW_SETTINGS = Object.freeze({
  autoplay: true,
  autoplay_speed_ms: 4000,
  slide_gap_px: 24,
  cards_desktop: 3,
  sort_mode: "order",
  theme: "light"
});

function ok(data = null, status = 200) {
  return { ok: true, data, error: null, status };
}

function fail(error, status = 0) {
  return { ok: false, data: null, error: String(error?.message || error || "unknown error"), status };
}

function notConfigured() {
  return fail("Supabase 설정이 없어 리뷰 기능을 사용할 수 없습니다.", 503);
}

function clampRating(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 5;
  return Math.min(5, Math.max(1, Math.round(n)));
}

function sanitizeReviewInput(input = {}) {
  return {
    author_name: String(input.author_name || "").trim().slice(0, 40),
    content: String(input.content || "").trim().slice(0, 2000),
    rating: clampRating(input.rating),
    photo_url: String(input.photo_url || "").trim() || null,
    profile_url: String(input.profile_url || "").trim() || null,
    is_visible: input.is_visible !== false,
    is_featured: input.is_featured === true,
    sort_order: Number.isFinite(Number(input.sort_order)) ? Number(input.sort_order) : 0
  };
}

export const reviewsClient = {
  async listAll() {
    if (!hasSupabaseConfig() || !supabaseClient) return notConfigured();
    const { data, error, status } = await supabaseClient
      .from(REVIEWS_TABLE)
      .select(REVIEW_COLUMNS)
      .order("is_featured", { ascending: false })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) return fail(error, status);
    return ok(Array.isArray(data) ? data : [], status);
  },

  async listVisible() {
    if (!hasSupabaseConfig() || !supabaseClient) return notConfigured();
    const { data, error, status } = await supabaseClient
      .from(REVIEWS_TABLE)
      .select(REVIEW_COLUMNS)
      .eq("is_visible", true)
      .order("is_featured", { ascending: false })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) return fail(error, status);
    return ok(Array.isArray(data) ? data : [], status);
  },

  async create(input) {
    if (!hasSupabaseConfig() || !supabaseClient) return notConfigured();
    const payload = sanitizeReviewInput(input);
    if (!payload.author_name || !payload.content) return fail("작성자 이름과 리뷰 내용을 입력해주세요.", 400);
    const { data, error, status } = await supabaseClient
      .from(REVIEWS_TABLE)
      .insert(payload)
      .select(REVIEW_COLUMNS)
      .single();
    if (error) return fail(error, status);
    return ok(data, status);
  },

  async update(id, input) {
    if (!hasSupabaseConfig() || !supabaseClient) return notConfigured();
    if (!id) return fail("리뷰 ID가 없습니다.", 400);
    const payload = sanitizeReviewInput(input);
    if (!payload.author_name || !payload.content) return fail("작성자 이름과 리뷰 내용을 입력해주세요.", 400);
    const { data, error, status } = await supabaseClient
      .from(REVIEWS_TABLE)
      .update(payload)
      .eq("id", id)
      .select(REVIEW_COLUMNS)
      .single();
    if (error) return fail(error, status);
    return ok(data, status);
  },

  async patch(id, partial) {
    if (!hasSupabaseConfig() || !supabaseClient) return notConfigured();
    if (!id) return fail("리뷰 ID가 없습니다.", 400);
    const { data, error, status } = await supabaseClient
      .from(REVIEWS_TABLE)
      .update(partial)
      .eq("id", id)
      .select(REVIEW_COLUMNS)
      .single();
    if (error) return fail(error, status);
    return ok(data, status);
  },

  async remove(id) {
    if (!hasSupabaseConfig() || !supabaseClient) return notConfigured();
    if (!id) return fail("리뷰 ID가 없습니다.", 400);
    const { error, status } = await supabaseClient.from(REVIEWS_TABLE).delete().eq("id", id);
    if (error) return fail(error, status);
    return ok(null, status);
  },

  async saveOrder(orderedIds) {
    if (!hasSupabaseConfig() || !supabaseClient) return notConfigured();
    const ids = Array.isArray(orderedIds) ? orderedIds : [];
    for (let i = 0; i < ids.length; i += 1) {
      const { error, status } = await supabaseClient
        .from(REVIEWS_TABLE)
        .update({ sort_order: i })
        .eq("id", ids[i]);
      if (error) return fail(error, status);
    }
    return ok(null, 200);
  },

  async getSettings() {
    if (!hasSupabaseConfig() || !supabaseClient) return ok({ ...DEFAULT_REVIEW_SETTINGS });
    const { data, error, status } = await supabaseClient
      .from(SETTINGS_TABLE)
      .select("*")
      .eq("id", SETTINGS_ROW_ID)
      .maybeSingle();
    if (error || !data) return ok({ ...DEFAULT_REVIEW_SETTINGS });
    return ok({ ...DEFAULT_REVIEW_SETTINGS, ...data }, status);
  },

  async saveSettings(partial = {}) {
    if (!hasSupabaseConfig() || !supabaseClient) return notConfigured();
    const payload = { id: SETTINGS_ROW_ID };
    if (typeof partial.autoplay === "boolean") payload.autoplay = partial.autoplay;
    if (Number.isFinite(Number(partial.autoplay_speed_ms))) {
      payload.autoplay_speed_ms = Math.min(20000, Math.max(1500, Number(partial.autoplay_speed_ms)));
    }
    if (Number.isFinite(Number(partial.slide_gap_px))) {
      payload.slide_gap_px = Math.min(64, Math.max(0, Number(partial.slide_gap_px)));
    }
    if (Number.isFinite(Number(partial.cards_desktop))) {
      payload.cards_desktop = Math.min(4, Math.max(1, Number(partial.cards_desktop)));
    }
    if (["order", "latest", "popular", "random"].includes(partial.sort_mode)) payload.sort_mode = partial.sort_mode;
    if (["light", "warm", "dark"].includes(partial.theme)) payload.theme = partial.theme;
    const { data, error, status } = await supabaseClient
      .from(SETTINGS_TABLE)
      .upsert(payload, { onConflict: "id" })
      .select("*")
      .single();
    if (error) return fail(error, status);
    return ok({ ...DEFAULT_REVIEW_SETTINGS, ...data }, status);
  }
};
