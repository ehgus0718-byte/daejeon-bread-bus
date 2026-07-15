import { hasSupabaseConfig, supabaseClient } from "./supabaseClient.js";

const POPUP_TABLE = "site_popup";
const POPUP_ROW_ID = "default";

export const DEFAULT_POPUP = Object.freeze({
  enabled: false,
  display_mode: "image",
  title: "",
  content: "",
  image_url: "",
  link_url: ""
});

function ok(data = null, status = 200) {
  return { ok: true, data, error: null, status };
}

function fail(error, status = 0) {
  return { ok: false, data: null, error: String(error?.message || error || "unknown error"), status };
}

function notConfigured() {
  return fail("Supabase 설정이 없어 팝업 기능을 사용할 수 없습니다.", 503);
}

function sanitizePopupInput(input = {}) {
  const displayMode = input.display_mode === "text" ? "text" : "image";
  return {
    id: POPUP_ROW_ID,
    enabled: input.enabled === true,
    display_mode: displayMode,
    title: String(input.title || "").trim().slice(0, 80),
    content: String(input.content || "").trim().slice(0, 2000),
    image_url: String(input.image_url || "").trim() || null,
    link_url: String(input.link_url || "").trim() || null,
    updated_at: new Date().toISOString()
  };
}

export const popupClient = {
  async getPopup() {
    if (!hasSupabaseConfig() || !supabaseClient) return ok({ ...DEFAULT_POPUP });
    const { data, error, status } = await supabaseClient
      .from(POPUP_TABLE)
      .select("*")
      .eq("id", POPUP_ROW_ID)
      .maybeSingle();
    if (error || !data) return ok({ ...DEFAULT_POPUP });
    return ok({ ...DEFAULT_POPUP, ...data }, status);
  },

  async savePopup(input = {}) {
    if (!hasSupabaseConfig() || !supabaseClient) return notConfigured();
    const payload = sanitizePopupInput(input);
    if (payload.enabled) {
      if (payload.display_mode === "image" && !payload.image_url) {
        return fail("이미지 팝업을 켜려면 이미지 URL을 입력해주세요.", 400);
      }
      if (payload.display_mode === "text" && !payload.title && !payload.content) {
        return fail("텍스트 팝업을 켜려면 제목 또는 내용을 입력해주세요.", 400);
      }
    }
    const { data, error, status } = await supabaseClient
      .from(POPUP_TABLE)
      .upsert(payload, { onConflict: "id" })
      .select("*")
      .single();
    if (error) return fail(error, status);
    return ok({ ...DEFAULT_POPUP, ...data }, status);
  }
};
